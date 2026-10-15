package main

import (
	"fmt"
	"net/http"
	"os"
	"time"
)

// CheckHealth queries the /api/v1/health endpoint on the specified port.
// Returns 0 on success, or 1 on failure.
func CheckHealth(client *http.Client, port string) int {
	if port == "" {
		port = "8080"
	}
	if client == nil {
		client = &http.Client{Timeout: 3 * time.Second}
	}

	resp, err := client.Get(fmt.Sprintf("http://localhost:%s/api/v1/health", port))
	if err != nil || resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}

func main() {
	os.Exit(CheckHealth(nil, os.Getenv("PORT")))
}
