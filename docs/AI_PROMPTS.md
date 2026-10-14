# AI Prompt Audit & Engineering Log

## Overview & Governance
This document maintains an immutable audit trail of the engineering instructions, architectural decisions, and verification gates throughout the lifecycle of the **Sezzle Precision Calculator** project.

The system is governed by the architectural guardrails codified in `AGENT_RULES.md` and `.cursorrules`:
- **100% English Language Policy** across code, comments, error codes, commit messages, and docs.
- **Arbitrary Precision Arithmetic** using `github.com/shopspring/decimal` for base-10 operations to avoid binary floating-point representation anomalies (`0.1 + 0.2 != 0.3`).
- **Deterministic Domain Invariants** with guard precision and 16-decimal-place rounding (`MaxPrecision = 16`) for irrational/transcendental functions.
- **Strict Error Envelope & HTTP Taxonomy** (400, 422, 405, 413) preventing unhandled 500 errors.
- **Accessible & Strict Frontend Architecture** (React 19 + TypeScript + Vite + Tailwind CSS v4, WAI-ARIA `aria-live` status regions, keyboard navigation).
- **Comprehensive Verification Gates** with table-driven Go tests (>90% coverage) and Vitest RTL suites (>85% coverage).

---

## Phase 1: Repository Scaffolding, Tooling & Guardrails

### 1. Objective
Establish a rock-solid, production-grade monorepo foundation with Git configuration, directory hierarchy, engineering guardrails, root `Makefile`, and compilable backend/frontend skeletons verifying decimal precision and UI test infrastructure.

### 2. Scaffold Specifications
- **Git & Remote:** Branch `main` linked to `https://github.com/Juanda2005123/sezzle_calculator.git`.
- **Directory Hierarchy:**
  - `.github/workflows/`: CI/CD automation pipelines.
  - `backend/cmd/api/`: Go entrypoint and HTTP server.
  - `backend/internal/apperror/`: Application error taxonomy.
  - `backend/internal/calculator/`: Pure domain arithmetic engine.
  - `backend/internal/transport/http/`: HTTP routing and handlers.
  - `frontend/src/{api,components,hooks,types}/`: Layered React application.
  - `docs/`: Architecture and prompt audit logs.
  - `scripts/`: Tooling and smoke testing scripts.
- **Root Tooling:**
  - `AGENT_RULES.md` & `.cursorrules`: Strict project standards.
  - `Makefile`: Standardized lifecycle targets (`dev-*`, `test-*`, `coverage-*`, `build`, `docker-*`, `smoke-test`).
  - `.gitignore`: Ignoring build binaries, Node modules, coverage reports, OS/IDE files.
- **Backend Skeleton:**
  - Go module `github.com/Juanda2005123/sezzle_calculator/backend` with `github.com/shopspring/decimal@v1.4.0`.
  - Precision check (`0.1 + 0.2 = 0.3`) and `SMOKE_CHECK=1` CLI mode.
  - `GET /api/v1/health` endpoint returning `{"status":"healthy"}`.
- **Frontend Skeleton:**
  - Vite + React 19 + TypeScript with Tailwind CSS v4.
  - Vitest + React Testing Library + `@testing-library/jest-dom` test runner.
  - Proxy configuration forwarding `/api` to `http://localhost:8080`.
  - Accessible placeholder component rendering "Sezzle Precision Calculator" and verified by Vitest smoke test.

### 3. Verification Gate Record
- **Go Version:** Go 1.27.0 windows/amd64
- **Node / npm Version:** Node v24.12.0 / npm 11.19.0
- **Git Remote:** `origin https://github.com/Juanda2005123/sezzle_calculator.git`
- **Decimal Smoke Check (`SMOKE_CHECK=1`):** Verified output `0.3`.
- **Backend Binary Compilation:** `backend/bin/calculator-api` built successfully.
- **Frontend Build & Tests:** TypeScript compilation (`tsc -b`) and Vite production build succeeded; Vitest smoke test passed (1/1 passed).

