package com.scamshield.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import java.time.Instant;
import java.util.Date;
import java.util.concurrent.ExecutionException;

final class FirestoreSupport {
    private FirestoreSupport() { }

    static <T> T await(ApiFuture<T> future) {
        try {
            return future.get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Firestore operation was interrupted.", exception);
        } catch (ExecutionException exception) {
            var cause = exception.getCause();
            if (cause instanceof RuntimeException runtimeException) throw runtimeException;
            throw new IllegalStateException("Firestore operation failed.", cause);
        }
    }

    static Timestamp timestamp(Instant value) {
        return Timestamp.ofTimeSecondsAndNanos(value.getEpochSecond(), value.getNano());
    }

    static Instant instant(Object value) {
        if (value instanceof Timestamp timestamp) return timestamp.toDate().toInstant();
        if (value instanceof Date date) return date.toInstant();
        if (value instanceof Instant instant) return instant;
        return null;
    }
}