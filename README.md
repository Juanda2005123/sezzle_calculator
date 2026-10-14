# Sezzle Precision Calculator

[![CI Pipeline](https://github.com/Juanda2005123/sezzle_calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/Juanda2005123/sezzle_calculator/actions/workflows/ci.yml)
[![Go Version](https://img.shields.io/badge/Go-1.22%2B-00ADD8?logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)
[![Coverage](https://img.shields.io/badge/Frontend_Coverage-98.4%25-brightgreen)](https://github.com/Juanda2005123/sezzle_calculator)
[![Coverage](https://img.shields.io/badge/Backend_Coverage-90.4%25-brightgreen)](https://github.com/Juanda2005123/sezzle_calculator)

A production-grade, full-stack calculator application purpose-built for financial and mathematical accuracy. It eliminates IEEE 754 binary floating-point representation drift (guaranteeing exact computations such as `0.1 + 0.2 = 0.3`), enforces deterministic domain invariants, features an accessible WAI-ARIA UI with physical keyboard navigation, and runs seamlessly in containerized environments.

---

## Table of Contents
1. [Architecture Overview & Tech Stack](#architecture-overview--tech-stack)
2. [Quick Start (Zero-Config Docker Compose)](#quick-start-zero-config-docker-compose)
3. [Automated Smoke Testing](#automated-smoke-testing)
4. [Local Standalone Development](#local-standalone-development)
5. [Architectural Decisions & Trade-Offs](#architectural-decisions--trade-offs)
6. [API Specification & cURL Catalog](#api-specification--curl-catalog)
7. [Test Coverage Summary](#test-coverage-summary)
8. [AI Prompt Engineering Audit Trail](#ai-prompt-engineering-audit-trail)

---

## Architecture Overview & Tech Stack

```
                          ┌──────────────────────────────────────┐
                          │     User Browser / Client HTTP       │
                          └──────────────────┬───────────────────┘
                                             │
                                             ▼
                          ┌──────────────────────────────────────┐
                          │   Frontend Container (Nginx:80)      │
                          │   Host Port: 3000                    │
                          ├──────────────────────────────────────┤
                          │ • Static React 19 SPA (Tailwind v4)  │
                          │ • Reverse Proxy: /api/ -> backend    │
                          └──────────────────┬───────────────────┘
                                             │ proxy_pass http://backend:8080/api/
                                             ▼
                          ┌──────────────────────────────────────┐
                          │   Backend Container (Distroless:8080)│
                          │   Host Port: 8080                    │
                          ├──────────────────────────────────────┤
                          │ • Go Standard Library net/http       │
                          │ • CORS & Panic Recovery Middlewares  │
                          │ • MaxBytesReader (4KB Payload Limit) │
                          │ • Arbitrary Precision (Decimal Engine│
                          │ • Healthcheck Binary (/bin/health)   │
                          └──────────────────────────────────────┘
```

- **Backend:** Go 1.22+, `net/http` standard library router, [`github.com/shopspring/decimal`](https://github.com/shopspring/decimal) arbitrary-precision base-10 arithmetic, multi-stage Distroless Debian 12 minimal static container runtime.
- **Frontend:** React 19, TypeScript (strict mode, zero `any`), Tailwind CSS v4, Vite, Vitest, React Testing Library, Nginx 1.27 Alpine runtime with reverse proxy.
- **Orchestration:** Multi-container `docker-compose.yml` with health-driven startup synchronization (`service_healthy`).

---

## Quick Start (Zero-Config Docker Compose)

Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with Docker Compose v2+.

```bash
# 1. Clone the repository
git clone https://github.com/Juanda2005123/sezzle_calculator.git
cd sezzle_calculator

# 2. Build and start the services in detached mode
docker compose up --build -d
```

### Service Access Endpoints:
- **Web User Interface:** [http://localhost:3000](http://localhost:3000)
- **Backend API Direct:** [http://localhost:8080](http://localhost:8080)
- **Backend Health Check:** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
- **Frontend Proxied API:** [http://localhost:3000/api/v1/calculate](http://localhost:3000/api/v1/calculate)

To stop the containers:
```bash
docker compose down
```

---

## Automated Smoke Testing

A standalone, automated smoke test script validates health, frontend availability, proxy routing, precision arithmetic, and 422 error handling against a live stack:

```bash
# Make script executable (Linux/macOS/Git Bash)
chmod +x ./scripts/smoke-test.sh

# Run smoke test suite
./scripts/smoke-test.sh
```

Or via Makefile:
```bash
make smoke-test
```

---

## Local Standalone Development

### Makefile Lifecycle Commands
The root `Makefile` standardizes all common development workflows:

| Target | Description |
| :--- | :--- |
| `make dev-backend` | Starts Go backend on `http://localhost:8080` |
| `make dev-frontend` | Starts Vite frontend dev server on `http://localhost:5173` |
| `make test-backend` | Executes all Go unit & HTTP tests with `-race` |
| `make coverage-backend` | Executes Go test suite and prints statement coverage |
| `make test-frontend` | Executes all Vitest unit and integration suites |
| `make coverage-frontend` | Executes Vitest with v8 coverage report |
| `make build` | Compiles backend binary (`bin/calculator-api`) and builds Vite SPA bundle |
| `make docker-up` | Launches containerized stack in detached mode (`docker compose up --build -d`) |
| `make docker-down` | Shuts down containerized stack (`docker compose down`) |
| `make smoke-test` | Runs the automated smoke test script against running containers |

### Manual Standalone Execution

#### Backend (Go)
```powershell
cd backend
go run ./cmd/api
# Server listens on http://localhost:8080
```

Run backend test suite with coverage:
```powershell
cd backend
go test -v "-coverprofile=coverage.out" ./...
go tool cover "-func=coverage.out"
```

#### Frontend (Node / React)
```powershell
cd frontend
npm ci
npm run dev
# Vite server listens on http://localhost:5173 with proxy to :8080
```

Run frontend tests and coverage:
```powershell
cd frontend
npm run test:coverage
npm run build
```

---

## Architectural Decisions & Trade-Offs

### 1. Arbitrary-Precision Base-10 Arithmetic vs. Native Floats
- **The Problem:** Standard IEEE 754 binary floating-point representations cannot accurately express powers of 10 fractions (e.g. `0.1 + 0.2 = 0.30000000000000004`). In financial workflows, penny fractional drifts accumulate compounding errors.
- **The Solution:** The backend engine strictly computes all arithmetic via `github.com/shopspring/decimal`. Irrational and fractional operations (`sqrt`, non-integer `power`) are bounded with guard precision (`32` decimal digits) and deterministically rounded to 16 decimal places (`MaxPrecision = 16`), with trailing zeros normalized on formatted output.
- **High-Magnitude Square Roots:** For radicands exceeding native float ranges ($> 10^{308}$ up to $10^{1000}$), the engine switches to a `math/big.Float` arbitrary-precision square root algorithm, accurately calculating inputs like $\sqrt{10^{400}} = 10^{200}$.

### 2. Unified Endpoint (`POST /api/v1/calculate`) vs. Dispersed Routes
- **Rationale:** A unified polymorphic endpoint (`operation`, `operand_a`, `operand_b`) provides a single, strictly controlled choke point for:
  - Payload size limiting (4096-byte `http.MaxBytesReader` defending against memory exhaustion / Slowloris payloads).
  - Centralized unknown field rejection (`DisallowUnknownFields()`).
  - Uniform JSON error envelopes preventing leaked 500 stack traces.
  - Effortless extensibility without route clutter.

### 3. Strict HTTP Status & Error Taxonomy
| Status Code | Error Code | Trigger Condition |
| :--- | :--- | :--- |
| **400 Bad Request** | `ERR_MALFORMED_JSON` | Invalid JSON syntax, unclosed braces, trailing tokens, unknown fields. |
| **400 Bad Request** | `ERR_INVALID_OPERAND` | Missing operand, boolean, array, object, NaN, Infinity, empty string. |
| **400 Bad Request** | `ERR_UNSUPPORTED_OPERATION` | Operation is not one of the 7 supported tokens. |
| **400 Bad Request** | `ERR_INVALID_ARITY` | Missing `operand_b` for binary ops, or non-null `operand_b` for `sqrt`. |
| **405 Method Not Allowed**| `ERR_METHOD_NOT_ALLOWED` | GET, PUT, DELETE, PATCH sent to `/api/v1/calculate`. |
| **413 Payload Too Large** | `ERR_PAYLOAD_TOO_LARGE` | Request payload body exceeds 4096 bytes. |
| **422 Unprocessable** | `ERR_DIVISION_BY_ZERO` | Division by zero (`a / 0`) or zero raised to negative exponent (`0 ^ -b`). |
| **422 Unprocessable** | `ERR_NEGATIVE_RADICAND` | Square root of negative number (`sqrt(a)` where $a < 0$). |
| **422 Unprocessable** | `ERR_COMPLEX_RESULT` | Negative base with fractional exponent ($a < 0$ and $b \notin \mathbb{Z}$). |
| **422 Unprocessable** | `ERR_NUMERIC_OVERFLOW` | Input/output magnitude $> 10^{1000}$ or exponent $|b| > 10000$. |
| **500 Internal Error** | `ERR_INTERNAL` | Panic recovered by middleware, returning standard envelope. |

### 4. Accessibility & Responsive UX
- **Display Readout:** Screen-reader accessible with `role="status"` and `aria-live="polite"`. Font scales dynamically (`text-5xl` to `text-xl`) to prevent layout breaking on 16-decimal results.
- **Error Presentation:** Dedicated banner with `role="alert"` and `aria-live="assertive"` providing immediate notification and dismiss controls.
- **Physical Keyboard Support:** Global keyboard event listener maps all numpad/digit keys, operators (`+`, `-`, `*`, `/`, `^`, `%`, `R`), `Enter`/`=` (with `preventDefault()` stopping double-submits on focused buttons), `Backspace`, and `Escape`.
- **Keyboard Traps:** Keyboard modifiers (`Ctrl`, `Alt`, `Meta`) are safely ignored to avoid intercepting OS commands while preserving `Shift` for symbol inputs (`%`, `^`, `*`, `+`).

---

## API Specification & cURL Catalog

The complete OpenAPI 3.1 specification is located at [`docs/openapi.yaml`](docs/openapi.yaml).

### 1. Addition (IEEE 754 Precision Verification)
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "add", "operand_a": "0.1", "operand_b": "0.2"}'
```
**Response (200 OK):**
```json
{
  "data": {
    "operation": "add",
    "operand_a": "0.1",
    "operand_b": "0.2",
    "result": 0.3,
    "formatted": "0.3",
    "expression": "0.1 + 0.2 = 0.3"
  }
}
```

### 2. Square Root (Unary Operation)
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "sqrt", "operand_a": 144}'
```
**Response (200 OK):**
```json
{
  "data": {
    "operation": "sqrt",
    "operand_a": "144",
    "result": 12,
    "formatted": "12",
    "expression": "sqrt(144) = 12"
  }
}
```

### 3. Exponentiation
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "power", "operand_a": 2, "operand_b": 8}'
```
**Response (200 OK):**
```json
{
  "data": {
    "operation": "power",
    "operand_a": "2",
    "operand_b": "8",
    "result": 256,
    "formatted": "256",
    "expression": "2 ^ 8 = 256"
  }
}
```

### 4. Percentage Modes
**Unary Mode (50% = 0.5):**
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "percent", "operand_a": 50}'
```

**Binary Mode (20% of 150 = 30):**
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "percent", "operand_a": 20, "operand_b": 150}'
```

### 5. Division by Zero (Domain Error)
```bash
curl -X POST http://localhost:8080/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "divide", "operand_a": 42, "operand_b": 0}'
```
**Response (422 Unprocessable Entity):**
```json
{
  "error": {
    "code": "ERR_DIVISION_BY_ZERO",
    "message": "Division by zero (a / 0) or zero raised to a negative exponent (0 ^ -b).",
    "details": "division by zero"
  }
}
```

### 6. Health Check
```bash
curl -X GET http://localhost:8080/api/v1/health
```
**Response (200 OK):**
```json
{
  "status": "healthy"
}
```

---

## Test Coverage Summary

### Backend Statement Coverage (Go 1.22+)
| Package | Statements | Status |
| :--- | :--- | :--- |
| `internal/apperror` | **100.0%** | Exceeds Target |
| `internal/calculator` | **95.5%** | Exceeds Target |
| `internal/transport/http` | **97.2%** | Exceeds Target |
| **Total Backend Project** | **90.4%** | **PASSED (Threshold $\ge 90\%$)** |

### Frontend Statement Coverage (React 19 + Vitest V8)
| Module / Directory | Statements | Branch | Functions | Lines |
| :--- | :--- | :--- | :--- | :--- |
| `src/App.tsx` | 100.0% | 100.0% | 100.0% | 100.0% |
| `src/api` (`calculatorApi.ts`) | 93.3% | 93.3% | 100.0% | 93.3% |
| `src/components` (`Display`, `Keypad`, `ErrorBanner`, `HistoryPanel`, `KeyboardReference`) | 100.0% | 100.0% | 96.2% | 100.0% |
| `src/hooks` (`useCalculator`, `useKeyboardShortcuts`) | 97.8% | 94.8% | 100.0% | 97.8% |
| `src/types` (`calculator.ts`) | 100.0% | 100.0% | 100.0% | 100.0% |
| **Total Frontend Project** | **98.39%** | **95.85%** | **97.43%** | **98.39%** |

*(Threshold $\ge 85\%$ achieved across all metrics; 62/62 frontend tests passing cleanly)*

---

## AI Prompt Engineering Audit Trail

In strict adherence to the assessment's governance requirements, every phase, prompt specification, architectural decision, and verification gate is recorded in [`docs/AI_PROMPTS.md`](docs/AI_PROMPTS.md):
- **Phase 1:** Scaffolding, Tooling & Guardrails (Git, Makefile, Agent Rules, Skeletons).
- **Phase 2:** Backend Domain Engine & Unit Tests (Decimal arithmetic, 16-decimal rounding, edge powers, 95.5% coverage).
- **Phase 3:** Backend Transport & Middlewares (`net/http`, custom operand parsing, CORS, panic recovery, 90.4% total backend coverage).
- **Phase 4:** Frontend API Client, State Machine & Accessible UI (`useCalculator`, keyboard navigation, ARIA live regions).
- **Phase 5:** Exhaustive Vitest RTL Suite (98.4% coverage) & Live Chromium E2E verification via CDP.
- **Phase 6:** Containerization (Docker Compose), Smoke Testing, GitHub Actions CI, OpenAPI 3.1, and Documentation.
