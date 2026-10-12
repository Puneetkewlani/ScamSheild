package com.scamshield.web;

import com.scamshield.domain.Scan;
import com.scamshield.domain.ScanFinding;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ScanDtos {
    private ScanDtos() { }

    public record CreateScanRequest(@NotNull Scan.ScanType type,
                                    @NotBlank @Size(max = 5000) String content) { }
    public record FindingResponse(String category, String title, String explanation, String status,
                                  boolean verified, String evidenceSource) { }
    public record ScanResponse(UUID id, String content, String type, Instant createdAt, Integer score,
                               String risk, String summary, List<FindingResponse> findings,
                               List<String> recommendations, boolean demo, String analysisStatus) {
        public static ScanResponse from(Scan scan, List<String> recommendations) {
            var findings = scan.getFindings().stream().map(ScanDtos::finding).toList();
            return new ScanResponse(scan.getId(), scan.getSubmittedContent(), scan.getScanType().name(), scan.getCreatedAt(),
                scan.getRiskScore(), scan.getRiskLevel().name().toLowerCase(java.util.Locale.ROOT), scan.getVerdict(),
                findings, recommendations, true, scan.getAnalysisStatus());
        }
    }
    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages,
                                  boolean first, boolean last) { }
    public record DashboardSummary(long scanCount, long lowCount, long mediumCount, long highCount,
                                   List<ScanResponse> recentActivity) { }

    private static FindingResponse finding(ScanFinding finding) {
        return new FindingResponse(finding.getCategory(), finding.getTitle(), finding.getDescription(),
            finding.getSeverity().toLowerCase(java.util.Locale.ROOT), finding.isVerified(), finding.getEvidenceSource());
    }
}