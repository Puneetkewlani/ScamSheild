package com.scamshield.repository;

import com.google.cloud.firestore.Firestore;
import com.scamshield.domain.PasswordResetToken;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
@SuppressWarnings("null")
public class PasswordResetRepository {
    private final Firestore firestore;

    public PasswordResetRepository(Firestore firestore) { this.firestore = firestore; }

    public void save(PasswordResetToken token) {
        FirestoreSupport.await(firestore.collection("password_reset_tokens").document(token.getTokenHash())
            .create(Map.of("id", token.getId().toString(), "userId", token.getUserId().toString(),
                "expiresAt", FirestoreSupport.timestamp(token.getExpiresAt()),
                "createdAt", FirestoreSupport.timestamp(token.getCreatedAt()))));
    }

    public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
        var snapshot = FirestoreSupport.await(firestore.collection("password_reset_tokens").document(tokenHash).get());
        if (!snapshot.exists()) return Optional.empty();
        return Optional.of(new PasswordResetToken(
            UUID.fromString(snapshot.getString("id")), UUID.fromString(snapshot.getString("userId")), tokenHash,
            FirestoreSupport.instant(snapshot.get("expiresAt")), FirestoreSupport.instant(snapshot.get("createdAt")),
            FirestoreSupport.instant(snapshot.get("usedAt"))));
    }

    public boolean consumeAndChangePassword(String tokenHash, String passwordHash, Instant now) {
        var tokenDocument = firestore.collection("password_reset_tokens").document(tokenHash);
        return FirestoreSupport.await(firestore.runTransaction(transaction -> {
            var token = transaction.get(tokenDocument).get();
            if (!token.exists() || token.get("usedAt") != null) return false;
            Instant expiresAt = FirestoreSupport.instant(token.get("expiresAt"));
            if (expiresAt == null || !expiresAt.isAfter(now)) return false;
            var userDocument = firestore.collection("users").document(token.getString("userId"));
            var user = transaction.get(userDocument).get();
            if (!user.exists()) return false;
            var timestamp = FirestoreSupport.timestamp(now);
            transaction.update(tokenDocument, "usedAt", timestamp);
            transaction.update(userDocument, Map.of("passwordHash", passwordHash, "updatedAt", timestamp));
            return true;
        }));
    }

    public long deleteByExpiresAtBefore(Instant cutoff) {
        var expired = FirestoreSupport.await(firestore.collection("password_reset_tokens")
            .whereLessThan("expiresAt", FirestoreSupport.timestamp(cutoff)).get()).getDocuments();
        for (int start = 0; start < expired.size(); start += 500) {
            var batch = firestore.batch();
            expired.subList(start, Math.min(start + 500, expired.size()))
                .forEach(snapshot -> batch.delete(snapshot.getReference()));
            FirestoreSupport.await(batch.commit());
        }
        return expired.size();
    }
}