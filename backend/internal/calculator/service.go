package calculator

import (
	"fmt"
	"math"
	"math/big"
	"strings"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/apperror"
	"github.com/shopspring/decimal"
)

// MaxPrecision defines the maximum number of decimal places for final output rounding.
const MaxPrecision = 16

// GuardPrecision defines the intermediate precision digits used to prevent premature rounding truncation.
const GuardPrecision = 32

// Operation represents a supported calculator mathematical operation.
type Operation string

const (
	OpAdd      Operation = "add"
	OpSubtract Operation = "subtract"
	OpMultiply Operation = "multiply"
	OpDivide   Operation = "divide"
	OpPower    Operation = "power"
	OpSqrt     Operation = "sqrt"
	OpPercent  Operation = "percent"
)

// CalculationResult encapsulates the output of a successfully evaluated calculation.
type CalculationResult struct {
	Operation  Operation       `json:"operation"`
	OperandA   string          `json:"operand_a"`
	OperandB   *string         `json:"operand_b,omitempty"`
	Result     decimal.Decimal `json:"result"`
	Formatted  string          `json:"formatted"`
	Expression string          `json:"expression"`
}

// Engine encapsulates arbitrary-precision calculation logic and domain boundaries.
type Engine struct {
	maxMagnitude         decimal.Decimal
	maxExponentMagnitude decimal.Decimal
}

// NewEngine constructs a new calculator Engine with standard safety bounds.
func NewEngine() *Engine {
	return &Engine{
		maxMagnitude:         decimal.New(1, 1000),
		maxExponentMagnitude: decimal.NewFromInt(10000),
	}
}

// FormatDecimal returns a clean canonical representation of a Decimal with trailing zeros stripped
// and negative zero normalized to "0".
func FormatDecimal(d decimal.Decimal) string {
	if d.IsZero() {
		return "0"
	}
	s := d.String()
	if strings.Contains(s, ".") {
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
	}
	return s
}

// IsInteger returns true if the Decimal has no fractional part.
func IsInteger(d decimal.Decimal) bool {
	return d.Equal(d.Truncate(0))
}

