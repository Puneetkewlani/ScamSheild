package com.scamshield.repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.scamshield.domain.AppUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
@SuppressWarnings("null")
public class UserRepository {
    private final Firestore firestore;

    public UserRepository(Firestore firestore) { this.firestore = firestore; }

    public Optional<AppUser> findByEmail(String email) {
        var index = FirestoreSupport.await(firestore.collection("users_by_email").document(emailId(email)).get());
        if (!index.exists()) return Optional.empty();
        return findById(UUID.fromString(index.getString("userId")));
    }

    public Optional<AppUser> findById(UUID id) {
        var snapshot = FirestoreSupport.await(firestore.collection("users").document(id.toString()).get());
        return snapshot.exists() ? Optional.of(fromDocument(snapshot)) : Optional.empty();
    }

    public boolean existsByEmail(String email) {
        return FirestoreSupport.await(firestore.collection("users_by_email").document(emailId(email)).get()).exists();
    }

    public AppUser save(AppUser user) {
        String userId = user.getId().toString();
        var userDocument = firestore.collection("users").document(userId);
        var emailDocument = firestore.collection("users_by_email").document(emailId(user.getEmail()));
        FirestoreSupport.await(firestore.runTransaction(transaction -> {
            if (transaction.get(emailDocument).get().exists()) {
                throw new IllegalArgumentException("An account with this email already exists.");
            }
            transaction.create(userDocument, toDocument(user));
            transaction.create(emailDocument, Map.of("userId", userId));
            return null;
        }));
        return user;
    }

    private static AppUser fromDocument(DocumentSnapshot snapshot) {
        return new AppUser(
            UUID.fromString(snapshot.getId()), snapshot.getString("fullName"), snapshot.getString("email"),
            snapshot.getString("passwordHash"), AppUser.Role.valueOf(snapshot.getString("role")),
            Boolean.TRUE.equals(snapshot.getBoolean("enabled")), FirestoreSupport.instant(snapshot.get("createdAt")),
            FirestoreSupport.instant(snapshot.get("updatedAt")));
    }

    private static Map<String, Object> toDocument(AppUser user) {
        return Map.of(
            "fullName", user.getFullName(), "email", user.getEmail(), "passwordHash", user.getPasswordHash(),
            "role", user.getRole().name(), "enabled", user.isEnabled(),
            "createdAt", FirestoreSupport.timestamp(user.getCreatedAt()),
            "updatedAt", FirestoreSupport.timestamp(user.getUpdatedAt()));
    }

    private static String emailId(String email) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(email.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}