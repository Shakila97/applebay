package com.applebay.backend.service;

import com.applebay.backend.entity.AppUser;
import com.applebay.backend.entity.Lecturer;

import com.applebay.backend.repository.AppUserRepository;
import com.applebay.backend.repository.CourseLecturerRepository;
import com.applebay.backend.repository.LecturerRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LecturerCourseService {

    private final AppUserRepository users;
    private final LecturerRepository lecturers;
    private final CourseLecturerRepository assignments;

    public LecturerCourseService(
            AppUserRepository users,
            LecturerRepository lecturers,
            CourseLecturerRepository assignments) {

        this.users = users;
        this.lecturers = lecturers;
        this.assignments = assignments;
    }

    public record CourseView(
            Long id,
            String code,
            String name,
            String level,
            String duration) {
    }

    @Transactional(readOnly = true)
    public List<CourseView> getMyCourses(String email) {

        AppUser user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED));

        if (!user.isEnabled()
                || user.getRole() != AppUser.Role.LECTURER) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN);
        }

        Lecturer lecturer = lecturers.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Lecturer profile not found"));

        return assignments.findByLecturer_Id(lecturer.getId())
                .stream()
                .map(assignment -> {
                    var course = assignment.getCourse();

                    return new CourseView(
                            course.getId(),
                            course.getCode(),
                            course.getName(),
                            course.getLevel(),
                            course.getDuration());
                })
                .toList();
    }
}
