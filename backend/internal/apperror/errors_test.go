package apperror

import (
	"errors"
	"net/http"
	"testing"
)

func TestAppError_ErrorFormatting(t *testing.T) {
	tests := []struct {
		name     string
		err      *AppError
		expected string
	}{
		{
			name: "with details",
			err: &AppError{
				Code:    CodeMalformedJSON,
				Message: "Invalid JSON syntax.",
				Details: "unexpected EOF at byte 12",
			},
			expected: "ERR_MALFORMED_JSON: Invalid JSON syntax. (unexpected EOF at byte 12)",
		},
		{
			name: "without details",
			err: &AppError{
				Code:    CodeMethodNotAllowed,
				Message: "HTTP method not allowed.",
			},
			expected: "ERR_METHOD_NOT_ALLOWED: HTTP method not allowed.",
		},
		{
			name:     "nil receiver",
			err:      nil,
			expected: "",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.err.Error(); got != tc.expected {
				t.Fatalf("expected '%s', got '%s'", tc.expected, got)
			}
		})
	}
}

func TestAppError_Constructors(t *testing.T) {
	tests := []struct {
		name           string
		err            *AppError
		expectedCode   string
		expectedStatus int
		details        string
	}{
		{
			name:           "MalformedJSON",
			err:            NewMalformedJSONError("invalid char"),
			expectedCode:   CodeMalformedJSON,
			expectedStatus: http.StatusBadRequest,
			details:        "invalid char",
		},
		{
			name:           "InvalidOperand",
			err:            NewInvalidOperandError("NaN operand"),
			expectedCode:   CodeInvalidOperand,
			expectedStatus: http.StatusBadRequest,
			details:        "NaN operand",
		},
		{
			name:           "UnsupportedOperation",
			err:            NewUnsupportedOperationError("modulo"),
			expectedCode:   CodeUnsupportedOperation,
			expectedStatus: http.StatusBadRequest,
			details:        "modulo",
		},
		{
			name:           "InvalidArity",
			err:            NewInvalidArityError("missing operand_b"),
			expectedCode:   CodeInvalidArity,
			expectedStatus: http.StatusBadRequest,
			details:        "missing operand_b",
		},
		{
			name:           "DivisionByZero",
			err:            NewDivisionByZeroError("divisor is zero"),
			expectedCode:   CodeDivisionByZero,
			expectedStatus: http.StatusUnprocessableEntity,
			details:        "divisor is zero",
		},
		{
			name:           "NegativeRadicand",
			err:            NewNegativeRadicandError("radicand is -4"),
			expectedCode:   CodeNegativeRadicand,
			expectedStatus: http.StatusUnprocessableEntity,
			details:        "radicand is -4",
		},
		{
			name:           "ComplexResult",
			err:            NewComplexResultError("(-4)^0.5"),
			expectedCode:   CodeComplexResult,
			expectedStatus: http.StatusUnprocessableEntity,
			details:        "(-4)^0.5",
		},
		{
			name:           "NumericOverflow",
			err:            NewNumericOverflowError("magnitude exceeds 10^1000"),
			expectedCode:   CodeNumericOverflow,
			expectedStatus: http.StatusUnprocessableEntity,
			details:        "magnitude exceeds 10^1000",
		},
		{
			name:           "MethodNotAllowed",
			err:            NewMethodNotAllowedError("POST required"),
			expectedCode:   CodeMethodNotAllowed,
			expectedStatus: http.StatusMethodNotAllowed,
			details:        "POST required",
		},
		{
			name:           "PayloadTooLarge",
			err:            NewPayloadTooLargeError("body exceeds 4KB"),
			expectedCode:   CodePayloadTooLarge,
			expectedStatus: http.StatusRequestEntityTooLarge,
			details:        "body exceeds 4KB",
		},
		{
			name:           "InternalError",
			err:            NewInternalError("unexpected panic"),
			expectedCode:   CodeInternal,
			expectedStatus: http.StatusInternalServerError,
			details:        "unexpected panic",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if tc.err.Code != tc.expectedCode {
				t.Errorf("expected code %s, got %s", tc.expectedCode, tc.err.Code)
			}
			if tc.err.HTTPStatus != tc.expectedStatus {
				t.Errorf("expected status %d, got %d", tc.expectedStatus, tc.err.HTTPStatus)
			}
			if tc.err.Details != tc.details {
				t.Errorf("expected details %s, got %s", tc.details, tc.err.Details)
			}
			if tc.err.Message == "" {
				t.Errorf("expected non-empty message")
			}
		})
	}
}

func TestAppError_ErrorsAs(t *testing.T) {
	original := NewDivisionByZeroError("divide by zero")
	var asErr error = original

	var target *AppError
	if !errors.As(asErr, &target) {
		t.Fatalf("expected errors.As to succeed for *AppError")
	}

	if target.Code != CodeDivisionByZero {
		t.Fatalf("expected target code %s, got %s", CodeDivisionByZero, target.Code)
	}
}
