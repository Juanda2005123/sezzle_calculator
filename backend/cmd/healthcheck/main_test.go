package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestCheckHealth(t *testing.T) {
	t.Run("healthy status returns 0", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/api/v1/health" {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte(`{"status":"healthy"}`))
				return
			}
			w.WriteHeader(http.StatusNotFound)
		}))
		defer ts.Close()

		u, err := url.Parse(ts.URL)
		if err != nil {
			t.Fatalf("failed to parse url: %v", err)
		}

		status := CheckHealth(ts.Client(), u.Port())
		if status != 0 {
			t.Errorf("expected status 0, got %d", status)
		}
	})

	t.Run("unhealthy status returns 1", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		}))
		defer ts.Close()

		u, err := url.Parse(ts.URL)
		if err != nil {
			t.Fatalf("failed to parse url: %v", err)
		}

		status := CheckHealth(ts.Client(), u.Port())
		if status != 1 {
			t.Errorf("expected status 1, got %d", status)
		}
	})

	t.Run("connection error returns 1", func(t *testing.T) {
		status := CheckHealth(nil, "59999")
		if status != 1 {
			t.Errorf("expected status 1, got %d", status)
		}
	})

	t.Run("default port fallback", func(t *testing.T) {
		status := CheckHealth(nil, "")
		if status != 1 {
			t.Errorf("expected status 1 (unreachable default port), got %d", status)
		}
	})
}
