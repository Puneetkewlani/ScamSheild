package com.scamshield.service;

import com.scamshield.config.AppProperties;
import com.scamshield.repository.PasswordResetRepository;
import com.scamshield.repository.ScanRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DataRetentionTask {
    private final ScanRepository scans;
    private final PasswordResetRepository resetTokens;
    private final AppProperties properties;

    public DataRetentionTask(ScanRepository scans, PasswordResetRepository resetTokens, AppProperties properties) {
        this.scans = scans; this.resetTokens = resetTokens; this.properties = properties;
    }

    @Scheduled(cron = "0 20 3 * * *", zone = "UTC")
    public void removeExpiredData() {
        var now = Instant.now();
        scans.deleteByCreatedAtBefore(now.minus(properties.scanRetentionDays(), ChronoUnit.DAYS));
        resetTokens.deleteByExpiresAtBefore(now);
    }
}