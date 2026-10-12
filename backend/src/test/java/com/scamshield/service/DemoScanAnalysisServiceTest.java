package com.scamshield.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class DemoScanAnalysisServiceTest {
    private final DemoScanAnalysisService analyzer = new DemoScanAnalysisService();

    @Test
    void repeatedInputProducesSameHeuristicAssessment() {
        var first = analyzer.analyze("URGENT: verify your account today with a gift card");
        var second = analyzer.analyze("URGENT: verify your account today with a gift card");

        assertEquals(first, second);
        assertEquals(com.scamshield.domain.Scan.RiskLevel.HIGH, first.risk());
        assertTrue(first.findings().stream().anyMatch(finding -> finding.severity().equals("UNAVAILABLE")));
        assertTrue(first.findings().stream().noneMatch(finding -> finding.title().toLowerCase().contains("verified")));
    }

    @Test
    void cleanTextDoesNotClaimSafetyOrExternalVerification() {
        var result = analyzer.analyze("Meeting moved to Thursday afternoon.");

        assertEquals(com.scamshield.domain.Scan.RiskLevel.LOW, result.risk());
        assertTrue(result.summary().contains("not a safety guarantee"));
        assertFalse(result.findings().stream().anyMatch(finding -> finding.severity().equals("SIGNAL")));
    }
}