package com.scamshield.service;

import com.scamshield.domain.Scan.RiskLevel;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DemoScanAnalysisService implements ScanAnalysisService {
    private static final List<String> URGENCY = List.of("urgent", "immediately", "today", "within 24", "account suspended");
    private static final List<String> PAYMENT = List.of("payment", "wire transfer", "gift card", "redelivery");
    private static final List<String> CREDENTIALS = List.of("sign-in", "login", "verify your account", "password", "credentials");

    @Override
    public Analysis analyze(String content) {
        var normalized = content.toLowerCase(java.util.Locale.ROOT);
        var findings = new ArrayList<Finding>();
        int score = 8;
        score += addMatches(findings, normalized, URGENCY, "Language", "Urgency phrase matched", 18);
        score += addMatches(findings, normalized, PAYMENT, "Payment request", "Payment phrase matched", 20);
        score += addMatches(findings, normalized, CREDENTIALS, "Credentials", "Account access phrase matched", 25);
        boolean urlPresent = normalized.matches("(?s).*(https?://|www\\.).*");
        if (urlPresent && findings.stream().anyMatch(finding -> finding.severity().equals("SIGNAL"))) score += 9;
        if (findings.isEmpty()) findings.add(new Finding("Language", "CLEAR", "No configured warning phrase observed", "The local demo did not find its configured example phrases."));
        findings.add(new Finding("Live checks", "UNAVAILABLE", "No external reputation checks performed", "No DNS, redirects, certificates, sender intelligence, or threat feeds were checked."));
        score = Math.min(94, score);
        var risk = score >= 70 ? RiskLevel.HIGH : score >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW;
        String summary = findings.stream().anyMatch(finding -> finding.severity().equals("SIGNAL"))
            ? "The local demo heuristic matched one or more text patterns; this is not a verified threat assessment."
            : "No configured warning patterns were matched; this is not a safety guarantee.";
        var recommendations = risk == RiskLevel.HIGH
            ? List.of("Do not follow links or contact details in the submitted content.", "Verify the request through a trusted, separate channel.", "Do not share passwords, verification codes, or payment details.")
            : List.of("Pause before responding or paying.", "Verify the sender and destination independently.", "A low demo score does not establish that content is safe.");
        return new Analysis(score, risk, summary, findings, recommendations);
    }

    private int addMatches(List<Finding> findings, String content, List<String> terms,
                           String category, String title, int weight) {
        var matches = terms.stream().filter(content::contains).toList();
        if (matches.isEmpty()) return 0;
        findings.add(new Finding(category, "SIGNAL", title,
            "Matched local example phrase(s): " + String.join(", ", matches) + ". This is not proof of malicious intent."));
        return matches.size() * weight;
    }
}