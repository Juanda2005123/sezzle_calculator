package httptransport

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/apperror"
	"github.com/Juanda2005123/sezzle_calculator/backend/internal/calculator"
	"github.com/shopspring/decimal"
)

// Operand represents a flexible numeric operand that accepts both JSON numeric literals
// and numeric strings directly into a decimal.Decimal without floating-point conversion.
type Operand struct {
	decimal.Decimal
}

// UnmarshalJSON unmarshals JSON numbers and strings into decimal.Decimal, rejecting invalid types.
func (o *Operand) UnmarshalJSON(data []byte) error {
	raw := string(data)
	if raw == "null" {
		return apperror.NewInvalidOperandError("null operand is not permitted")
	}
	if raw == "true" || raw == "false" {
		return apperror.NewInvalidOperandError("boolean values are not permitted as operands")
	}
	if len(data) > 0 && (data[0] == '[' || data[0] == '{') {
		return apperror.NewInvalidOperandError("arrays and objects are not permitted as operands")
	}

	// If string literal, unmarshal quotes first
	if len(data) >= 2 && data[0] == '"' && data[len(data)-1] == '"' {
		var s string
		if err := json.Unmarshal(data, &s); err != nil {
			return apperror.NewInvalidOperandError(fmt.Sprintf("invalid string encoding: %v", err))
		}
		trimmed := strings.TrimSpace(s)
		if trimmed == "" {
			return apperror.NewInvalidOperandError("operand string cannot be empty")
		}
		lower := strings.ToLower(trimmed)
		if lower == "nan" || lower == "infinity" || lower == "-infinity" || lower == "+infinity" {
			return apperror.NewInvalidOperandError("NaN and Infinity values are not permitted")
		}
		d, err := decimal.NewFromString(trimmed)
		if err != nil {
			return apperror.NewInvalidOperandError(fmt.Sprintf("invalid numeric string '%s'", trimmed))
		}
		o.Decimal = d
		return nil
	}

	// JSON numeric literal
	d, err := decimal.NewFromString(raw)
	if err != nil {
		return apperror.NewInvalidOperandError(fmt.Sprintf("invalid numeric value '%s'", raw))
	}
	o.Decimal = d
	return nil
}

// CalculateRequest represents the incoming JSON request payload for calculation.
type CalculateRequest struct {
	Operation string   `json:"operation"`
	OperandA  *Operand `json:"operand_a"`
	OperandB  *Operand `json:"operand_b,omitempty"`
}

// CalculateData represents the calculation result payload in the success envelope.
type CalculateData struct {
	Operation  calculator.Operation `json:"operation"`
	OperandA   string               `json:"operand_a"`
	OperandB   *string              `json:"operand_b,omitempty"`
	Result     json.Number          `json:"result"`
	Formatted  string               `json:"formatted"`
	Expression string               `json:"expression"`
}

// CalculateResponse represents the standardized JSON success envelope.
type CalculateResponse struct {
	Data CalculateData `json:"data"`
}

// ErrorPayload represents the error details in the error response envelope.
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// ErrorResponse represents the standardized JSON error envelope.
type ErrorResponse struct {
	Error ErrorPayload `json:"error"`
}

// HealthResponse represents the health check response payload.
type HealthResponse struct {
	Status string `json:"status"`
}
