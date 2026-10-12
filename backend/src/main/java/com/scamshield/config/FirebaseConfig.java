package com.scamshield.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirebaseConfig {
    @Bean(destroyMethod = "delete")
    FirebaseApp firebaseApp(@Value("${firebase.project-id:}") String projectId,
                            @Value("${firebase.credentials-path:}") String credentialsPath) throws IOException {
        var credentials = credentialsPath.isBlank()
            ? GoogleCredentials.getApplicationDefault()
            : readCredentials(credentialsPath);
        var options = FirebaseOptions.builder().setCredentials(credentials);
        if (!projectId.isBlank()) options.setProjectId(projectId);
        return FirebaseApp.initializeApp(options.build());
    }

    @Bean(destroyMethod = "close")
    Firestore firestore(FirebaseApp firebaseApp, @Value("${firebase.database-id:(default)}") String databaseId) {
        return FirestoreClient.getFirestore(firebaseApp, databaseId);
    }

    private static GoogleCredentials readCredentials(String credentialsPath) throws IOException {
        try (var stream = Files.newInputStream(Path.of(credentialsPath))) {
            return GoogleCredentials.fromStream(stream);
        }
    }
}