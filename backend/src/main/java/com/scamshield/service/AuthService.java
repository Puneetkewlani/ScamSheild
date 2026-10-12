package com.scamshield.service;

import com.scamshield.config.AppProperties;
import com.scamshield.domain.AppUser;
import com.scamshield.domain.PasswordResetToken;
import com.scamshield.repository.PasswordResetRepository;
import com.scamshield.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordResetRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final AppProperties properties;
    private final String mailHost;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository users, PasswordResetRepository resetTokens, PasswordEncoder passwordEncoder,
                       ObjectProvider<JavaMailSender> mailSender, AppProperties properties,
                       @Value("${spring.mail.host:}") String mailHost) {
        this.users = users; this.resetTokens = resetTokens; this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender; this.properties = properties; this.mailHost = mailHost;
    }

    public AppUser register(String fullName, String email, String password, String confirmation) {
        if (!password.equals(confirmation)) throw new IllegalArgumentException("Passwords do not match.");
        if (!strongPassword(password)) throw new IllegalArgumentException("Use a password with uppercase, lowercase, number, and symbol characters.");
        var normalizedEmail = normalizeEmail(email);
        if (users.existsByEmail(normalizedEmail)) throw new IllegalArgumentException("An account with this email already exists.");
        return users.save(new AppUser(fullName.trim(), normalizedEmail, passwordEncoder.encode(password)));
    }

    public void requestPasswordReset(String email) {
        if (mailHost.isBlank()) return;
        users.findByEmail(normalizeEmail(email)).ifPresent(user -> {
            if (!user.isEnabled()) return;
            byte[] tokenBytes = new byte[32];
            secureRandom.nextBytes(tokenBytes);
            var rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            resetTokens.save(new PasswordResetToken(user, sha256(rawToken), Instant.now().plus(30, ChronoUnit.MINUTES)));
            var message = new SimpleMailMessage();
            message.setFrom(properties.mailFrom());
            message.setTo(user.getEmail());
            message.setSubject("Reset your ScamShield password");
            message.setText("Use this one-time link within 30 minutes: " + properties.resetUrl() + "?token=" + rawToken);
            mailSender.getObject().send(message);
        });
    }

    public boolean resetPassword(String rawToken, String password) {
        if (!strongPassword(password)) throw new IllegalArgumentException("Use a password with uppercase, lowercase, number, and symbol characters.");
        var tokenHash = sha256(rawToken);
        var token = resetTokens.findByTokenHash(tokenHash).orElse(null);
        var now = Instant.now();
        if (token == null || !token.isUsableAt(now)) return false;
        return resetTokens.consumeAndChangePassword(tokenHash, passwordEncoder.encode(password), now);
    }

    public static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }

    private static boolean strongPassword(String password) {
        return password.length() >= 12 && password.length() <= 128
            && password.chars().anyMatch(Character::isUpperCase)
            && password.chars().anyMatch(Character::isLowerCase)
            && password.chars().anyMatch(Character::isDigit)
            && password.chars().anyMatch(character -> !Character.isLetterOrDigit(character));
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}