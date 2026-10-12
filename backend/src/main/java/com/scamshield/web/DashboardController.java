package com.scamshield.web;

import com.scamshield.service.ScanService;
import com.scamshield.web.ScanDtos.DashboardSummary;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ScanService scans;
    public DashboardController(ScanService scans) { this.scans = scans; }

    @GetMapping("/summary")
    public DashboardSummary summary(Authentication authentication) { return scans.summary(authentication.getName()); }
}