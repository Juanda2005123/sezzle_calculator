package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/shopspring/decimal"
)

// HealthResponse represents the payload returned by the health check endpoint.
type HealthResponse struct {
	Status string `json:"status"`
}

// NewRouter constructs and returns the HTTP request multiplexer with registered routes.
func NewRouter() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", HealthHandler)
	return mux
}

// HealthHandler responds with HTTP 200 and a healthy status envelope.
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(HealthResponse{Status: "healthy"})
}

// CalculateDecimalSum adds two decimal numbers represented as strings using shopspring/decimal.
func CalculateDecimalSum(a, b string) (decimal.Decimal, error) {
	d1, err := decimal.NewFromString(a)
	if err != nil {
		return decimal.Zero, err
	}
	d2, err := decimal.NewFromString(b)
	if err != nil {
		return decimal.Zero, err
	}
	return d1.Add(d2), nil
}

func main() {
	sum, err := CalculateDecimalSum("0.1", "0.2")
	if err != nil {
		log.Fatalf("Decimal calculation failed: %v", err)
	}

	// CLI smoke check mode for Phase 1 verification gate
	if os.Getenv("SMOKE_CHECK") == "1" {
		fmt.Println(sum.String())
		os.Exit(0)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := NewRouter()
	addr := ":" + port
	log.Printf("Sezzle Precision Calculator API starting on %s (decimal check: 0.1 + 0.2 = %s)", addr, sum.String())
	if err := http.ListenAndServe(addr, router); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}
}
