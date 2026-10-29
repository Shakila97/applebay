package com.applebay.backend.service;

import com.applebay.backend.entity.Course;
import com.applebay.backend.entity.CourseContent;
import com.applebay.backend.repository.CourseContentRepository;
import com.applebay.backend.repository.CourseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class LecturerContentService {

    private final LecturerCourseService lecturerCourses;
    private final CourseRepository courses;
    private final CourseContentRepository contents;

    public LecturerContentService(
            LecturerCourseService lecturerCourses,
            CourseRepository courses,
            CourseContentRepository contents) {

        this.lecturerCourses = lecturerCourses;
        this.courses = courses;
        this.contents = contents;
    }

    public record ContentView(
            Long id,
            Long moduleId,
            String title,
            String body,
            Instant updatedAt) {
    }

    private Course requireAssignedCourse(
            String email, Long courseId) {

        boolean assigned = lecturerCourses.getMyCourses(email)
                .stream()
                .anyMatch(course -> course.id().equals(courseId));

        if (!assigned) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not assigned to this course");
        }

        return courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found"));
    }

    private ContentView toView(CourseContent content) {
        return new ContentView(
                content.getId(),
                content.getModule() == null
                        ? null
                        : content.getModule().getId(),
                content.getTitle(),
                content.getBody(),
                content.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public List<ContentView> getContents(
            String email, Long courseId) {

        requireAssignedCourse(email, courseId);

        return contents.findByCourse_IdOrderByIdAsc(courseId)
                .stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public ContentView createContent(
            String email,
            Long courseId,
            String title,
            String body) {

        Course course = requireAssignedCourse(email, courseId);

        CourseContent content = new CourseContent();
        content.setCourse(course);
        content.setTitle(title.trim());
        content.setBody(body.trim());

        return toView(contents.saveAndFlush(content));
    }

    @Transactional
    public ContentView updateContent(
            String email,
            Long courseId,
            Long contentId,
            String title,
            String body) {

        requireAssignedCourse(email, courseId);

        CourseContent content = contents
                .findByIdAndCourse_Id(contentId, courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Content not found in this course"));

        content.setTitle(title.trim());
        content.setBody(body.trim());

        return toView(contents.saveAndFlush(content));
    }

    @Transactional
    public void deleteContent(
            String email,
            Long courseId,
            Long contentId) {

        // 403 unless course_lecturers links this lecturer to the course.
        requireAssignedCourse(email, courseId);

        // Scoped to the course, so a content ID from another course is a 404.
        CourseContent content = contents
                .findByIdAndCourse_Id(contentId, courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Content not found in this course"));

        contents.delete(content);
    }
}
