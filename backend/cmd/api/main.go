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

// VerifyEngine performs an initial startup arithmetic precision sanity check.
func VerifyEngine(engine *calculator.Engine) (string, error) {
	bDec := decimal.RequireFromString("0.2")
	res, err := engine.Calculate(calculator.OpAdd, decimal.RequireFromString("0.1"), &bDec)
	if err != nil {
		return "", err
	}
	return res.Formatted, nil
}

// BuildServer instantiates the engine, router, and server for deployment.
func BuildServer(port string) (*http.Server, string, error) {
	engine := calculator.NewEngine()
	formatted, err := VerifyEngine(engine)
	if err != nil {
		return nil, "", err
	}
	router := httptransport.NewRouter(engine)
	server := NewServer(port, router)
	return server, formatted, nil
}

func main() {
	server, formatted, err := BuildServer(os.Getenv("PORT"))
	if err != nil {
		log.Fatalf("Initialization calculation check failed: %v", err)
	}

	// CLI smoke check mode for Phase verification gates
	if os.Getenv("SMOKE_CHECK") == "1" {
		fmt.Println(formatted)
		os.Exit(0)
	}

	log.Printf("Sezzle Precision Calculator API starting on %s (decimal check: 0.1 + 0.2 = %s)", server.Addr, formatted)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}
}
