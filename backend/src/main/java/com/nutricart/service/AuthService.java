package com.nutricart.service;

import com.nutricart.domain.UserAccount;
import com.nutricart.dto.Dtos;
import com.nutricart.exception.ApiException;
import com.nutricart.repository.UserAccountRepository;
import com.nutricart.security.JwtService;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registration and sign-in.
 *
 * <p>Passwords are hashed with BCrypt before they touch the database and are never
 * returned by the API. The validation rules mirror frontend/src/utils/validation.ts,
 * so the same message appears whether a mistake is caught in the browser or here.
 */
@Service
public class AuthService {

    /** Same pattern the React forms use; Gmail addresses with dots and digits pass. */
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DtoMapper mapper;
    private final PreferenceService preferenceService;

    public AuthService(
            UserAccountRepository users,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            DtoMapper mapper,
            PreferenceService preferenceService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mapper = mapper;
        this.preferenceService = preferenceService;
    }

    @Transactional
    public Dtos.SessionResponse register(Dtos.RegisterRequest request) {
        String fullName = request.fullName() == null ? "" : request.fullName().trim();
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        String password = request.password() == null ? "" : request.password();

        if (fullName.length() < 2) {
            throw ApiException.field("fullName", "Enter your full name.");
        }
        if (!EMAIL.matcher(email).matches()) {
            throw ApiException.field("email", "Enter a valid email address, for example name.123@gmail.com");
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw ApiException.field("password", "Password must be at least 8 characters.");
        }
        if (!password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            throw ApiException.field("password", "Password must include at least one letter and one number.");
        }
        if (request.confirmPassword() != null && !request.confirmPassword().isEmpty()
                && !password.equals(request.confirmPassword())) {
            throw ApiException.field("confirmPassword", "Passwords do not match.");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists. Try signing in instead.");
        }

        UserAccount account = new UserAccount();
        account.setFullName(fullName);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(password));
        UserAccount saved = users.save(account);

        // Every account gets its preference row straight away so Settings never 404s.
        preferenceService.defaultsFor(saved);

        return mapper.session(jwtService.issue(saved.getId(), saved.getEmail()), saved);
    }

    @Transactional(readOnly = true)
    public Dtos.SessionResponse login(Dtos.LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        String password = request.password() == null ? "" : request.password();

        UserAccount account = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("No NutriCart account uses that email address."));
        if (!passwordEncoder.matches(password, account.getPasswordHash())) {
            throw ApiException.unauthorized("That password is not correct.");
        }
        return mapper.session(jwtService.issue(account.getId(), account.getEmail()), account);
    }

    /** Used by the frontend on boot to confirm a cached token is still valid. */
    @Transactional(readOnly = true)
    public Dtos.SessionResponse currentSession(Long userId) {
        UserAccount account = requireUser(userId);
        return mapper.session(jwtService.issue(account.getId(), account.getEmail()), account);
    }

    @Transactional
    public Dtos.SessionResponse updateAccount(Long userId, Dtos.AccountRequest request) {
        UserAccount account = requireUser(userId);
        String fullName = request.fullName() == null ? "" : request.fullName().trim();
        if (fullName.length() < 2) {
            throw ApiException.field("fullName", "Enter your full name.");
        }
        account.setFullName(fullName);
        users.save(account);
        return mapper.session(jwtService.issue(account.getId(), account.getEmail()), account);
    }

    /** Sign-out is stateless: the client simply drops the token. */
    public void logout() {
        // no server-side session to invalidate
    }

    @Transactional(readOnly = true)
    public UserAccount requireUser(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
    }
}