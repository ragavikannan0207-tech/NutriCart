package com.nutricart.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Translates every exception into a short, user-friendly JSON body.
 * Raw stack traces and technical details are logged server-side and never sent
 * to the client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ErrorBody(Instant timestamp, int status, String message, Map<String, String> fieldErrors) {
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorBody> handleApi(ApiException exception) {
        return ResponseEntity.status(exception.getStatus()).body(new ErrorBody(
                Instant.now(),
                exception.getStatus().value(),
                exception.getMessage(),
                exception.getFieldErrors()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        String message = fieldErrors.values().stream().findFirst().orElse("Please check the details you entered.");
        return ResponseEntity.badRequest().body(new ErrorBody(Instant.now(), 400, message, fieldErrors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorBody> handleUnreadable(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ErrorBody(
                Instant.now(), 400, "That request could not be read. Please check the details and try again.", Map.of()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorBody> handleDenied(AccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorBody(
                Instant.now(), 403, "You do not have access to that resource.", Map.of()));
    }

    /**
     * Without this handler the catch-all below would report a plainly wrong URL as a
     * 500, which the React client would surface as "the service is broken" instead of
     * a simple not-found.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorBody> handleMissingRoute(NoResourceFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorBody(
                Instant.now(), 404, "That NutriCart endpoint does not exist.", Map.of()));
    }

    /** A known URL used with the wrong verb (for example GET on a PUT-only route). */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorBody> handleWrongMethod(HttpRequestMethodNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(new ErrorBody(
                Instant.now(), 405, "That action is not supported on this NutriCart endpoint.", Map.of()));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorBody> handleWrongMediaType(HttpMediaTypeNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(new ErrorBody(
                Instant.now(), 415, "Send this request as application/json.", Map.of()));
    }

    /** A path variable or query value that cannot be converted, e.g. /api/products/abc. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorBody> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        String field = exception.getName();
        return ResponseEntity.badRequest().body(new ErrorBody(
                Instant.now(), 400, "The value supplied for " + field + " is not valid.",
                Map.of(field, "That value is not valid.")));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorBody> handleMissingParameter(MissingServletRequestParameterException exception) {
        String field = exception.getParameterName();
        return ResponseEntity.badRequest().body(new ErrorBody(
                Instant.now(), 400, "The " + field + " parameter is required.",
                Map.of(field, "This parameter is required.")));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleOther(Exception exception, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorBody(
                Instant.now(), 500, "The NutriCart service reported an error. Please try again.", Map.of()));
    }
}