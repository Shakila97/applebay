package com.applebay.backend.service;

import com.applebay.backend.entity.Course;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.repository.CourseRepository;
import com.applebay.backend.repository.EnrolmentRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class StudentCourseService {

    private final StudentProfileService profiles;
    private final CourseRepository courses;
    private final EnrolmentRepository enrolments;

    public StudentCourseService(
            StudentProfileService profiles,
            CourseRepository courses,
            EnrolmentRepository enrolments) {

        this.profiles = profiles;
        this.courses = courses;
        this.enrolments = enrolments;
    }

    @Transactional(readOnly = true)
    public List<Course> getCourses(String email) {
        profiles.getProfile(email);
        return courses.findAll();
    }

    @Transactional(readOnly = true)
    public List<Enrolment> getMyEnrolments(String email) {
        var student = profiles.getProfile(email);

        return enrolments.findByStudent_Id(student.getId());
    }

    @Transactional
    public Enrolment enrol(String email, Long courseId) {
        var student = profiles.getProfile(email);

        Course course = courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found"));

        if (enrolments.existsByStudent_IdAndCourse_Id(
                student.getId(), courseId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You are already enrolled in this course");
        }

        Enrolment enrolment = new Enrolment();
        enrolment.setStudent(student);
        enrolment.setCourse(course);

        try {
            return enrolments.saveAndFlush(enrolment);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Enrolment could not be saved. Refresh and check your enrolments");
        }
    }
}
