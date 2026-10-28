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
public class AdminContentService {

    private final CourseRepository courses;
    private final CourseContentRepository contents;

    public AdminContentService(
            CourseRepository courses,
            CourseContentRepository contents) {

        this.courses = courses;
        this.contents = contents;
    }

    public record ContentView(
            Long id,
            String title,
            String body,
            Instant updatedAt) {
    }

    private Course getCourse(Long courseId) {
        return courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));
    }

    private CourseContent getContent(Long courseId, Long contentId) {
        return contents.findByIdAndCourse_Id(contentId, courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Content not found in this course"));
    }

    private ContentView toView(CourseContent content) {
        return new ContentView(
                content.getId(),
                content.getTitle(),
                content.getBody(),
                content.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public List<ContentView> getContents(Long courseId) {
        getCourse(courseId);

        return contents.findByCourse_IdOrderByIdAsc(courseId)
                .stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public ContentView saveContent(
            Long courseId,
            Long contentId,
            String title,
            String body) {

        Course course = getCourse(courseId);

        CourseContent content = contentId == null
                ? new CourseContent()
                : getContent(courseId, contentId);

        content.setCourse(course);
        content.setTitle(title.trim());
        content.setBody(body.trim());

        return toView(contents.saveAndFlush(content));
    }

    @Transactional
    public void deleteContent(Long courseId, Long contentId) {
        getCourse(courseId);

        CourseContent content = getContent(courseId, contentId);
        contents.delete(content);
    }
}