// Calculate executes the requested mathematical operation adhering strictly to domain constraints.
func (e *Engine) Calculate(op Operation, operandA decimal.Decimal, operandB *decimal.Decimal) (*CalculationResult, error) {
	// 1. Operation validation
	switch op {
	case OpAdd, OpSubtract, OpMultiply, OpDivide, OpPower, OpSqrt, OpPercent:
		// Supported operation
	default:
		return nil, apperror.NewUnsupportedOperationError(fmt.Sprintf("operation '%s' is not supported", op))
	}

	// 2. Arity validation
	if op == OpSqrt {
		if operandB != nil {
			return nil, apperror.NewInvalidArityError("operation 'sqrt' is unary and does not accept operand_b")
		}
	} else if op == OpPercent {
		// Dual-arity: operandB may be nil (unary) or non-nil (binary)
	} else {
		// Binary operations
		if operandB == nil {
			return nil, apperror.NewInvalidArityError(fmt.Sprintf("operation '%s' is binary and requires operand_b", op))
		}
	}

	// 3. Magnitude validation on inputs
	if operandA.Abs().GreaterThan(e.maxMagnitude) {
		return nil, apperror.NewNumericOverflowError(fmt.Sprintf("magnitude of operand_a exceeds 10^1000"))
	}
	if operandB != nil && operandB.Abs().GreaterThan(e.maxMagnitude) {
		return nil, apperror.NewNumericOverflowError(fmt.Sprintf("magnitude of operand_b exceeds 10^1000"))
	}

	normA := FormatDecimal(operandA)
	var normB *string
	if operandB != nil {
		s := FormatDecimal(*operandB)
		normB = &s
	}

	var result decimal.Decimal
	var expression string

	switch op {
	case OpAdd:
		raw := operandA.Add(*operandB)
		if raw.Abs().GreaterThan(e.maxMagnitude) {
			return nil, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
		}
		result = raw.Round(MaxPrecision)
		expression = fmt.Sprintf("%s + %s = %s", normA, *normB, FormatDecimal(result))

	case OpSubtract:
		raw := operandA.Sub(*operandB)
		if raw.Abs().GreaterThan(e.maxMagnitude) {
			return nil, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
		}
		result = raw.Round(MaxPrecision)
		expression = fmt.Sprintf("%s - %s = %s", normA, *normB, FormatDecimal(result))

	case OpMultiply:
		raw := operandA.Mul(*operandB)
		if raw.Abs().GreaterThan(e.maxMagnitude) {
			return nil, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
		}
		result = raw.Round(MaxPrecision)
		expression = fmt.Sprintf("%s * %s = %s", normA, *normB, FormatDecimal(result))

	case OpDivide:
		if operandB.IsZero() {
			return nil, apperror.NewDivisionByZeroError("division by zero")
		}
		raw := operandA.DivRound(*operandB, GuardPrecision)
		if raw.Abs().GreaterThan(e.maxMagnitude) {
			return nil, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
		}
		result = raw.Round(MaxPrecision)
		expression = fmt.Sprintf("%s / %s = %s", normA, *normB, FormatDecimal(result))

	case OpSqrt:
		if operandA.IsNegative() {
			return nil, apperror.NewNegativeRadicandError(fmt.Sprintf("square root of negative number: %s", operandA.String()))
		}
		if operandA.IsZero() {
			result = decimal.Zero
		} else {
			result = e.computeSqrt(operandA)
		}
		expression = fmt.Sprintf("sqrt(%s) = %s", normA, FormatDecimal(result))

	case OpPower:
		res, err := e.computePower(operandA, *operandB)
		if err != nil {
			return nil, err
		}
		result = res
		expression = fmt.Sprintf("%s ^ %s = %s", normA, *normB, FormatDecimal(result))

	case OpPercent:
		if operandB == nil {
			// Unary percent: operandA / 100
			hundred := decimal.NewFromInt(100)
			raw := operandA.DivRound(hundred, GuardPrecision)
			if raw.Abs().GreaterThan(e.maxMagnitude) {
				return nil, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
			}
			result = raw.Round(MaxPrecision)
			expression = fmt.Sprintf("%s%% = %s", normA, FormatDecimal(result))
		} else {
			// Binary percent: (operandA * operandB) / 100
			hundred := decimal.NewFromInt(100)
			raw := operandA.Mul(*operandB).DivRound(hundred, GuardPrecision)
			if raw.Abs().GreaterThan(e.maxMagnitude) {
				return nil, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
			}
			result = raw.Round(MaxPrecision)
			expression = fmt.Sprintf("%s%% of %s = %s", normA, *normB, FormatDecimal(result))
		}
	}

	if result.IsZero() {
		result = decimal.Zero
	}

	return &CalculationResult{
		Operation:  op,
		OperandA:   normA,
		OperandB:   normB,
		Result:     result,
		Formatted:  FormatDecimal(result),
		Expression: expression,
	}, nil
}

// computeSqrt calculates the square root of a non-negative decimal using high precision.
func (e *Engine) computeSqrt(a decimal.Decimal) decimal.Decimal {
	// If within standard float64 range, compute with guard precision for exact IEEE/decimal correspondence
	maxFloatDec := decimal.NewFromFloat(math.MaxFloat64)
	if !a.GreaterThan(maxFloatDec) {
		f, _ := a.Float64()
		sqrtVal := math.Sqrt(f)
		formatted := fmt.Sprintf("%.16f", sqrtVal)
		dec, _ := decimal.NewFromString(formatted)
		return dec.Round(MaxPrecision)
	}

	// For arbitrarily large numbers exceeding MaxFloat64 (e.g. 1e400)
	bf, _, _ := new(big.Float).SetPrec(512).Parse(a.String(), 10)
	sqrtF := new(big.Float).SetPrec(512).Sqrt(bf)
	resStr := sqrtF.Text('f', 16)
	dec, _ := decimal.NewFromString(resStr)
	return dec.Round(MaxPrecision)
}

