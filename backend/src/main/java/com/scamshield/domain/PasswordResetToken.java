package com.scamshield.domain;

import java.time.Instant;
import java.util.UUID;

public class PasswordResetToken {
    private final UUID id;
    private final UUID userId;
    private final String tokenHash;
    private final Instant expiresAt;
    private final Instant createdAt;
    private final Instant usedAt;

    public PasswordResetToken(AppUser user, String tokenHash, Instant expiresAt) {
        this(UUID.randomUUID(), user.getId(), tokenHash, expiresAt, Instant.now(), null);
    }

    public PasswordResetToken(UUID id, UUID userId, String tokenHash, Instant expiresAt, Instant createdAt, Instant usedAt) {
        this.id = id; this.userId = userId; this.tokenHash = tokenHash;
        this.expiresAt = expiresAt; this.createdAt = createdAt; this.usedAt = usedAt;
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUsedAt() { return usedAt; }
    public boolean isUsableAt(Instant now) { return usedAt == null && expiresAt.isAfter(now); }
}