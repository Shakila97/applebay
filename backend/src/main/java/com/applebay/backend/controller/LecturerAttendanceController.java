package com.applebay.backend.controller;

import com.applebay.backend.entity.Attendance;
import com.applebay.backend.service.LecturerAttendanceService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturer/sessions")
public class LecturerAttendanceController {

    private final LecturerAttendanceService service;

    public LecturerAttendanceController(
            LecturerAttendanceService service) {
        this.service = service;
    }

    public record MarkRequest(
            @NotNull Attendance.Status status) {
    }

    @GetMapping("/{sessionId}/attendance")
    public List<LecturerAttendanceService.AttendanceRow> getRoster(
            Authentication authentication,
            @PathVariable Long sessionId) {

        return service.getRoster(
                authentication.getName(), sessionId);
    }

    @PutMapping("/{sessionId}/attendance/{enrolmentId}")
    public LecturerAttendanceService.AttendanceRow markAttendance(
            Authentication authentication,
            @PathVariable Long sessionId,
            @PathVariable Long enrolmentId,
            @Valid @RequestBody MarkRequest request) {

        return service.markAttendance(
                authentication.getName(),
                sessionId,
                enrolmentId,
                request.status());
    }
}
