package httptransport

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/apperror"
	"github.com/Juanda2005123/sezzle_calculator/backend/internal/calculator"
)

func setupTestRouter() http.Handler {
	engine := calculator.NewEngine()
	return NewRouter(engine, RouterConfig{AllowedOrigin: "*"})
}

func TestHandler_HealthCheck(t *testing.T) {
	router := setupTestRouter()

	t.Run("GET /api/v1/health returns 200 OK", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}

		if ct := rec.Header().Get("Content-Type"); ct != "application/json; charset=utf-8" {
			t.Errorf("expected Content-Type application/json; charset=utf-8, got %s", ct)
		}

		var resp HealthResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if resp.Status != "healthy" {
			t.Errorf("expected status 'healthy', got '%s'", resp.Status)
		}
	})

	t.Run("POST /api/v1/health returns 405 Method Not Allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/health", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected status 405, got %d", rec.Code)
		}

		var errResp ErrorResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}
		if errResp.Error.Code != apperror.CodeMethodNotAllowed {
			t.Errorf("expected error code %s, got %s", apperror.CodeMethodNotAllowed, errResp.Error.Code)
		}
	})
}

func TestHandler_HappyPaths(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name           string
		payload        string
		expectedF      string
		expectedResult string
		expectedExpr   string
	}{
		{
			name:           "binary numeric literals 0.1 + 0.2",
			payload:        `{"operation": "add", "operand_a": 0.1, "operand_b": 0.2}`,
			expectedF:      "0.3",
			expectedResult: "0.3",
			expectedExpr:   "0.1 + 0.2 = 0.3",
		},
		{
			name:           "string-encoded operands 10.5 / 2",
			payload:        `{"operation": "divide", "operand_a": "10.5", "operand_b": "2"}`,
			expectedF:      "5.25",
			expectedResult: "5.25",
			expectedExpr:   "10.5 / 2 = 5.25",
		},
		{
			name:           "unary sqrt 144",
			payload:        `{"operation": "sqrt", "operand_a": 144}`,
			expectedF:      "12",
			expectedResult: "12",
			expectedExpr:   "sqrt(144) = 12",
		},
		{
			name:           "unary percent 50%",
			payload:        `{"operation": "percent", "operand_a": 50}`,
			expectedF:      "0.5",
			expectedResult: "0.5",
			expectedExpr:   "50% = 0.5",
		},
		{
			name:           "binary percent 20% of 150",
			payload:        `{"operation": "percent", "operand_a": 20, "operand_b": 150}`,
			expectedF:      "30",
			expectedResult: "30",
			expectedExpr:   "20% of 150 = 30",
		},
		{
			name:           "power 2 ^ 10",
			payload:        `{"operation": "power", "operand_a": 2, "operand_b": 10}`,
			expectedF:      "1024",
			expectedResult: "1024",
			expectedExpr:   "2 ^ 10 = 1024",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.payload))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d; body: %s", rec.Code, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to decode calculate response: %v", err)
			}

			if resp.Data.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, resp.Data.Formatted)
			}
			if string(resp.Data.Result) != tc.expectedResult {
				t.Errorf("expected numeric result literal '%s', got '%s'", tc.expectedResult, string(resp.Data.Result))
			}
			if resp.Data.Expression != tc.expectedExpr {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedExpr, resp.Data.Expression)
			}
		})
	}
}

