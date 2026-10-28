package com.applebay.backend.controller;

import com.applebay.backend.service.StudentContentService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/courses/{courseId}/contents")
public class StudentContentController {

    private final StudentContentService service;

    public StudentContentController(StudentContentService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentContentService.ContentView> getContents(
            Authentication authentication,
            @PathVariable Long courseId) {

        return service.getContents(
                authentication.getName(), courseId);
    }
}
