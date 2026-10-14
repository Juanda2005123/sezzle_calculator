package httptransport

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/apperror"
	"github.com/Juanda2005123/sezzle_calculator/backend/internal/calculator"
	"github.com/shopspring/decimal"
)

// Handler manages HTTP endpoints for the precision calculator API.
type Handler struct {
	engine *calculator.Engine
}

// NewHandler creates a new Handler with the given calculation engine.
func NewHandler(engine *calculator.Engine) *Handler {
	return &Handler{
		engine: engine,
	}
}

// writeJSON writes a standardized JSON response with UTF-8 character encoding.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// writeError serializes an AppError into the standardized error envelope.
func writeError(w http.ResponseWriter, appErr *apperror.AppError) {
	resp := ErrorResponse{
		Error: ErrorPayload{
			Code:    appErr.Code,
			Message: appErr.Message,
			Details: appErr.Details,
		},
	}
	writeJSON(w, appErr.HTTPStatus, resp)
}

// HandleHealth handles GET /api/v1/health requests.
func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD, OPTIONS")
		writeError(w, apperror.NewMethodNotAllowedError(fmt.Sprintf("method %s is not allowed", r.Method)))
		return
	}
	writeJSON(w, http.StatusOK, HealthResponse{Status: "healthy"})
}

// HandleCalculate handles POST /api/v1/calculate requests.
func (h *Handler) HandleCalculate(w http.ResponseWriter, r *http.Request) {
	// Protocol validation: only POST is allowed (OPTIONS is handled by CORS)
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST, OPTIONS")
		writeError(w, apperror.NewMethodNotAllowedError(fmt.Sprintf("method %s is not allowed", r.Method)))
		return
	}

	// Security & DoS Protection: Limit request body to 4096 bytes
	r.Body = http.MaxBytesReader(w, r.Body, 4096)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	dec.UseNumber()

	var req CalculateRequest
	if err := dec.Decode(&req); err != nil {
		// Check for 413 Payload Too Large
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			writeError(w, apperror.NewPayloadTooLargeError("request payload exceeds 4096 bytes limit"))
			return
		}

		// Check if error was produced by custom Operand unmarshaler
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			writeError(w, appErr)
			return
		}

		// All other decode failures (syntax error, empty body, unknown fields)
		writeError(w, apperror.NewMalformedJSONError(err.Error()))
		return
	}

	// Verify no trailing data after the first JSON object
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		writeError(w, apperror.NewMalformedJSONError("unexpected trailing data in request body"))
		return
	}

	// Validate operation and required operand_a
	req.Operation = strings.TrimSpace(strings.ToLower(req.Operation))
	if req.Operation == "" {
		writeError(w, apperror.NewUnsupportedOperationError("missing or empty operation"))
		return
	}
	if req.OperandA == nil {
		writeError(w, apperror.NewInvalidOperandError("missing required operand_a"))
		return
	}

	var opB *decimal.Decimal
	if req.OperandB != nil {
		d := req.OperandB.Decimal
		opB = &d
	}

	calcResult, err := h.engine.Calculate(calculator.Operation(req.Operation), req.OperandA.Decimal, opB)
	if err != nil {
		var appErr *apperror.AppError
		if errors.As(err, &appErr) {
			writeError(w, appErr)
			return
		}
		writeError(w, apperror.NewInternalError(err.Error()))
		return
	}

	resp := CalculateResponse{
		Data: CalculateData{
			Operation:  calcResult.Operation,
			OperandA:   calcResult.OperandA,
			OperandB:   calcResult.OperandB,
			Result:     json.Number(calcResult.Formatted),
			Formatted:  calcResult.Formatted,
			Expression: calcResult.Expression,
		},
	}

	writeJSON(w, http.StatusOK, resp)
}