func TestHandler_ClientContractErrors(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name         string
		payload      string
		expectedCode string
	}{
		// Malformed JSON (syntax, empty, unknown fields, trailing data)
		{"empty payload", "", apperror.CodeMalformedJSON},
		{"syntax error unclosed json", `{"operation": "add",`, apperror.CodeMalformedJSON},
		{"trailing data after json", `{"operation":"add","operand_a":1,"operand_b":2} extra`, apperror.CodeMalformedJSON},
		{"unknown field disallowed", `{"operation":"add","operand_a":1,"operand_b":2,"unknown":true}`, apperror.CodeMalformedJSON},

		// Invalid Operand
		{"missing operand_a", `{"operation":"add","operand_b":2}`, apperror.CodeInvalidOperand},
		{"null operand_a", `{"operation":"add","operand_a":null,"operand_b":2}`, apperror.CodeInvalidOperand},
		{"non-numeric string operand", `{"operation":"add","operand_a":"abc","operand_b":2}`, apperror.CodeInvalidOperand},
		{"boolean operand true", `{"operation":"add","operand_a":true,"operand_b":2}`, apperror.CodeInvalidOperand},
		{"boolean operand false", `{"operation":"add","operand_a":1,"operand_b":false}`, apperror.CodeInvalidOperand},
		{"array operand", `{"operation":"add","operand_a":[1,2],"operand_b":2}`, apperror.CodeInvalidOperand},
		{"object operand", `{"operation":"add","operand_a":{"num":1},"operand_b":2}`, apperror.CodeInvalidOperand},
		{"empty string operand", `{"operation":"add","operand_a":"","operand_b":2}`, apperror.CodeInvalidOperand},
		{"whitespace string operand", `{"operation":"add","operand_a":"   ","operand_b":2}`, apperror.CodeInvalidOperand},
		{"NaN string operand", `{"operation":"add","operand_a":"NaN","operand_b":2}`, apperror.CodeInvalidOperand},
		{"Infinity string operand", `{"operation":"add","operand_a":"Infinity","operand_b":2}`, apperror.CodeInvalidOperand},
		{"-Infinity string operand", `{"operation":"add","operand_a":"-Infinity","operand_b":2}`, apperror.CodeInvalidOperand},

		// Unsupported Operation
		{"unsupported operation modulo", `{"operation":"modulo","operand_a":10,"operand_b":3}`, apperror.CodeUnsupportedOperation},
		{"empty operation", `{"operation":"","operand_a":10,"operand_b":3}`, apperror.CodeUnsupportedOperation},

		// Invalid Arity
		{"missing operand_b for add", `{"operation":"add","operand_a":10}`, apperror.CodeInvalidArity},
		{"unexpected operand_b for sqrt", `{"operation":"sqrt","operand_a":16,"operand_b":2}`, apperror.CodeInvalidArity},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.payload))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected status 400, got %d; body: %s", rec.Code, rec.Body.String())
			}

			var errResp ErrorResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}

			if errResp.Error.Code != tc.expectedCode {
				t.Errorf("expected error code '%s', got '%s' (message: %s)", tc.expectedCode, errResp.Error.Code, errResp.Error.Message)
			}
		})
	}
}

func TestHandler_MathematicalDomainErrors(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name         string
		payload      string
		expectedCode string
	}{
		{"division by zero", `{"operation":"divide","operand_a":10,"operand_b":0}`, apperror.CodeDivisionByZero},
		{"zero base negative exponent", `{"operation":"power","operand_a":0,"operand_b":-1}`, apperror.CodeDivisionByZero},
		{"negative radicand", `{"operation":"sqrt","operand_a":-9}`, apperror.CodeNegativeRadicand},
		{"complex power result", `{"operation":"power","operand_a":-4,"operand_b":0.5}`, apperror.CodeComplexResult},
		{"numeric overflow", `{"operation":"power","operand_a":10,"operand_b":10001}`, apperror.CodeNumericOverflow},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(tc.payload))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusUnprocessableEntity {
				t.Fatalf("expected status 422, got %d; body: %s", rec.Code, rec.Body.String())
			}

			var errResp ErrorResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
				t.Fatalf("failed to decode error response: %v", err)
			}

			if errResp.Error.Code != tc.expectedCode {
				t.Errorf("expected error code '%s', got '%s'", tc.expectedCode, errResp.Error.Code)
			}
		})
	}
}

