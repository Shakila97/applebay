package com.applebay.backend.service;

import com.applebay.backend.entity.Course;
import com.applebay.backend.entity.Student;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.repository.AttendanceRepository;
import com.applebay.backend.repository.CourseRepository;
import com.applebay.backend.repository.StudentRepository;
import com.applebay.backend.repository.EnrolmentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EnrolmentService {

    private final EnrolmentRepository enrolmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final AttendanceRepository attendanceRepository;

    public EnrolmentService(
            EnrolmentRepository enrolmentRepository,
            StudentRepository studentRepository,
            CourseRepository courseRepository,
            AttendanceRepository attendanceRepository) {

        this.enrolmentRepository = enrolmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public List<Enrolment> getAllEnrolments() {
        return enrolmentRepository.findAll();
    }

    @Transactional
    public Enrolment enrolStudent(Long studentId, Long courseId) {

        if (studentId == null || courseId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Student ID and course ID are required");
        }

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Student not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        if (enrolmentRepository
                .existsByStudent_IdAndCourse_Id(studentId, courseId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Student is already enrolled in this course");
        }

        Enrolment enrolment = new Enrolment();
        enrolment.setStudent(student);
        enrolment.setCourse(course);

        return enrolmentRepository.save(enrolment);
    }
    public List<Enrolment> getEnrolmentsByCourse(Long courseId) {

    if (!courseRepository.existsById(courseId)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Course not found");
    }

    return enrolmentRepository.findByCourse_Id(courseId);
    }

    // Attendance rows reference the enrolment (ON DELETE RESTRICT),
    // so they are removed with it.
    @Transactional
    public void unenrol(Long enrolmentId) {

        Enrolment enrolment = enrolmentRepository.findById(enrolmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Enrolment not found"));

        attendanceRepository.deleteByEnrolment_Id(enrolment.getId());
        enrolmentRepository.delete(enrolment);
    }
}
