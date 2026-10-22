package com.nutricart.exception;

import org.springframework.http.HttpStatus;

/**
 * Single application exception carrying the HTTP status the API should return and
 * an optional map of field-level validation messages for the React forms.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final transient java.util.Map<String, String> fieldErrors;

    public ApiException(HttpStatus status, String message) {
        this(status, message, java.util.Map.of());
    }

    public ApiException(HttpStatus status, String message, java.util.Map<String, String> fieldErrors) {
        super(message);
        this.status = status;
        this.fieldErrors = fieldErrors == null ? java.util.Map.of() : fieldErrors;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    public static ApiException field(String field, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, java.util.Map.of(field, message));
    }

    public HttpStatus getStatus() {
        return status;
    }

    public java.util.Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}