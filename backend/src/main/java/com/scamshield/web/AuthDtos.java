package com.scamshield.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() { }

    public record RegisterRequest(
        @NotBlank(message = "Enter your full name.") @Size(max = 120, message = "Full name must be 120 characters or fewer.") String fullName,
        @NotBlank(message = "Enter your email.") @Email(message = "Enter a valid email address.") @Size(max = 254, message = "Email must be 254 characters or fewer.") String email,
        @NotBlank(message = "Enter a password.") @Size(min = 12, max = 128, message = "Use a password between 12 and 128 characters.") String password,
        @NotBlank(message = "Confirm your password.") String passwordConfirmation) { }

    public record LoginRequest(@NotBlank @Email @Size(max = 254) String email,
                               @NotBlank @Size(max = 128) String password) { }
    public record ForgotPasswordRequest(@NotBlank @Email @Size(max = 254) String email) { }
    public record ResetPasswordRequest(@NotBlank @Size(max = 128) String token,
                                       @NotBlank @Size(min = 12, max = 128) String password) { }
    public record UserResponse(UUID id, String fullName, String email, String role, Instant createdAt) { }
    public record AuthResponse(UserResponse user) { }
    public record MessageResponse(String message) { }
}