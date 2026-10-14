package calculator

import (
	"errors"
	"net/http"
	"testing"

	"github.com/Juanda2005123/sezzle_calculator/backend/internal/apperror"
	"github.com/shopspring/decimal"
)

func ptrDec(s string) *decimal.Decimal {
	d := decimal.RequireFromString(s)
	return &d
}

func dec(s string) decimal.Decimal {
	return decimal.RequireFromString(s)
}

func TestCalculator_StandardArithmetic(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name       string
		op         Operation
		a          decimal.Decimal
		b          *decimal.Decimal
		expectedF  string
		expectedEx string
	}{
		// Addition
		{"positive add", OpAdd, dec("15"), ptrDec("27"), "42", "15 + 27 = 42"},
		{"negative add", OpAdd, dec("-10"), ptrDec("-25"), "-35", "-10 + -25 = -35"},
		{"add with zero", OpAdd, dec("0"), ptrDec("5"), "5", "0 + 5 = 5"},

		// Subtraction
		{"positive subtract", OpSubtract, dec("100"), ptrDec("45"), "55", "100 - 45 = 55"},
		{"negative subtract", OpSubtract, dec("-20"), ptrDec("30"), "-50", "-20 - 30 = -50"},
		{"subtract to zero", OpSubtract, dec("42"), ptrDec("42"), "0", "42 - 42 = 0"},

		// Multiplication
		{"positive multiply", OpMultiply, dec("6"), ptrDec("7"), "42", "6 * 7 = 42"},
		{"negative multiply", OpMultiply, dec("-4"), ptrDec("5"), "-20", "-4 * 5 = -20"},
		{"multiply by zero", OpMultiply, dec("123"), ptrDec("0"), "0", "123 * 0 = 0"},

		// Division
		{"exact division", OpDivide, dec("100"), ptrDec("4"), "25", "100 / 4 = 25"},
		{"negative division", OpDivide, dec("-50"), ptrDec("5"), "-10", "-50 / 5 = -10"},
		{"zero numerator", OpDivide, dec("0"), ptrDec("8"), "0", "0 / 8 = 0"},

		// Power
		{"power integer", OpPower, dec("2"), ptrDec("8"), "256", "2 ^ 8 = 256"},

		// Sqrt
		{"sqrt zero", OpSqrt, dec("0"), nil, "0", "sqrt(0) = 0"},
		{"sqrt exact", OpSqrt, dec("144"), nil, "12", "sqrt(144) = 12"},

		// Percent
		{"unary percent", OpPercent, dec("50"), nil, "0.5", "50% = 0.5"},
		{"binary percent", OpPercent, dec("20"), ptrDec("150"), "30", "20% of 150 = 30"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := engine.Calculate(tc.op, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, res.Formatted)
			}
			if res.Expression != tc.expectedEx {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedEx, res.Expression)
			}
		})
	}
}

func TestCalculator_IEEE754PrecisionTraps(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name       string
		op         Operation
		a          decimal.Decimal
		b          *decimal.Decimal
		expectedF  string
		expectedEx string
	}{
		{"0.1 + 0.2 = 0.3", OpAdd, dec("0.1"), ptrDec("0.2"), "0.3", "0.1 + 0.2 = 0.3"},
		{"0.3 - 0.1 = 0.2", OpSubtract, dec("0.3"), ptrDec("0.1"), "0.2", "0.3 - 0.1 = 0.2"},
		{"0.1 * 0.2 = 0.02", OpMultiply, dec("0.1"), ptrDec("0.2"), "0.02", "0.1 * 0.2 = 0.02"},
		{"1.005 * 100 = 100.5", OpMultiply, dec("1.005"), ptrDec("100"), "100.5", "1.005 * 100 = 100.5"},
		{"0.1 + 0.7 = 0.8", OpAdd, dec("0.1"), ptrDec("0.7"), "0.8", "0.1 + 0.7 = 0.8"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := engine.Calculate(tc.op, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, res.Formatted)
			}
			if res.Expression != tc.expectedEx {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedEx, res.Expression)
			}
		})
	}
}

