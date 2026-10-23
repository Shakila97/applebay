package com.applebay.backend.service;

import com.applebay.backend.entity.Course;
import com.applebay.backend.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));
    }

    public Course updateCourse(Long id, Course updatedCourse) {
        Course course = getCourseById(id);

        course.setCode(updatedCourse.getCode());
        course.setName(updatedCourse.getName());
        course.setLevel(updatedCourse.getLevel());
        course.setDuration(updatedCourse.getDuration());

        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        Course course = getCourseById(id);
        courseRepository.delete(course);
    }
}