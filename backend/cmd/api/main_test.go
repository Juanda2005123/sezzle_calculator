package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/shopspring/decimal"
)

func TestCalculateDecimalSum_Valid(t *testing.T) {



	sum, err := CalculateDecimalSum("0.1", "0.2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	expected := decimal.RequireFromString("0.3")
	if !sum.Equal(expected) {
		t.Fatalf("expected 0.1 + 0.2 to equal 0.3, got %s", sum.String())
	}
}

func TestCalculateDecimalSum_Invalid(t *testing.T) {
	tests := []struct {
		name string
		a    string
		b    string
	}{
		{"invalid operand a", "invalid", "0.2"},
		{"invalid operand b", "0.1", "invalid"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := CalculateDecimalSum(tc.a, tc.b)
			if err == nil {
				t.Fatalf("expected error for inputs (%s, %s), got nil", tc.a, tc.b)
			}
		})
	}
}

func TestHealthEndpoint(t *testing.T) {
	router := NewRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	if contentType := rec.Header().Get("Content-Type"); contentType != "application/json; charset=utf-8" {
		t.Fatalf("expected Content-Type application/json; charset=utf-8, got %s", contentType)
	}

	var resp HealthResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Status != "healthy" {
		t.Fatalf("expected status 'healthy', got '%s'", resp.Status)
	}
}
