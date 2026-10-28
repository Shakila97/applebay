package com.applebay.backend.controller;

import com.applebay.backend.service.StudentCheckInService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/attendance")
public class StudentCheckInController {

    private final StudentCheckInService service;

    public StudentCheckInController(StudentCheckInService service) {
        this.service = service;
    }

    @GetMapping("/sessions")
    public List<StudentCheckInService.OpenSessionView> getMyOpenSessions(
            Authentication authentication) {

        return service.getMyOpenSessions(authentication.getName());
    }

    @PostMapping("/sessions/{sessionId}/check-in")
    public StudentCheckInService.CheckInResponse checkIn(
            Authentication authentication,
            @PathVariable Long sessionId) {

        return service.checkIn(
                authentication.getName(),
                sessionId);
    }
}
