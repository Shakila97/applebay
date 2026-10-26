package com.applebay.backend.controller;

import com.applebay.backend.entity.Course;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.service.StudentCourseService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentCourseController {

    private final StudentCourseService service;

    public StudentCourseController(StudentCourseService service) {
        this.service = service;
    }

    @GetMapping("/courses")
    public List<Course> getCourses(Authentication authentication) {
        return service.getCourses(authentication.getName());
    }

    @GetMapping("/enrolments")
    public List<Enrolment> getMyEnrolments(
            Authentication authentication) {

        return service.getMyEnrolments(authentication.getName());
    }

    @PostMapping("/courses/{courseId}/enrolments")
    @ResponseStatus(HttpStatus.CREATED)
    public Enrolment enrol(
            Authentication authentication,
            @PathVariable Long courseId) {

        return service.enrol(
                authentication.getName(), courseId);
    }
}
