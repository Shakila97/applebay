package com.applebay.backend.controller;

import com.applebay.backend.service.LecturerCourseService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturer")
public class LecturerCourseController {

    private final LecturerCourseService service;

    public LecturerCourseController(
            LecturerCourseService service) {
        this.service = service;
    }

    @GetMapping("/courses")
    public List<LecturerCourseService.CourseView> getMyCourses(
            Authentication authentication) {

        return service.getMyCourses(authentication.getName());
    }
}
