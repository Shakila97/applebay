package com.applebay.backend.service;

import com.applebay.backend.entity.AppUser;
import com.applebay.backend.repository.AppUserRepository;
import com.applebay.backend.repository.StudentRepository;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class LoginDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;
    private final StudentRepository studentRepository;

    public LoginDetailsService(
            AppUserRepository userRepository,
            StudentRepository studentRepository) {

        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) {

        if (identifier == null || identifier.isBlank()) {
            throw accountNotFound();
        }

        String login = identifier.trim();
        AppUser account;

        if (login.contains("@")) {
            account = userRepository
                    .findByEmailIgnoreCase(login)
                    .orElseThrow(this::accountNotFound);
        } else {
            account = findByRegistrationNumber(login);
        }

        return User.withUsername(account.getEmail())
                .password(account.getPasswordHash())
                .roles(account.getRole().name())
                .disabled(!account.isEnabled())
                .build();
    }

    private AppUser findByRegistrationNumber(String identifier) {
        String registrationNumber =
                identifier.toUpperCase(Locale.ROOT);

        if (!registrationNumber.matches("STU-[0-9]{6,}")) {
            throw accountNotFound();
        }

        long studentId;

        try {
            studentId = Long.parseLong(
                    registrationNumber.substring(4));
        } catch (NumberFormatException exception) {
            throw accountNotFound();
        }

        var student = studentRepository.findById(studentId)
                .orElseThrow(this::accountNotFound);

        if (!registrationNumber.equals(
                student.getRegistrationNumber())) {
            throw accountNotFound();
        }

        AppUser account = student.getUser();

        if (account == null ||
                account.getRole() != AppUser.Role.STUDENT) {
            throw accountNotFound();
        }

        return account;
    }

    private UsernameNotFoundException accountNotFound() {
        return new UsernameNotFoundException(
                "Invalid login credentials");
    }
}