func TestCalculator_RepeatingAndIrrationalDecimals(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name       string
		op         Operation
		a          decimal.Decimal
		b          *decimal.Decimal
		expectedF  string
		expectedEx string
	}{
		{"1 / 3", OpDivide, dec("1"), ptrDec("3"), "0.3333333333333333", "1 / 3 = 0.3333333333333333"},
		{"2 / 3", OpDivide, dec("2"), ptrDec("3"), "0.6666666666666667", "2 / 3 = 0.6666666666666667"},
		{"sqrt(2)", OpSqrt, dec("2"), nil, "1.4142135623730951", "sqrt(2) = 1.4142135623730951"},
		{"sqrt(0.04)", OpSqrt, dec("0.04"), nil, "0.2", "sqrt(0.04) = 0.2"},
		{"2 ^ 0.5", OpPower, dec("2"), ptrDec("0.5"), "1.4142135623730951", "2 ^ 0.5 = 1.4142135623730951"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := engine.Calculate(tc.op, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, res.Formatted)
			}
			if res.Expression != tc.expectedEx {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedEx, res.Expression)
			}
		})
	}
}

func TestCalculator_HighMagnitudeSquareRoot(t *testing.T) {
	engine := NewEngine()

	// sqrt(1e400) = 1e200
	opA := decimal.New(1, 400)
	expectedResult := decimal.New(1, 200)

	res, err := engine.Calculate(OpSqrt, opA, nil)
	if err != nil {
		t.Fatalf("unexpected error evaluating sqrt(1e400): %v", err)
	}

	if !res.Result.Equal(expectedResult) {
		t.Errorf("expected sqrt(1e400) to equal 1e200, got %s", res.Formatted)
	}
}

func TestCalculator_ExponentiationEdgeCases(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name       string
		a          decimal.Decimal
		b          *decimal.Decimal
		expectedF  string
		expectedEx string
	}{
		{"0 ^ 0 = 1", dec("0"), ptrDec("0"), "1", "0 ^ 0 = 1"},
		{"0 ^ 5 = 0", dec("0"), ptrDec("5"), "0", "0 ^ 5 = 0"},
		{"5 ^ 0 = 1", dec("5"), ptrDec("0"), "1", "5 ^ 0 = 1"},
		{"2 ^ -3 = 0.125", dec("2"), ptrDec("-3"), "0.125", "2 ^ -3 = 0.125"},
		{"(-2) ^ 3 = -8", dec("-2"), ptrDec("3"), "-8", "-2 ^ 3 = -8"},
		{"(-2) ^ 4 = 16", dec("-2"), ptrDec("4"), "16", "-2 ^ 4 = 16"},
		{"(-1) ^ 99999 = -1", dec("-1"), ptrDec("99999"), "-1", "-1 ^ 99999 = -1"},
		{"(-1) ^ 1000 = 1", dec("-1"), ptrDec("1000"), "1", "-1 ^ 1000 = 1"},
		{"1 ^ 500 = 1", dec("1"), ptrDec("500"), "1", "1 ^ 500 = 1"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := engine.Calculate(OpPower, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, res.Formatted)
			}
			if res.Expression != tc.expectedEx {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedEx, res.Expression)
			}
		})
	}
}

func TestCalculator_PercentageModes(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name       string
		a          decimal.Decimal
		b          *decimal.Decimal
		expectedF  string
		expectedEx string
	}{
		{"unary 50%", dec("50"), nil, "0.5", "50% = 0.5"},
		{"unary 12.5%", dec("12.5"), nil, "0.125", "12.5% = 0.125"},
		{"binary 20% of 150", dec("20"), ptrDec("150"), "30", "20% of 150 = 30"},
		{"binary 0% of 500", dec("0"), ptrDec("500"), "0", "0% of 500 = 0"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := engine.Calculate(OpPercent, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, res.Formatted)
			}
			if res.Expression != tc.expectedEx {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedEx, res.Expression)
			}
		})
	}
}

