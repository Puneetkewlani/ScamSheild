package com.scamshield.service;

import com.scamshield.domain.AppUser;
import com.scamshield.domain.Scan;
import com.scamshield.domain.Scan.RiskLevel;
import com.scamshield.domain.ScanFinding;
import com.scamshield.repository.ScanRepository;
import com.scamshield.repository.UserRepository;
import com.scamshield.web.ScanDtos.CreateScanRequest;
import com.scamshield.web.ScanDtos.DashboardSummary;
import com.scamshield.web.ScanDtos.PageResponse;
import com.scamshield.web.ScanDtos.ScanResponse;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ScanService {
    private final ScanRepository scans;
    private final UserRepository users;
    private final ScanAnalysisService analyzer;

    public ScanService(ScanRepository scans, UserRepository users, ScanAnalysisService analyzer) {
        this.scans = scans;
        this.users = users;
        this.analyzer = analyzer;
    }

    public ScanResponse create(String email, CreateScanRequest request) {
        AppUser user = users.findByEmail(email).orElseThrow();
        String content = request.content().trim();
        if (content.isEmpty()) throw new IllegalArgumentException("Submitted content cannot be empty.");
        var analysis = analyzer.analyze(content);
        var scan = new Scan(user, request.type(), content, analysis.score(), analysis.risk(), analysis.summary());
        analysis.findings().forEach(finding -> scan.addFinding(new ScanFinding(scan, finding.category(), finding.severity(),
            finding.title(), finding.description(), "DEMO_HEURISTIC")));
        return ScanResponse.from(scans.save(scan), analysis.recommendations());
    }

    public PageResponse<ScanResponse> history(String email, int page, int size, String sort, String query, String risk) {
        var user = users.findByEmail(email).orElseThrow();
        int safeSize = Math.max(1, Math.min(size, 100));
        int safePage = Math.max(0, page);
        RiskLevel riskFilter;
        try {
            riskFilter = risk == null || risk.isBlank()
                ? null : RiskLevel.valueOf(risk.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid risk filter.");
        }
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        var matching = scans.findOwned(user.getId()).stream()
            .filter(scan -> riskFilter == null || scan.getRiskLevel() == riskFilter)
            .filter(scan -> normalizedQuery.isEmpty()
                || scan.getSubmittedContent().toLowerCase(Locale.ROOT).contains(normalizedQuery)
                || scan.getVerdict().toLowerCase(Locale.ROOT).contains(normalizedQuery))
            .sorted(scanComparator(sort))
            .toList();
        long total = matching.size();
        long offset = (long) safePage * safeSize;
        int start = (int) Math.min(offset, total);
        int end = Math.min(start + safeSize, matching.size());
        int totalPages = (int) ((total + safeSize - 1) / safeSize);
        var responses = matching.subList(start, end).stream()
            .map(scan -> ScanResponse.from(scan, recommendations(scan.getRiskLevel()))).toList();
        return new PageResponse<>(responses, safePage, safeSize, total, totalPages,
            safePage == 0, totalPages == 0 || safePage >= totalPages - 1);
    }

    public ScanResponse get(String email, UUID id) {
        var scan = owned(email, id);
        return ScanResponse.from(scan, recommendations(scan.getRiskLevel()));
    }

    public void delete(String email, UUID id) {
        var scan = owned(email, id);
        scans.deleteById(scan.getId());
    }

    public DashboardSummary summary(String email) {
        var user = users.findByEmail(email).orElseThrow();
        var userScans = scans.findOwned(user.getId());
        var recent = userScans.stream().sorted((first, second) -> second.getCreatedAt().compareTo(first.getCreatedAt())).limit(5)
            .map(scan -> ScanResponse.from(scan, recommendations(scan.getRiskLevel()))).toList();
        return new DashboardSummary(userScans.size(), count(userScans, RiskLevel.LOW),
            count(userScans, RiskLevel.MEDIUM), count(userScans, RiskLevel.HIGH), recent);
    }

    private Scan owned(String email, UUID id) {
        var user = users.findByEmail(email).orElseThrow();
        return scans.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scan not found."));
    }

    private static long count(List<Scan> scans, RiskLevel risk) {
        return scans.stream().filter(scan -> scan.getRiskLevel() == risk).count();
    }

    private static Comparator<Scan> scanComparator(String sort) {
        if ("score-low".equals(sort)) return (first, second) -> Integer.compare(first.getRiskScore(), second.getRiskScore());
        if (sort != null && sort.startsWith("score")) return (first, second) -> Integer.compare(second.getRiskScore(), first.getRiskScore());
        if ("oldest".equals(sort)) return (first, second) -> first.getCreatedAt().compareTo(second.getCreatedAt());
        return (first, second) -> second.getCreatedAt().compareTo(first.getCreatedAt());
    }

    private static List<String> recommendations(RiskLevel risk) {
        return risk == RiskLevel.HIGH
            ? List.of("Do not follow links or contact details in the submitted content.", "Verify the request through a trusted, separate channel.", "Do not share passwords, verification codes, or payment details.")
            : List.of("Pause before responding or paying.", "Verify the sender and destination independently.", "A low demo score does not establish that content is safe.");
    }
}
