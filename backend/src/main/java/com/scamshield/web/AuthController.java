package com.scamshield.web;

import com.scamshield.domain.AppUser;
import com.scamshield.repository.UserRepository;
import com.scamshield.service.AuthService;
import com.scamshield.service.LoginRateLimiter;
import com.scamshield.web.AuthDtos.AuthResponse;
import com.scamshield.web.AuthDtos.ForgotPasswordRequest;
import com.scamshield.web.AuthDtos.LoginRequest;
import com.scamshield.web.AuthDtos.MessageResponse;
import com.scamshield.web.AuthDtos.RegisterRequest;
import com.scamshield.web.AuthDtos.ResetPasswordRequest;
import com.scamshield.web.AuthDtos.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final LoginRateLimiter rateLimiter;
    private final SecurityContextRepository contextRepository = new HttpSessionSecurityContextRepository();
    private final CsrfTokenRepository csrfTokenRepository;

    public AuthController(UserRepository users, AuthService authService, AuthenticationManager authenticationManager,
                          LoginRateLimiter rateLimiter, CsrfTokenRepository csrfTokenRepository) {
        this.users = users; this.authService = authService; this.authenticationManager = authenticationManager;
        this.rateLimiter = rateLimiter; this.csrfTokenRepository = csrfTokenRepository;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) { return Map.of("token", token.getToken()); }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest body) {
        var user = authService.register(body.fullName(), body.email(), body.password(), body.passwordConfirmation());
        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(toResponse(user)));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest body, HttpServletRequest request,
                              HttpServletResponse response) {
        String address = request.getRemoteAddr();
        if (!rateLimiter.allow(address)) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many sign-in attempts. Try again later.");
        Authentication authentication = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(AuthService.normalizeEmail(body.email()), body.password()));
        request.getSession(true);
        request.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        csrfTokenRepository.saveToken(null, request, response);
        var user = users.findByEmail(authentication.getName()).orElseThrow();
        return new AuthResponse(toResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        contextRepository.saveContext(SecurityContextHolder.createEmptyContext(), request, response);
        csrfTokenRepository.saveToken(null, request, response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        var user = users.findByEmail(authentication.getName()).orElseThrow();
        return toResponse(user);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest body) {
        authService.requestPasswordReset(body.email());
        return new MessageResponse("If an account exists and email is configured, reset instructions will be sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest body) {
        if (!authService.resetPassword(body.token(), body.password())) {
            return ResponseEntity.badRequest().body(new MessageResponse("This reset link is invalid or has expired."));
        }
        return ResponseEntity.ok(new MessageResponse("Password updated. Sign in with your new password."));
    }

    private static UserResponse toResponse(AppUser user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(), user.getCreatedAt());
    }
}