package com.applebay.backend.config;

import com.applebay.backend.service.LoginDetailsService;

import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            LoginDetailsService loginDetailsService,
            PasswordEncoder passwordEncoder) throws Exception {

        var provider =
                new DaoAuthenticationProvider(loginDetailsService);

        provider.setPasswordEncoder(passwordEncoder);

        http
            .authenticationProvider(provider)

            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR)
                    .permitAll()

                .requestMatchers(
                    HttpMethod.GET, "/api/auth/csrf")
                    .permitAll()

                .requestMatchers(
                    HttpMethod.POST, "/api/auth/signup")
                    .permitAll()

                .requestMatchers("/api/auth/me")
                    .authenticated()

                .requestMatchers("/api/student/**")
                    .hasRole("STUDENT")

                // Existing management APIs are Admin-only.
                .requestMatchers("/api/**")
                    .hasRole("ADMIN")

                .anyRequest()
                    .denyAll()
            )

            .formLogin(form -> form
                .loginProcessingUrl("/api/auth/login")
                .usernameParameter("identifier")
                .passwordParameter("password")
                .successHandler((request, response, authentication) ->
                    response.setStatus(204))
                .failureHandler((request, response, exception) ->
                    response.setStatus(401))
                .permitAll()
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(
                    (request, response, authentication) ->
                        response.setStatus(204))
            )

            .exceptionHandling(errors -> errors
                .authenticationEntryPoint(
                    (request, response, exception) ->
                        response.setStatus(401))
                .accessDeniedHandler(
                    (request, response, exception) ->
                        response.setStatus(403))
            )

            .requestCache(cache -> cache.disable())

            .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
