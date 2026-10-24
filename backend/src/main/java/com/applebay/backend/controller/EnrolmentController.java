package com.applebay.backend.controller;

import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.service.EnrolmentService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrolments")
public class EnrolmentController {

    private final EnrolmentService enrolmentService;

    public EnrolmentController(EnrolmentService enrolmentService) {
        this.enrolmentService = enrolmentService;
    }

    public record EnrolmentRequest(Long studentId, Long courseId) {
    }

    @GetMapping
    public List<Enrolment> getAllEnrolments() {
        return enrolmentService.getAllEnrolments();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Enrolment enrolStudent(
            @RequestBody EnrolmentRequest request) {

        return enrolmentService.enrolStudent(
                request.studentId(),
                request.courseId());
    }
    @GetMapping("/courses/{courseId}")
    public List<Enrolment> getEnrolmentsByCourse(
        @PathVariable Long courseId) {

    return enrolmentService.getEnrolmentsByCourse(courseId);
    }
}