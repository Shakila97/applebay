package com.applebay.backend.controller;

import com.applebay.backend.service.CourseLecturerService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminCourseLecturerController {

    private final CourseLecturerService service;

    public AdminCourseLecturerController(
            CourseLecturerService service) {
        this.service = service;
    }

    public record AssignmentRequest(
            Long courseId,
            Long lecturerId) {
    }

    @GetMapping("/lecturers")
    public List<CourseLecturerService.LecturerView> getLecturers() {
        return service.getLecturers();
    }

    @GetMapping("/course-lecturers")
    public List<CourseLecturerService.AssignmentView> getAssignments() {
        return service.getAssignments();
    }

    @PostMapping("/course-lecturers")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseLecturerService.AssignmentView assignLecturer(
            @RequestBody AssignmentRequest request) {

        return service.assign(
                request.courseId(),
                request.lecturerId());
    }

    @DeleteMapping("/course-lecturers/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAssignment(
            @PathVariable Long assignmentId) {

        service.removeAssignment(assignmentId);
    }
}
