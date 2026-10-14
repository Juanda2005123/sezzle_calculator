package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/calculator"
	httptransport "github.com/Juanda2005123/sezzle_calculator/backend/internal/transport/http"
	"github.com/shopspring/decimal"
)

// NewServer configures an http.Server with production timeouts and the application router.
func NewServer(port string, router http.Handler) *http.Server {
	if port == "" {
		port = "8080"
	}

	return &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
}

func main() {
	engine := calculator.NewEngine()

	// Verify decimal linkage and arithmetic precision
	bDec := decimal.RequireFromString("0.2")
	res, err := engine.Calculate(calculator.OpAdd, decimal.RequireFromString("0.1"), &bDec)
	if err != nil {
		log.Fatalf("Initialization calculation check failed: %v", err)
	}

	// CLI smoke check mode for Phase verification gates
	if os.Getenv("SMOKE_CHECK") == "1" {
		fmt.Println(res.Formatted)
		os.Exit(0)
	}

	port := os.Getenv("PORT")
	router := httptransport.NewRouter(engine)
	server := NewServer(port, router)

	log.Printf("Sezzle Precision Calculator API starting on %s (decimal check: 0.1 + 0.2 = %s)", server.Addr, res.Formatted)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}
}