func TestCalculator_NegativeZeroNormalization(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name       string
		op         Operation
		a          decimal.Decimal
		b          *decimal.Decimal
		expectedF  string
		expectedEx string
	}{
		{"-0 * 5", OpMultiply, dec("-0"), ptrDec("5"), "0", "0 * 5 = 0"},
		{"0 * -3", OpMultiply, dec("0"), ptrDec("-3"), "0", "0 * -3 = 0"},
		{"-0 + 0", OpAdd, dec("-0"), ptrDec("0"), "0", "0 + 0 = 0"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := engine.Calculate(tc.op, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res.Formatted != tc.expectedF {
				t.Errorf("expected formatted '%s', got '%s'", tc.expectedF, res.Formatted)
			}
			if res.Expression != tc.expectedEx {
				t.Errorf("expected expression '%s', got '%s'", tc.expectedEx, res.Expression)
			}
		})
	}
}

func TestCalculator_DomainAndArityErrors(t *testing.T) {
	engine := NewEngine()

	tests := []struct {
		name         string
		op           Operation
		a            decimal.Decimal
		b            *decimal.Decimal
		expectedCode string
		status       int
	}{
		// 422 Division By Zero
		{"10 / 0", OpDivide, dec("10"), ptrDec("0"), apperror.CodeDivisionByZero, http.StatusUnprocessableEntity},
		{"0 ^ -1", OpPower, dec("0"), ptrDec("-1"), apperror.CodeDivisionByZero, http.StatusUnprocessableEntity},

		// 422 Negative Radicand
		{"sqrt(-4)", OpSqrt, dec("-4"), nil, apperror.CodeNegativeRadicand, http.StatusUnprocessableEntity},

		// 422 Complex Result
		{"(-4) ^ 0.5", OpPower, dec("-4"), ptrDec("0.5"), apperror.CodeComplexResult, http.StatusUnprocessableEntity},
		{"(-1) ^ 0.33", OpPower, dec("-1"), ptrDec("0.33"), apperror.CodeComplexResult, http.StatusUnprocessableEntity},

		// 422 Numeric Overflow
		{"10 ^ 10001", OpPower, dec("10"), ptrDec("10001"), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"power estimated overflow", OpPower, dec("10"), ptrDec("1001"), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"1e600 * 1e600", OpMultiply, decimal.New(1, 600), ptrDec(decimal.New(1, 600).String()), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"1e1000 + 1e1000", OpAdd, decimal.New(1, 1000), ptrDec(decimal.New(1, 1000).String()), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"-1e1000 - 1e1000", OpSubtract, decimal.New(-1, 1000), ptrDec(decimal.New(1, 1000).String()), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"1e600 / 1e-500", OpDivide, decimal.New(1, 600), ptrDec(decimal.New(1, -500).String()), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"1e1001 operand a", OpAdd, decimal.New(1, 1001), ptrDec("1"), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"1e1001 operand b", OpAdd, dec("1"), ptrDec(decimal.New(1, 1001).String()), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"unary percent overflow", OpPercent, decimal.New(1, 1002), nil, apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},
		{"binary percent overflow", OpPercent, decimal.New(1, 600), ptrDec(decimal.New(1, 600).String()), apperror.CodeNumericOverflow, http.StatusUnprocessableEntity},

		// 400 Invalid Arity
		{"missing b on add", OpAdd, dec("1"), nil, apperror.CodeInvalidArity, http.StatusBadRequest},
		{"missing b on subtract", OpSubtract, dec("1"), nil, apperror.CodeInvalidArity, http.StatusBadRequest},
		{"missing b on multiply", OpMultiply, dec("1"), nil, apperror.CodeInvalidArity, http.StatusBadRequest},
		{"missing b on divide", OpDivide, dec("1"), nil, apperror.CodeInvalidArity, http.StatusBadRequest},
		{"missing b on power", OpPower, dec("1"), nil, apperror.CodeInvalidArity, http.StatusBadRequest},
		{"non-nil b on sqrt", OpSqrt, dec("4"), ptrDec("2"), apperror.CodeInvalidArity, http.StatusBadRequest},

		// 400 Unsupported Operation
		{"unsupported modulo", Operation("modulo"), dec("10"), ptrDec("3"), apperror.CodeUnsupportedOperation, http.StatusBadRequest},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := engine.Calculate(tc.op, tc.a, tc.b)
			if err == nil {
				t.Fatalf("expected error for case '%s', got nil", tc.name)
			}

			var appErr *apperror.AppError
			if !errors.As(err, &appErr) {
				t.Fatalf("expected error to be *apperror.AppError, got %T (%v)", err, err)
			}

			if appErr.Code != tc.expectedCode {
				t.Errorf("expected error code '%s', got '%s'", tc.expectedCode, appErr.Code)
			}
			if appErr.HTTPStatus != tc.status {
				t.Errorf("expected HTTP status %d, got %d", tc.status, appErr.HTTPStatus)
			}
		})
	}
}

