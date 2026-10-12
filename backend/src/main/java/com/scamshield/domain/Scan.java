package com.scamshield.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Scan {
    private final UUID id;
    private final UUID userId;
    private final ScanType scanType;
    private final String submittedContent;
    private final Integer riskScore;
    private final RiskLevel riskLevel;
    private final String verdict;
    private final String analysisStatus;
    private final Instant createdAt;
    private final Instant completedAt;
    private final List<ScanFinding> findings = new ArrayList<>();

    public Scan(AppUser user, ScanType scanType, String content, Integer score, RiskLevel risk, String verdict) {
        this(UUID.randomUUID(), user.getId(), scanType, content, score, risk, verdict,
            "DEMO_HEURISTIC", Instant.now(), Instant.now());
    }

    public Scan(UUID id, UUID userId, ScanType scanType, String content, Integer score, RiskLevel risk,
                String verdict, String analysisStatus, Instant createdAt, Instant completedAt) {
        this.id = id;
        this.userId = userId;
        this.scanType = scanType;
        this.submittedContent = content;
        this.riskScore = score;
        this.riskLevel = risk;
        this.verdict = verdict;
        this.analysisStatus = analysisStatus;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public void addFinding(ScanFinding finding) { findings.add(finding); }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public ScanType getScanType() { return scanType; }
    public String getSubmittedContent() { return submittedContent; }
    public Integer getRiskScore() { return riskScore; }
    public RiskLevel getRiskLevel() { return riskLevel; }
    public String getVerdict() { return verdict; }
    public String getAnalysisStatus() { return analysisStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public List<ScanFinding> getFindings() { return findings; }

    public enum ScanType { URL, SMS, EMAIL, QR }
    public enum RiskLevel { LOW, MEDIUM, HIGH }
}