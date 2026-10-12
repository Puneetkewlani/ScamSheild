package com.scamshield.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.scamshield.config.AppProperties;
import com.scamshield.domain.AppUser;
import com.scamshield.repository.PasswordResetRepository;
import com.scamshield.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock PasswordResetRepository resetTokens;
    @Mock PasswordEncoder passwordEncoder;
    @Mock ObjectProvider<JavaMailSender> mailSender;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        var properties = new AppProperties("http://localhost:5173", "http://localhost:5173/reset-password",
            "no-reply@example.com", 90, 10, 15);
        authService = new AuthService(users, resetTokens, passwordEncoder, mailSender, properties, "");
    }

    @Test
    void registrationNormalizesEmailAndStoresOnlyEncodedPassword() {
        String password = "StrongPass!1234";
        when(users.existsByEmail("sam@example.com")).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn("bcrypt-hash");
        when(users.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var user = authService.register("Sam User", "  Sam@Example.com ", password, password);

        assertEquals("sam@example.com", user.getEmail());
        assertNotEquals(password, user.getPasswordHash());
        assertEquals("bcrypt-hash", user.getPasswordHash());
        verify(users).save(user);
    }

    @Test
    void duplicateEmailIsRejectedBeforeCreatingAnotherUser() {
        when(users.existsByEmail("sam@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(
            "Sam User", "Sam@Example.com", "StrongPass!1234", "StrongPass!1234"));

        verify(users, never()).save(any(AppUser.class));
    }
}
