package com.scamshield.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentSnapshot;
import com.scamshield.domain.Scan;
import com.scamshield.domain.Scan.RiskLevel;
import com.scamshield.domain.Scan.ScanType;
import com.scamshield.domain.ScanFinding;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
@SuppressWarnings("null")
public class ScanRepository {
    private final Firestore firestore;

    public ScanRepository(Firestore firestore) { this.firestore = firestore; }

    public Scan save(Scan scan) {
        FirestoreSupport.await(firestore.collection("scans").document(scan.getId().toString()).set(toDocument(scan)));
        return scan;
    }

    public List<Scan> findOwned(UUID userId) {
        var snapshots = FirestoreSupport.await(firestore.collection("scans")
            .whereEqualTo("userId", userId.toString()).get()).getDocuments();
        return snapshots.stream().map(this::fromDocument).toList();
    }

    public Optional<Scan> findByIdAndUserId(UUID id, UUID userId) {
        var snapshot = FirestoreSupport.await(firestore.collection("scans").document(id.toString()).get());
        if (!snapshot.exists() || !userId.toString().equals(snapshot.getString("userId"))) return Optional.empty();
        return Optional.of(fromDocument(snapshot));
    }

    public void deleteById(UUID id) {
        FirestoreSupport.await(firestore.collection("scans").document(id.toString()).delete());
    }

    public long deleteByCreatedAtBefore(Instant cutoff) {
        var expired = FirestoreSupport.await(firestore.collection("scans")
            .whereLessThan("createdAt", FirestoreSupport.timestamp(cutoff)).get()).getDocuments();
        for (int start = 0; start < expired.size(); start += 500) {
            var batch = firestore.batch();
            expired.subList(start, Math.min(start + 500, expired.size()))
                .forEach(snapshot -> batch.delete(snapshot.getReference()));
            FirestoreSupport.await(batch.commit());
        }
        return expired.size();
    }

    private Map<String, Object> toDocument(Scan scan) {
        var document = new HashMap<String, Object>();
        document.put("userId", scan.getUserId().toString());
        document.put("scanType", scan.getScanType().name());
        document.put("submittedContent", scan.getSubmittedContent());
        document.put("riskScore", scan.getRiskScore());
        document.put("riskLevel", scan.getRiskLevel().name());
        document.put("verdict", scan.getVerdict());
        document.put("analysisStatus", scan.getAnalysisStatus());
        document.put("createdAt", FirestoreSupport.timestamp(scan.getCreatedAt()));
        document.put("completedAt", FirestoreSupport.timestamp(scan.getCompletedAt()));
        document.put("findings", scan.getFindings().stream().map(this::findingDocument).toList());
        return document;
    }

    private Map<String, Object> findingDocument(ScanFinding finding) {
        return Map.of(
            "id", finding.getId().toString(), "category", finding.getCategory(), "severity", finding.getSeverity(),
            "title", finding.getTitle(), "description", finding.getDescription(),
            "evidenceSource", finding.getEvidenceSource(), "verified", finding.isVerified(),
            "createdAt", FirestoreSupport.timestamp(finding.getCreatedAt()));
    }

    private Scan fromDocument(DocumentSnapshot snapshot) {
        var data = snapshot.getData();
        if (data == null) throw new IllegalStateException("Stored scan document has no data.");
        var scan = new Scan(UUID.fromString(snapshot.getId()), UUID.fromString((String) data.get("userId")),
            ScanType.valueOf((String) data.get("scanType")), (String) data.get("submittedContent"),
            ((Number) data.get("riskScore")).intValue(), RiskLevel.valueOf((String) data.get("riskLevel")),
            (String) data.get("verdict"), (String) data.get("analysisStatus"),
            FirestoreSupport.instant(data.get("createdAt")), FirestoreSupport.instant(data.get("completedAt")));
        Object rawFindings = data.get("findings");
        if (rawFindings instanceof List<?> findings) {
            findings.stream().filter(Map.class::isInstance).map(value -> (Map<?, ?>) value)
                .map(finding -> fromFinding(scan, finding)).forEach(scan::addFinding);
        }
        return scan;
    }

    private ScanFinding fromFinding(Scan scan, Map<?, ?> finding) {
        return new ScanFinding(UUID.fromString((String) finding.get("id")), scan,
            (String) finding.get("category"), (String) finding.get("severity"), (String) finding.get("title"),
            (String) finding.get("description"), (String) finding.get("evidenceSource"),
            Boolean.TRUE.equals(finding.get("verified")), FirestoreSupport.instant(finding.get("createdAt")));
    }
}