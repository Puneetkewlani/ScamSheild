package com.scamshield.service;

import com.scamshield.domain.Scan.RiskLevel;
import java.util.List;

public interface ScanAnalysisService {
    Analysis analyze(String content);

    record Finding(String category, String severity, String title, String description) { }
    record Analysis(int score, RiskLevel risk, String summary, List<Finding> findings,
                    List<String> recommendations) { }
}