---

## Phase 2: Backend Domain Engine & Unit Test Suite

### 1. Objective
Implement the pure domain arbitrary-precision arithmetic engine (`backend/internal/calculator`) and standardized error package (`backend/internal/apperror`) adhering to strict domain invariants, mathematical constraints, and table-driven unit test coverage exceeding 95%.

### 2. Domain Engine & Error Specifications
- **Domain Errors (`backend/internal/apperror`):**
  - Standardized `AppError` struct implementing `error` with `Code`, `Message`, `Details`, and `HTTPStatus`.
  - HTTP 400 Bad Request: `ERR_MALFORMED_JSON`, `ERR_INVALID_OPERAND`, `ERR_UNSUPPORTED_OPERATION`, `ERR_INVALID_ARITY`.
  - HTTP 422 Unprocessable Entity: `ERR_DIVISION_BY_ZERO`, `ERR_NEGATIVE_RADICAND`, `ERR_COMPLEX_RESULT`, `ERR_NUMERIC_OVERFLOW`.
  - HTTP 405 Method Not Allowed: `ERR_METHOD_NOT_ALLOWED`.
  - HTTP 413 Payload Too Large: `ERR_PAYLOAD_TOO_LARGE`.
  - HTTP 500 Internal Server Error: `ERR_INTERNAL`.
