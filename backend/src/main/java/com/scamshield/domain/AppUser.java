package com.scamshield.domain;

import java.time.Instant;
import java.util.UUID;

public class AppUser {
    private final UUID id;
    private final String fullName;
    private final String email;
    private String passwordHash;
    private final Role role;
    private final boolean enabled;
    private final Instant createdAt;
    private Instant updatedAt;

    public AppUser(String fullName, String email, String passwordHash) {
        this(UUID.randomUUID(), fullName, email, passwordHash, Role.USER, true, Instant.now(), Instant.now());
    }

    public AppUser(UUID id, String fullName, String email, String passwordHash, Role role,
                   boolean enabled, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public boolean isEnabled() { return enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; this.updatedAt = Instant.now(); }
    public enum Role { USER, ADMIN }
}