package com.scamshield.domain;

import java.time.Instant;
import java.util.UUID;

public class ScanFinding {
    private final UUID id;
    private final Scan scan;
    private final String category;
    private final String severity;
    private final String title;
    private final String description;
    private final String evidenceSource;
    private final boolean verified;
    private final Instant createdAt;

    public ScanFinding(Scan scan, String category, String severity, String title, String description, String source) {
        this(UUID.randomUUID(), scan, category, severity, title, description, source, false, Instant.now());
    }

    public ScanFinding(UUID id, Scan scan, String category, String severity, String title,
                       String description, String source, boolean verified, Instant createdAt) {
        this.id = id;
        this.scan = scan;
        this.category = category;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.evidenceSource = source;
        this.verified = verified;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public Scan getScan() { return scan; }
    public String getCategory() { return category; }
    public String getSeverity() { return severity; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getEvidenceSource() { return evidenceSource; }
    public boolean isVerified() { return verified; }
    public Instant getCreatedAt() { return createdAt; }
}