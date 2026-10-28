package com.applebay.backend.controller;

import com.applebay.backend.service.LecturerReportService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lecturer/courses")
public class LecturerReportController {

    private final LecturerReportService service;

    public LecturerReportController(LecturerReportService service) {
        this.service = service;
    }

    @GetMapping("/{courseId}/attendance-report")
    public LecturerReportService.CourseAttendanceReport getReport(
            Authentication authentication,
            @PathVariable Long courseId) {

        return service.getAttendanceReport(
                authentication.getName(), courseId);
    }
}
