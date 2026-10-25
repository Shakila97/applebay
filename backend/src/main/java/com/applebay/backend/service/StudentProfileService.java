package com.applebay.backend.service;

import com.applebay.backend.dto.StudentProfileRequest;
import com.applebay.backend.entity.AppUser;
import com.applebay.backend.entity.Student;
import com.applebay.backend.repository.AppUserRepository;
import com.applebay.backend.repository.StudentRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentProfileService {

    private final AppUserRepository users;
    private final StudentRepository students;

    public StudentProfileService(
            AppUserRepository users,
            StudentRepository students) {

        this.users = users;
        this.students = students;
    }

    private AppUser getAccount(String email) {
        AppUser account = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED));

        if (!account.isEnabled()
                || account.getRole() != AppUser.Role.STUDENT) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN);
        }

        return account;
    }

    @Transactional(readOnly = true)
    public Student getProfile(String email) {
        AppUser account = getAccount(email);

        return students.findByUser_Id(account.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Complete your student profile"));
    }

    @Transactional
    public Student createProfile(
            String email,
            StudentProfileRequest request) {

        AppUser account = getAccount(email);

        if (students.findByUser_Id(account.getId()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Your student profile already exists");
        }

        Student student = new Student();
        student.setName(request.name().trim());
        student.setNic(request.nic());
        student.setEmail(account.getEmail());
        student.setPhone(request.phone().trim());
        student.setAddress(request.address().trim());
        student.setUser(account);

        try {
            return students.saveAndFlush(student);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Profile could not be created. The NIC or account may already be linked");
        }
    }
}
