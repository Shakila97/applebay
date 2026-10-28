package com.applebay.backend.service;

import com.applebay.backend.repository.CourseContentRepository;
import com.applebay.backend.repository.EnrolmentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class StudentContentService {

    private final StudentProfileService profiles;
    private final EnrolmentRepository enrolments;
    private final CourseContentRepository contents;

    public StudentContentService(
            StudentProfileService profiles,
            EnrolmentRepository enrolments,
            CourseContentRepository contents) {

        this.profiles = profiles;
        this.enrolments = enrolments;
        this.contents = contents;
    }

    public record ContentView(
            Long id,
            String title,
            String body,
            Instant updatedAt) {
    }

    @Transactional(readOnly = true)
    public List<ContentView> getContents(
            String email, Long courseId) {

        var student = profiles.getProfile(email);

        boolean enrolled = enrolments
                .findByStudent_IdAndCourse_Id(
                        student.getId(), courseId)
                .isPresent();

        if (!enrolled) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not enrolled in this course");
        }

        return contents.findByCourse_IdOrderByIdAsc(courseId)
                .stream()
                .map(content -> new ContentView(
                        content.getId(),
                        content.getTitle(),
                        content.getBody(),
                        content.getUpdatedAt()))
                .toList();
    }
}
