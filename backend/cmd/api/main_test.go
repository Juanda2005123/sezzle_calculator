package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/calculator"
	httptransport "github.com/Juanda2005123/sezzle_calculator/backend/internal/transport/http"
)

func TestNewServer(t *testing.T) {
	engine := calculator.NewEngine()
	router := httptransport.NewRouter(engine)

	t.Run("default port 8080", func(t *testing.T) {
		srv := NewServer("", router)
		if srv.Addr != ":8080" {
			t.Errorf("expected :8080, got %s", srv.Addr)
		}
		if srv.ReadHeaderTimeout != 5*time.Second {
			t.Errorf("expected 5s ReadHeaderTimeout, got %v", srv.ReadHeaderTimeout)
		}
		if srv.ReadTimeout != 10*time.Second {
			t.Errorf("expected 10s ReadTimeout, got %v", srv.ReadTimeout)
		}
		if srv.WriteTimeout != 10*time.Second {
			t.Errorf("expected 10s WriteTimeout, got %v", srv.WriteTimeout)
		}
		if srv.IdleTimeout != 120*time.Second {
			t.Errorf("expected 120s IdleTimeout, got %v", srv.IdleTimeout)
		}
	})

	t.Run("custom port", func(t *testing.T) {
		srv := NewServer("9090", router)
		if srv.Addr != ":9090" {
			t.Errorf("expected :9090, got %s", srv.Addr)
		}
	})
}

func TestServerRouter_Health(t *testing.T) {
	engine := calculator.NewEngine()
	router := httptransport.NewRouter(engine)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var resp struct {
		Status string `json:"status"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Status != "healthy" {
		t.Errorf("expected 'healthy', got '%s'", resp.Status)
	}
}
