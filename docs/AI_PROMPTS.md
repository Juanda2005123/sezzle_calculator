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