func TestCalculator_HelpersAndEdgeCases(t *testing.T) {
	engine := NewEngine()

	// 1. IsInteger
	if !IsInteger(dec("10")) {
		t.Errorf("expected 10 to be integer")
	}
	if !IsInteger(dec("10.000")) {
		t.Errorf("expected 10.000 to be integer")
	}
	if IsInteger(dec("10.5")) {
		t.Errorf("expected 10.5 not to be integer")
	}

	// 2. FormatDecimal
	if FormatDecimal(dec("0")) != "0" {
		t.Errorf("expected 0 to format as '0'")
	}
	if FormatDecimal(dec("-0")) != "0" {
		t.Errorf("expected -0 to format as '0'")
	}
	if FormatDecimal(dec("12.3400")) != "12.34" {
		t.Errorf("expected 12.3400 to format as '12.34'")
	}
	if FormatDecimal(dec("12.000")) != "12" {
		t.Errorf("expected 12.000 to format as '12'")
	}
	if FormatDecimal(dec("100")) != "100" {
		t.Errorf("expected 100 to format as '100'")
	}

	// 3. intPow edge cases
	res0, err := engine.intPow(dec("5"), 0)
	if err != nil || !res0.Equal(dec("1")) {
		t.Errorf("expected 5^0 = 1, got %v, err: %v", res0, err)
	}

	// Overflow on curr.Mul(curr) in intPow
	_, err = engine.intPow(decimal.New(1, 501), 4)
	if err == nil {
		t.Errorf("expected overflow error on intPow squaring")
	}

	// Overflow on res.Mul(curr) in intPow
	_, err = engine.intPow(decimal.New(1, 600), 3)
	if err == nil {
		t.Errorf("expected overflow error on intPow multiplication")
	}

	// 4. estimateLog10Magnitude
	if est := engine.estimateLog10Magnitude(decimal.Zero, dec("10")); est != 0 {
		t.Errorf("expected 0 for zero base, got %f", est)
	}
	if est := engine.estimateLog10Magnitude(decimal.New(1, 400), dec("2")); est <= 0 {
		t.Errorf("expected positive estimate for 1e400, got %f", est)
	}
	hugeWithDot := decimal.RequireFromString(decimal.New(1, 400).String() + ".5")
	if est := engine.estimateLog10Magnitude(hugeWithDot, dec("2")); est <= 0 {
		t.Errorf("expected positive estimate for huge with dot, got %f", est)
	}

	// 5. Fractional power with float overflow (math.IsInf)
	_, err = engine.Calculate(OpPower, decimal.RequireFromString("1e200"), ptrDec("2.5"))
	if err == nil {
		t.Errorf("expected power overflow on 1e200 ^ 2.5")
	}

	// 6. Fractional power beyond MaxFloat64 (high-precision fallback)
	resHigh, err := engine.Calculate(OpPower, decimal.New(1, 350), ptrDec("0.25"))
	if err != nil {
		t.Errorf("unexpected error on high-precision fractional power: %v", err)
	} else if resHigh.Formatted == "" {
		t.Errorf("expected non-empty formatted result for 1e350 ^ 0.25")
	}

	// 7. Fractional power beyond MaxFloat64 that overflows 10^1000
	_, err = engine.Calculate(OpPower, decimal.New(1, 600), ptrDec("2.5"))
	if err == nil {
		t.Errorf("expected overflow on 1e600 ^ 2.5")
	}
}