// computePower calculates operandA raised to operandB adhering to all domain and overflow rules.
func (e *Engine) computePower(a, b decimal.Decimal) (decimal.Decimal, error) {
	// Zero base rules
	if a.IsZero() {
		if b.IsNegative() {
			return decimal.Zero, apperror.NewDivisionByZeroError("zero base raised to a negative exponent")
		}
		if b.IsZero() {
			return decimal.NewFromInt(1), nil
		}
		return decimal.Zero, nil
	}

	// Base = 1
	if a.Equal(decimal.NewFromInt(1)) {
		return decimal.NewFromInt(1), nil
	}

	// Exponent = 0
	if b.IsZero() {
		return decimal.NewFromInt(1), nil
	}

	// Base = -1
	if a.Equal(decimal.NewFromInt(-1)) {
		if !IsInteger(b) {
			return decimal.Zero, apperror.NewComplexResultError("negative base with fractional exponent results in a complex number")
		}
		// Check parity from the last digit of the integer string
		bStr := b.Abs().String()
		lastDigit := bStr[len(bStr)-1]
		if lastDigit == '0' || lastDigit == '2' || lastDigit == '4' || lastDigit == '6' || lastDigit == '8' {
			return decimal.NewFromInt(1), nil
		}
		return decimal.NewFromInt(-1), nil
	}

	// Negative base with non-integer exponent
	if a.IsNegative() && !IsInteger(b) {
		return decimal.Zero, apperror.NewComplexResultError(fmt.Sprintf("negative base (%s) with fractional exponent (%s) results in a complex number", a.String(), b.String()))
	}

	// Exponent magnitude check
	if b.Abs().GreaterThan(e.maxExponentMagnitude) {
		return decimal.Zero, apperror.NewNumericOverflowError(fmt.Sprintf("exponent magnitude %s exceeds 10000", b.String()))
	}

	// Pre-computation overflow estimation: log10(|a|) * b
	if e.estimateLog10Magnitude(a, b) > 1000 {
		return decimal.Zero, apperror.NewNumericOverflowError("estimated power magnitude exceeds 10^1000")
	}

	// Integer exponent handling via fast binary exponentiation
	if IsInteger(b) {
		res, err := e.intPow(a, b.IntPart())
		if err != nil {
			return decimal.Zero, err
		}
		return res.Round(MaxPrecision), nil
	}

	// Special case: exponent is exactly 0.5 (square root equivalent)
	if b.Equal(decimal.New(5, -1)) {
		return e.computeSqrt(a), nil
	}

	// Positive base with fractional exponent within float64 range
	maxFloatDec := decimal.NewFromFloat(math.MaxFloat64)
	if !a.GreaterThan(maxFloatDec) {
		aF, _ := a.Float64()
		bF, _ := b.Float64()
		powVal := math.Pow(aF, bF)
		if math.IsInf(powVal, 0) || math.IsNaN(powVal) {
			return decimal.Zero, apperror.NewNumericOverflowError("power operation overflowed")
		}
		formatted := fmt.Sprintf("%.16f", powVal)
		dec, _ := decimal.NewFromString(formatted)
		return dec.Round(MaxPrecision), nil
	}

	// High precision fallback for fractional exponent
	res, err := a.PowWithPrecision(b, GuardPrecision)
	if err != nil {
		return decimal.Zero, apperror.NewInternalError(fmt.Sprintf("power calculation failed: %v", err))
	}
	if res.Abs().GreaterThan(e.maxMagnitude) {
		return decimal.Zero, apperror.NewNumericOverflowError("result magnitude exceeds 10^1000")
	}
	return res.Round(MaxPrecision), nil
}

// intPow computes base^exp for an integer exponent with intermediate overflow protection.
func (e *Engine) intPow(base decimal.Decimal, exp int64) (decimal.Decimal, error) {
	if exp == 0 {
		return decimal.NewFromInt(1), nil
	}

	isNeg := false
	uExp := uint64(exp)
	if exp < 0 {
		isNeg = true
		uExp = uint64(-exp)
	}

	res := decimal.NewFromInt(1)
	curr := base

	for uExp > 0 {
		if uExp&1 == 1 {
			res = res.Mul(curr)
			if res.Abs().GreaterThan(e.maxMagnitude) {
				return decimal.Zero, apperror.NewNumericOverflowError("power operation overflowed 10^1000")
			}
		}
		uExp >>= 1
		if uExp > 0 {
			curr = curr.Mul(curr)
			if curr.Abs().GreaterThan(e.maxMagnitude) {
				return decimal.Zero, apperror.NewNumericOverflowError("power operation overflowed 10^1000")
			}
		}
	}

	if isNeg {
		res = decimal.NewFromInt(1).DivRound(res, GuardPrecision)
	}

	return res, nil
}

// estimateLog10Magnitude estimates log10(|a|) * b to detect overflow before computing power.
func (e *Engine) estimateLog10Magnitude(a, b decimal.Decimal) float64 {
	absA := a.Abs()
	if absA.IsZero() {
		return 0
	}
	aF, exact := absA.Float64()
	bF, _ := b.Float64()
	if !exact && (aF == 0 || math.IsInf(aF, 0)) {
		s := absA.String()
		if idx := strings.IndexByte(s, '.'); idx != -1 {
			s = s[:idx]
		}
		logA := float64(len(s) - 1)
		return logA * bF
	}
	return math.Log10(aF) * bF
}
