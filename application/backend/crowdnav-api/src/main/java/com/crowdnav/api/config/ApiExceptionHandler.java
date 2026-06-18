package com.crowdnav.api.config;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
		ProblemDetail detail = ProblemDetail.forStatusAndDetail(ex.getStatusCode(), ex.getReason());
		detail.setTitle(statusTitle(ex.getStatusCode()));
		if (ex.getReason() != null) {
			detail.setType(URI.create("about:blank"));
		}
		return detail;
	}

	private static String statusTitle(HttpStatusCode statusCode) {
		if (statusCode instanceof HttpStatus status) {
			return switch (status) {
				case BAD_REQUEST -> "Bad Request";
				case NOT_FOUND -> "Not Found";
				case CONFLICT -> "Conflict";
				case PAYLOAD_TOO_LARGE -> "Payload Too Large";
				case SERVICE_UNAVAILABLE -> "Service Unavailable";
				case BAD_GATEWAY -> "Bad Gateway";
				default -> status.getReasonPhrase();
			};
		}
		return statusCode.toString();
	}
}
