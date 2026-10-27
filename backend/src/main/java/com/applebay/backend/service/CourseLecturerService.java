package com.applebay.backend.service;

import com.applebay.backend.entity.Course;
import com.applebay.backend.entity.CourseLecturer;
import com.applebay.backend.entity.Lecturer;

import com.applebay.backend.repository.CourseLecturerRepository;
import com.applebay.backend.repository.CourseRepository;
import com.applebay.backend.repository.LecturerRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseLecturerService {

    private final CourseLecturerRepository assignments;
    private final CourseRepository courses;
    private final LecturerRepository lecturers;

    public CourseLecturerService(
            CourseLecturerRepository assignments,
            CourseRepository courses,
            LecturerRepository lecturers) {

        this.assignments = assignments;
        this.courses = courses;
        this.lecturers = lecturers;
    }

    public record LecturerView(
            Long id,
            String name,
            String email) {
    }

    public record AssignmentView(
            Long id,
            Long courseId,
            String courseName,
            Long lecturerId,
            String lecturerName) {
    }

    @Transactional(readOnly = true)
    public List<LecturerView> getLecturers() {
        return lecturers.findAll().stream()
                .map(lecturer -> new LecturerView(
                        lecturer.getId(),
                        lecturer.getName(),
                        lecturer.getUser().getEmail()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentView> getAssignments() {
        return assignments.findAll().stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public AssignmentView assign(Long courseId, Long lecturerId) {

        if (courseId == null || lecturerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course ID and lecturer ID are required");
        }

        Course course = courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        Lecturer lecturer = lecturers.findById(lecturerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Lecturer not found"));

        if (assignments.existsByCourse_IdAndLecturer_Id(
                courseId, lecturerId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lecturer is already assigned to this course");
        }

        CourseLecturer assignment = new CourseLecturer();
        assignment.setCourse(course);
        assignment.setLecturer(lecturer);

        try {
            return toView(assignments.saveAndFlush(assignment));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Assignment could not be saved");
        }
    }

    private AssignmentView toView(CourseLecturer assignment) {
        return new AssignmentView(
                assignment.getId(),
                assignment.getCourse().getId(),
                assignment.getCourse().getName(),
                assignment.getLecturer().getId(),
                assignment.getLecturer().getName());
    }
}
