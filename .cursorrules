# Engineering Guardrails & Architectural Directives

This document sets the mandatory engineering standards, guardrails, and architectural conventions for the Sezzle Calculator application. All contributors and automated agents must adhere strictly to these rules.

---

## 1. Universal English-Only Mandate
- All source code, identifiers, function and variable names, type declarations, comments, docstrings, commit messages, documentation, error codes, error messages, and test descriptions **MUST be exclusively in English**.

---

## 2. Backend Standards (Go 1.22+)

### 2.1 Module & Package Structure
- **Module Path:** `github.com/Juanda2005123/sezzle_calculator/backend`
- Clean layered architecture:
  - `cmd/api/`: Entry point, dependency wiring, configuration loading, graceful shutdown.
  - `internal/calculator/`: Pure domain logic for calculations, precision arithmetic, and domain invariants. Zero HTTP or external framework dependencies.
  - `internal/apperror/`: Standardized error taxonomy, error types, and HTTP mappings.
  - `internal/transport/http/`: HTTP routing, handlers, middleware (rate limiting, payload size limits, CORS, recoverer, request ID), and DTO serialization.

### 2.2 Arithmetic Precision & Domain Rules
- **No Native `float64` for Base-10 Arithmetic:** Never use native `float64` for standard base-10 arithmetic operations (`add`, `subtract`, `multiply`, `divide`, `percent`).
- **Arbitrary Precision:** All base-10 calculations must be executed using `github.com/shopspring/decimal`.
- **Irrational & Transcendental Operations (`sqrt`, fractional `power`):**
  - Validate mathematical domain constraints prior to calculation (e.g., non-negative radicand for square roots).
  - Compute results with guard precision (extra decimal places to prevent intermediate rounding truncation).
  - Round deterministically to 16 decimal places (`MaxPrecision = 16`).
  - Strip trailing zeros on formatted string outputs (e.g., `0.3000` -> `0.3`).

### 2.3 Error Taxonomy & HTTP Status Codes
- **No Leaked Internal Server Errors (500):** User-facing validation errors and domain computation failures must never return generic `500 Internal Server Error`.
- **Standardized JSON Error Envelope:**
  ```json
  {
    "error": {
      "code": "ERR_CODE",
      "message": "Human readable message",
      "details": "Contextual debugging details or field path"
    }
  }
  ```
- **Taxonomy Mapping:**
  - `400 Bad Request`:
    - `ERR_MALFORMED_JSON`: Unparseable request body.
    - `ERR_INVALID_OPERAND`: Non-numeric or improperly formatted operand.
    - `ERR_UNSUPPORTED_OPERATION`: Unrecognized operation operator.
    - `ERR_INVALID_ARITY`: Missing required operands for binary or unary operations.
  - `422 Unprocessable Entity`:
    - `ERR_DIVISION_BY_ZERO`: Division or modulo by zero.
    - `ERR_NEGATIVE_RADICAND`: Square root or even root of a negative number.
    - `ERR_COMPLEX_RESULT`: Exponentiation resulting in a complex number.
    - `ERR_NUMERIC_OVERFLOW`: Exceeding domain scale or memory limits.
  - `405 Method Not Allowed`: `ERR_METHOD_NOT_ALLOWED`.
  - `413 Content Too Large`: `ERR_PAYLOAD_TOO_LARGE` enforced via 4KB `http.MaxBytesReader`.

---

## 3. Frontend Standards (React + TypeScript + Vite + Tailwind CSS)

### 3.1 Type Safety & Architecture
- **Strict TypeScript:** Enforce `strict: true` with zero `any` types. Avoid type assertions (`as Type`) unless safely guarded.
- **Architectural Separation:**
  - `src/api/`: Typed HTTP client functions, network error normalization, and DTO types.
  - `src/hooks/`: Business logic, reducer state machine (calculator state: current operand, previous operand, operation, error, history), and keyboard event listeners.
  - `src/components/`: Presentational, accessible UI components receiving props and callbacks.
  - `src/types/`: Shared TypeScript interfaces, union types, and error contracts.

### 3.2 Accessibility (a11y)
- **Display Announcer:** Calculator display and readout must include `role="status"` and `aria-live="polite"` for screen readers.
- **Error Feedback:** Error banners and toast messages must include `role="alert"`.
- **Accessible Controls:** All keypad buttons must have explicit, descriptive `aria-label` attributes (e.g., `aria-label="Add"`, `aria-label="Equals"`).
- **Physical Keyboard Navigation:** Full keyboard support matching standard numpad and desktop calculator keys (`0-9`, `.`, `+`, `-`, `*`, `/`, `Enter` / `=`, `Backspace`, `Escape` / `C`).

---

## 4. Testing Standards

### 4.1 Backend (Go)
- Table-driven unit tests for all domain calculation functions and edge cases.
- Integration tests using `net/http/httptest` covering all error codes and routes.
- Execute all test suites with race detection: `go test -v -race ./...`.
- Minimum code coverage target: **> 90%**.

### 4.2 Frontend (React + Vitest)
- Unit and integration tests using Vitest and `@testing-library/react`.
- Verify user interactions using `@testing-library/user-event`.
- Test calculator reducer edge cases, keyboard navigation, and display accessibility.
- Single-run execution: `npm run test -- --run`.
- Minimum code coverage target: **> 85%**.

---

## 5. Non-Interactive CLI & Execution Rule
- All scripts, commands, and installation steps must execute with non-interactive flags (`-y`, `--yes`, `--silent`) to avoid terminal blocking.
