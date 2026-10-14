package httptransport

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/apperror"
)

// CORSMiddleware manages Cross-Origin Resource Sharing headers and preflight requests.
func CORSMiddleware(allowedOrigin string) func(http.Handler) http.Handler {
	if allowedOrigin == "" {
		allowedOrigin = os.Getenv("ALLOWED_ORIGINS")
		if allowedOrigin == "" {
			allowedOrigin = "*"
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept, Origin")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RecoveryMiddleware intercepts runtime panics, logs the incident, and returns a 500 JSON envelope.
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("panic recovered in HTTP handler",
					"error", fmt.Sprintf("%v", rec),
					"path", r.URL.Path,
					"method", r.Method,
				)

				writeError(w, apperror.NewInternalError("an unexpected internal server error occurred"))
			}
		}()

		next.ServeHTTP(w, r)
	})
}
