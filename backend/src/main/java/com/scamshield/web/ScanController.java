package com.scamshield.web;

import com.scamshield.service.ScanService;
import com.scamshield.web.ScanDtos.CreateScanRequest;
import com.scamshield.web.ScanDtos.ScanResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scans")
public class ScanController {
    private final ScanService scans;
    public ScanController(ScanService scans) { this.scans = scans; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScanResponse create(Authentication authentication, @Valid @RequestBody CreateScanRequest request) {
        return scans.create(authentication.getName(), request);
    }

    @GetMapping
    public ScanDtos.PageResponse<ScanResponse> history(Authentication authentication,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "recent") String sort, @RequestParam(defaultValue = "") String q,
        @RequestParam(required = false) String risk) {
        return scans.history(authentication.getName(), page, size, sort, q, risk);
    }

    @GetMapping("/{id}")
    public ScanResponse get(Authentication authentication, @PathVariable UUID id) {
        return scans.get(authentication.getName(), id);
    }

    @GetMapping("/{id}/report")
    public ScanResponse report(Authentication authentication, @PathVariable UUID id) {
        return scans.get(authentication.getName(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        scans.delete(authentication.getName(), id);
    }
}