- **Arithmetic Engine (`backend/internal/calculator`):**
  - **Supported Operations:** `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `percent` (unary & binary).
  - **Arbitrary Precision:** All base-10 operations executed via `github.com/shopspring/decimal`.
  - **Precision & Guard Digits:** `MaxPrecision = 16` for output rounding, intermediate division at `GuardPrecision = 32`.
  - **Magnitude Bounds:** Strict overflow enforcement rejecting numbers exceeding $|10^{1000}|$.
  - **Square Root:** Zero and exact integer/decimal evaluation (`sqrt(144) = 12`, `sqrt(0.04) = 0.2`, `sqrt(2) = 1.4142135623730951`), negative radicand rejection (`ERR_NEGATIVE_RADICAND`), and `big.Float` high-precision fallback for huge radicands beyond `math.MaxFloat64` (`sqrt(1e400) = 1e200`).
  - **Power:** Zero base rules, negative base fractional rejection (`ERR_COMPLEX_RESULT`), exponent magnitude check ($|b| \le 10000$), pre-computation $\log_{10}(|a|) \times b$ overflow estimation, binary exponentiation with overflow bounds, parity preservation for large odd/even integer exponents (`(-1)^99999 = -1`).
  - **Percentage Modes:** Unary (`a / 100`) and binary (`(a * b) / 100`).
  - **Canonical Normalization:** `-0` normalized to `"0"`, trailing zeros stripped on `Formatted` and `Expression`.

### 3. Verification Gate Record
- **Unit Test Execution:** 100% passing across `internal/apperror` and `internal/calculator`.
- **Statement Coverage:**
  - `internal/apperror`: **100.0%**
  - `internal/calculator`: **95.5%**
- **Table-Driven Test Suites:**
  - Standard arithmetic (positive, negative, zero across all operations).
  - IEEE 754 precision traps (`0.1 + 0.2 = 0.3`, `0.3 - 0.1 = 0.2`, `0.1 * 0.2 = 0.02`, `1.005 * 100 = 100.5`, `0.1 + 0.7 = 0.8`).
  - Repeating and irrational decimals (`1/3`, `2/3`, `sqrt(2)`, `sqrt(0.04)`, `2^0.5`).
  - High-magnitude square root (`sqrt(1e400) = 1e200`).
  - Exponentiation edge cases (`0^0 = 1`, `0^5 = 0`, `5^0 = 1`, `2^-3 = 0.125`, `(-2)^3 = -8`, `(-2)^4 = 16`, `(-1)^99999 = -1`, `(-1)^1000 = 1`, `1^500 = 1`).
  - Percentage modes (unary `50%`, `12.5%`; binary `20% of 150`, `0% of 500`).
  - Negative zero normalization (`-0 * 5 = 0`, `0 * -3 = 0`, `-0 + 0 = 0`).
  - Complete error taxonomy coverage (400, 422, invalid arity, unknown op, overflow, division by zero, complex result, negative radicand).

---

## Phase 3: Backend HTTP Transport, Middleware & httptest Integration Suite

### 1. Objective
Implement the production-ready HTTP transport layer in `backend/internal/transport/http`, request/response DTOs with custom operand parsing, security and CORS middlewares, panic recovery, and an exhaustive `httptest` integration suite. Refactor `backend/cmd/api/main.go` and `main_test.go` to wire the domain engine and router with production server timeouts.

### 2. Transport & Architectural Specifications
- **Request / Response DTOs (`dto.go`):**
  - Custom `Operand` unmarshaler accepting JSON numbers (`0.1`, `-42`, `1e5`) and strings (`"0.1"`, `" -42.5 "`) directly into `decimal.Decimal` without `float64` conversion.
  - Strict type rejection for booleans (`true`/`false`), arrays, objects, empty strings, `"NaN"`, `"Infinity"`, and `"-Infinity"`.
  - Success envelope (`CalculateResponse`) returning exact JSON contract with `json.Number` for unquoted literal `"result"` and string for `"formatted"`.
  - Error envelope (`ErrorResponse`) returning `code`, `message`, and optional `details`.
- **Handlers (`handler.go`):**
  - `GET /api/v1/health`: Returns `200 OK` with `{"status":"healthy"}` and UTF-8 JSON header.
  - `POST /api/v1/calculate`: Enforces 4096-byte payload limit via `http.MaxBytesReader` returning 413 `ERR_PAYLOAD_TOO_LARGE`. Decodes with `DisallowUnknownFields()` and `UseNumber()`, verifies no trailing body tokens, and delegates to `calculator.Engine`.
  - Non-POST methods to `/api/v1/calculate` return 405 `ERR_METHOD_NOT_ALLOWED` with `Allow: POST, OPTIONS` header.
- **Middleware & Router (`middleware.go`, `router.go`):**
  - `CORSMiddleware`: Sets origin (default `*` or `ALLOWED_ORIGINS` env var), methods `GET, POST, OPTIONS`, headers `Content-Type, Accept, Origin`, and short-circuits `OPTIONS` with `204 No Content`.
  - `RecoveryMiddleware`: Recovers from runtime panics, logs structured error via `log/slog`, and returns 500 `ERR_INTERNAL`.
  - `NewRouter`: Assembles multiplexer and wraps with Recovery and CORS middleware stack.
- **Entrypoint Refactoring (`backend/cmd/api/main.go`, `main_test.go`):**
  - Wires `calculator.NewEngine()` and `httptransport.NewRouter(engine)`.
  - Configures `http.Server` with `ReadHeaderTimeout` (5s), `ReadTimeout` (10s), `WriteTimeout` (10s), and `IdleTimeout` (120s).
  - Preserves `SMOKE_CHECK=1` check verifying domain engine linkage outputting `0.3`.

### 3. Verification Gate Record
- **HTTP Integration Tests:** 100% passing across health check, happy path calculations, client contract errors, mathematical domain errors, and protocol resiliency.
- **Statement Coverage:**
  - `internal/transport/http`: **97.2%** (Threshold: $\ge 90\%$).
  - `internal/calculator`: **95.5%** (Threshold: $\ge 90\%$).
  - `internal/apperror`: **100.0%** (Threshold: $\ge 90\%$).
  - Total Backend: **90.4%** (Threshold: $\ge 90\%$).
- **Clean Compilation:** `backend/bin/calculator-api.exe` compiles cleanly.
