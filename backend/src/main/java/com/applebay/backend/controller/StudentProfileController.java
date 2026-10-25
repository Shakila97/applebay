package com.applebay.backend.controller;

import com.applebay.backend.dto.StudentProfileRequest;
import com.applebay.backend.entity.Student;
import com.applebay.backend.service.StudentProfileService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/profile")
public class StudentProfileController {

    private final StudentProfileService service;

    public StudentProfileController(StudentProfileService service) {
        this.service = service;
    }

    @GetMapping
    public Student getProfile(Authentication authentication) {
        return service.getProfile(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student createProfile(
            Authentication authentication,
            @Valid @RequestBody StudentProfileRequest request) {

        return service.createProfile(
                authentication.getName(), request);
    }
}
