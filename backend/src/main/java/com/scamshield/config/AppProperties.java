package com.scamshield.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(String frontendOrigin, String resetUrl, String mailFrom,
                            int scanRetentionDays, int loginAttemptLimit, int loginWindowMinutes) { }