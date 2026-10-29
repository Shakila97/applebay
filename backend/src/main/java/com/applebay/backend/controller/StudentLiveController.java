package com.applebay.backend.controller;

import com.applebay.backend.service.StudentLiveService;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/student/live")
public class StudentLiveController {

    private final StudentLiveService service;

    public StudentLiveController(StudentLiveService service) {
        this.service = service;
    }

    // Snapshot: every enrolled course with its current session state.
    @GetMapping
    public StudentLiveService.LiveDashboard getDashboard(
            Authentication authentication) {

        return service.getDashboard(authentication.getName());
    }

    // One stream per student covering all their enrolled courses.
    @GetMapping(
            value = "/events",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(Authentication authentication) {
        return service.subscribe(authentication.getName());
    }
}
