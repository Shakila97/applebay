package com.applebay.backend.controller;

import com.applebay.backend.service.AttendanceSessionService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturer")
public class LecturerSessionController {

    private final AttendanceSessionService service;

    public LecturerSessionController(
            AttendanceSessionService service) {
        this.service = service;
    }

    public record OpenSessionRequest(
            @NotNull @Min(1) @Max(240)
            Integer durationMinutes) {
    }

    @PostMapping("/courses/{courseId}/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceSessionService.SessionView openSession(
            Authentication authentication,
            @PathVariable Long courseId,
            @Valid @RequestBody OpenSessionRequest request) {

        return service.openSession(
                authentication.getName(),
                courseId,
                request.durationMinutes());
    }

    @GetMapping("/courses/{courseId}/sessions")
    public List<AttendanceSessionService.SessionView> getSessions(
            Authentication authentication,
            @PathVariable Long courseId) {

        return service.getCourseSessions(
                authentication.getName(), courseId);
    }

    @PutMapping("/sessions/{sessionId}/close")
    public AttendanceSessionService.SessionView closeSession(
            Authentication authentication,
            @PathVariable Long sessionId) {

        return service.closeSession(
                authentication.getName(), sessionId);
    }
}