func TestHandler_ProtocolSecurityAndResiliency(t *testing.T) {
	router := setupTestRouter()

	t.Run("GET /api/v1/calculate returns 405 Method Not Allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/calculate", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected status 405, got %d", rec.Code)
		}
		if allow := rec.Header().Get("Allow"); !strings.Contains(allow, "POST") {
			t.Errorf("expected Allow header containing POST, got %s", allow)
		}

		var errResp ErrorResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}
		if errResp.Error.Code != apperror.CodeMethodNotAllowed {
			t.Errorf("expected error code %s, got %s", apperror.CodeMethodNotAllowed, errResp.Error.Code)
		}
	})

	t.Run("PUT /api/v1/calculate returns 405 Method Not Allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/v1/calculate", bytes.NewBufferString(`{}`))
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected status 405, got %d", rec.Code)
		}
	})

	t.Run("OPTIONS /api/v1/calculate returns 204 No Content with CORS", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected status 204, got %d", rec.Code)
		}
		if origin := rec.Header().Get("Access-Control-Allow-Origin"); origin != "*" {
			t.Errorf("expected Access-Control-Allow-Origin '*', got %s", origin)
		}
		if methods := rec.Header().Get("Access-Control-Allow-Methods"); !strings.Contains(methods, "POST") {
			t.Errorf("expected Access-Control-Allow-Methods containing POST, got %s", methods)
		}
	})

	t.Run("Payload exceeding 4096 bytes returns 413 Content Too Large", func(t *testing.T) {
		// Create a large JSON payload > 4096 bytes
		padding := strings.Repeat("0", 5000)
		largePayload := `{"operation": "add", "operand_a": "` + padding + `", "operand_b": 1}`

		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", bytes.NewBufferString(largePayload))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusRequestEntityTooLarge {
			t.Fatalf("expected status 413, got %d; body: %s", rec.Code, rec.Body.String())
		}

		var errResp ErrorResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}
		if errResp.Error.Code != apperror.CodePayloadTooLarge {
			t.Errorf("expected error code %s, got %s", apperror.CodePayloadTooLarge, errResp.Error.Code)
		}
	})

	t.Run("Recovery middleware intercepts panic and returns 500 Internal Server Error", func(t *testing.T) {
		panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			panic("simulated fatal runtime panic")
		})

		wrapped := RecoveryMiddleware(panicHandler)

		req := httptest.NewRequest(http.MethodGet, "/panic", nil)
		rec := httptest.NewRecorder()

		wrapped.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected status 500, got %d", rec.Code)
		}

		var errResp ErrorResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &errResp); err != nil {
			t.Fatalf("failed to decode error response: %v", err)
		}
		if errResp.Error.Code != apperror.CodeInternal {
			t.Errorf("expected error code %s, got %s", apperror.CodeInternal, errResp.Error.Code)
		}
	})
}

func TestCORSMiddleware_Config(t *testing.T) {
	t.Run("default wildcard origin when empty", func(t *testing.T) {
		cors := CORSMiddleware("")
		dummy := cors(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		rec := httptest.NewRecorder()
		dummy.ServeHTTP(rec, req)

		if origin := rec.Header().Get("Access-Control-Allow-Origin"); origin != "*" {
			t.Errorf("expected '*', got '%s'", origin)
		}
	})

	t.Run("origin from env var", func(t *testing.T) {
		t.Setenv("ALLOWED_ORIGINS", "https://example.com")
		cors := CORSMiddleware("")
		dummy := cors(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}))

		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		rec := httptest.NewRecorder()
		dummy.ServeHTTP(rec, req)

		if origin := rec.Header().Get("Access-Control-Allow-Origin"); origin != "https://example.com" {
			t.Errorf("expected 'https://example.com', got '%s'", origin)
		}
	})
}

func TestOperand_UnmarshalJSON_Direct(t *testing.T) {
	var op Operand

	if err := op.UnmarshalJSON([]byte("null")); err == nil {
		t.Errorf("expected error for 'null'")
	}
	if err := op.UnmarshalJSON([]byte(`"+Infinity"`)); err == nil {
		t.Errorf("expected error for '+Infinity'")
	}
	if err := op.UnmarshalJSON([]byte(`"invalid-num"`)); err == nil {
		t.Errorf("expected error for 'invalid-num'")
	}
}
