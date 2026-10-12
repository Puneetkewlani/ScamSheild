package com.scamshield.service;

import com.scamshield.config.AppProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class LoginRateLimiter {
    private final ConcurrentHashMap<String, Window> attempts = new ConcurrentHashMap<>();
    private final int limit;
    private final Duration window;

    public LoginRateLimiter(AppProperties properties) {
        limit = properties.loginAttemptLimit();
        window = Duration.ofMinutes(properties.loginWindowMinutes());
    }

    public boolean allow(String key) {
        var now = Instant.now();
        var current = attempts.compute(key, (ignored, old) -> old == null || old.startedAt().plus(window).isBefore(now)
            ? new Window(now, 1) : new Window(old.startedAt(), old.count() + 1));
        if (attempts.size() > 10_000) attempts.entrySet().removeIf(entry -> entry.getValue().startedAt().plus(window).isBefore(now));
        return current.count() <= limit;
    }

    private record Window(Instant startedAt, int count) { }
}