package apperror

import (
	"fmt"
	"net/http"
)

// Standard error code constants.
const (
	// HTTP 400 Bad Request
	CodeMalformedJSON       = "ERR_MALFORMED_JSON"
	CodeInvalidOperand      = "ERR_INVALID_OPERAND"
	CodeUnsupportedOperation = "ERR_UNSUPPORTED_OPERATION"
	CodeInvalidArity        = "ERR_INVALID_ARITY"

	// HTTP 422 Unprocessable Entity
	CodeDivisionByZero   = "ERR_DIVISION_BY_ZERO"
	CodeNegativeRadicand = "ERR_NEGATIVE_RADICAND"
	CodeComplexResult    = "ERR_COMPLEX_RESULT"
	CodeNumericOverflow  = "ERR_NUMERIC_OVERFLOW"

	// HTTP 405 Method Not Allowed
	CodeMethodNotAllowed = "ERR_METHOD_NOT_ALLOWED"

	// HTTP 413 Payload Too Large
	CodePayloadTooLarge = "ERR_PAYLOAD_TOO_LARGE"

	// HTTP 500 Internal Server Error
	CodeInternal = "ERR_INTERNAL"
)

// AppError represents a standardized application error with HTTP mapping.
type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    string `json:"details,omitempty"`
	HTTPStatus int    `json:"-"`
}

// Error implements the standard error interface.
func (e *AppError) Error() string {
	if e == nil {
		return ""
	}
	if e.Details != "" {
		return fmt.Sprintf("%s: %s (%s)", e.Code, e.Message, e.Details)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// New creates a custom AppError.
func New(code, message, details string, status int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		Details:    details,
		HTTPStatus: status,
	}
}

// NewMalformedJSONError creates an ERR_MALFORMED_JSON error (HTTP 400).
func NewMalformedJSONError(details string) *AppError {
	return New(
		CodeMalformedJSON,
		"Invalid JSON syntax, empty payload, or unknown fields.",
		details,
		http.StatusBadRequest,
	)
}

// NewInvalidOperandError creates an ERR_INVALID_OPERAND error (HTTP 400).
func NewInvalidOperandError(details string) *AppError {
	return New(
		CodeInvalidOperand,
		"Missing/null required operand, or non-numeric/NaN/Infinite operand value.",
		details,
		http.StatusBadRequest,
	)
}

// NewUnsupportedOperationError creates an ERR_UNSUPPORTED_OPERATION error (HTTP 400).
func NewUnsupportedOperationError(details string) *AppError {
	return New(
		CodeUnsupportedOperation,
		"Operation is not one of the 7 supported tokens.",
		details,
		http.StatusBadRequest,
	)
}

// NewInvalidArityError creates an ERR_INVALID_ARITY error (HTTP 400).
func NewInvalidArityError(details string) *AppError {
	return New(
		CodeInvalidArity,
		"Missing operand_b for binary operations, or unexpected non-null operand_b for unary-only operations (sqrt).",
		details,
		http.StatusBadRequest,
	)
}

// NewDivisionByZeroError creates an ERR_DIVISION_BY_ZERO error (HTTP 422).
func NewDivisionByZeroError(details string) *AppError {
	return New(
		CodeDivisionByZero,
		"Division by zero (a / 0) or zero raised to a negative exponent (0 ^ -b).",
		details,
		http.StatusUnprocessableEntity,
	)
}

// NewNegativeRadicandError creates an ERR_NEGATIVE_RADICAND error (HTTP 422).
func NewNegativeRadicandError(details string) *AppError {
	return New(
		CodeNegativeRadicand,
		"Square root of a negative number (sqrt(a) where a < 0).",
		details,
		http.StatusUnprocessableEntity,
	)
}

// NewComplexResultError creates an ERR_COMPLEX_RESULT error (HTTP 422).
func NewComplexResultError(details string) *AppError {
	return New(
		CodeComplexResult,
		"Negative base raised to a non-integer exponent (a ^ b where a < 0 and b is fractional).",
		details,
		http.StatusUnprocessableEntity,
	)
}

// NewNumericOverflowError creates an ERR_NUMERIC_OVERFLOW error (HTTP 422).
func NewNumericOverflowError(details string) *AppError {
	return New(
		CodeNumericOverflow,
		"Input or output magnitude exceeds 10^1000, or exponent magnitude |b| > 10000.",
		details,
		http.StatusUnprocessableEntity,
	)
}

// NewMethodNotAllowedError creates an ERR_METHOD_NOT_ALLOWED error (HTTP 405).
func NewMethodNotAllowedError(details string) *AppError {
	return New(
		CodeMethodNotAllowed,
		"HTTP method not allowed.",
		details,
		http.StatusMethodNotAllowed,
	)
}

// NewPayloadTooLargeError creates an ERR_PAYLOAD_TOO_LARGE error (HTTP 413).
func NewPayloadTooLargeError(details string) *AppError {
	return New(
		CodePayloadTooLarge,
		"Payload exceeds maximum allowed size.",
		details,
		http.StatusRequestEntityTooLarge,
	)
}

// NewInternalError creates an ERR_INTERNAL error (HTTP 500).
func NewInternalError(details string) *AppError {
	return New(
		CodeInternal,
		"An unexpected internal server error occurred.",
		details,
		http.StatusInternalServerError,
	)
}
