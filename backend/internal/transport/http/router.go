package httptransport

import (
	"net/http"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/calculator"
)

// RouterConfig defines configuration settings for the HTTP transport layer.
type RouterConfig struct {
	AllowedOrigin string
}

// NewRouter creates and configures the HTTP request multiplexer with handlers and middleware stack.
func NewRouter(engine *calculator.Engine, cfg ...RouterConfig) http.Handler {
	handler := NewHandler(engine)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/health", handler.HandleHealth)
	mux.HandleFunc("/api/v1/calculate", handler.HandleCalculate)

	allowedOrigin := ""
	if len(cfg) > 0 {
		allowedOrigin = cfg[0].AllowedOrigin
	}

	cors := CORSMiddleware(allowedOrigin)
	return RecoveryMiddleware(cors(mux))
}
