# AI-Assisted Engineering Workflow & Complete Verbatim Prompt Audit Log

## 1. Executive Summary: Two-Tier Staff Architect ↔ Autonomous Agent Methodology

Rather than using ad-hoc "prompt-and-pray" code generation, this project was engineered using a disciplined **Two-Tier AI Architecture**:

1. **Tier 1 — Systems Architecture & Specification (Human Engineer ↔ Staff Architect Model):**
   - Established architectural trade-offs (React 19 + Vite vs. Next.js, unified `POST /api/v1/calculate` vs. split endpoints, `shopspring/decimal` vs. IEEE 754 `float64`, Distroless + Nginx reverse proxy).
   - Conducted a preemptive **Blind Spot & Gap Analysis** covering financial percentage semantics, fractional negative base exponentiation (`ERR_COMPLEX_RESULT`), exponent CPU/memory DoS bounds (`10^1000`), and JSON number deserialization traps.
   - Calibrated prompt abstraction to enforce strict contracts, non-interactive CLI flags, and deterministic verification gates rather than copy-pasting boilerplate.

2. **Tier 2 — Phased Autonomous Execution (Staff Architect Specs → Antigravity Implementation Agent):**
   - Governed by persistent repository guardrails ([`AGENT_RULES.md`](../AGENT_RULES.md) / `.cursorrules`).
   - Executed across **6 isolated phases**, where each phase required passing strict CLI build, test coverage, and E2E verification gates before committing to Git.

---

## 2. Tier 1: Human Engineer → Staff Architect Prompts (Verbatim)

<details>
<summary><strong>Prompt 1.1: Initial Mission Brief, Architectural Trade-offs & Gap Analysis</strong> (Click to expand)</summary>

~~~markdown
# MISSION BRIEF: SENIOR FULL-STACK ARCHITECTURAL DESIGN & SPECIFICATION

## LANGUAGE POLICY & MANDATORY DIRECTIVE
All code, comments, documentation, commit messages, API specifications, prompts, and architectural discussions throughout this entire project MUST be exclusively in English. No exceptions.

---

## 1. CONTEXT & OFFICIAL ASSESSMENT REQUIREMENTS

I have been invited to complete a technical take-home assessment for Sezzle. The recommended time investment is **~2–4 hours**, prioritizing correctness, clarity, maintainability, and robust architecture over excessive feature bloat.

My objective is to produce a production-grade, full-stack calculator application that showcases senior-level engineering discipline, clean code, comprehensive testing, and a transparent, professional AI-assisted workflow.

### Functional Requirements
- **Core Operations (Required):** Addition (+), Subtraction (-), Multiplication (*), Division (/).
- **Advanced Operations (Confirmed Scope):** Exponentiation (^), Square Root (√), and Percentage (%).
- **Frontend (React):**
  - Intuitive, responsive UI for input entry and result display (including basic mobile support).
  - Robust client-side validation and graceful error state presentation.
- **Backend (REST API):**
  - Exposed HTTP endpoints for calculator operations.
  - Strict input validation and edge-case handling (division by zero, malformed payloads, invalid data types, domain errors like negative square roots).
  - Consistent JSON response structures.

### Non-Functional Requirements
- Clean, readable, and idiomatic code across both frontend and backend.
- High test coverage with meaningful test cases across critical paths.
- Comprehensive documentation: setup guides, API consumption examples, and architectural rationale.
- Containerization: Full-stack execution via Docker / Docker Compose.

### Technical Constraints
- **Frontend:** React (TypeScript strongly preferred).
- **Backend:** Go (Golang) is the preferred language.

### Mandatory Deliverables
1. Git repository containing decoupled frontend and backend codebases.
2. Production-grade `README.md` containing:
   - Setup and execution instructions (local standalone and via Docker).
   - Concrete API usage examples (cURL requests and JSON response bodies).
   - Architectural decisions, assumptions, and trade-off rationales.
3. Unit test suites with measurable code coverage reports.
4. Working `Dockerfile` and `docker-compose.yml` for unified full-stack startup.
5. **AI Workflow Transparency:** An audit log of all prompts used throughout the implementation.

---

## 2. ENGINEERING DILEMMAS & ARCHITECTURAL TRADEOFFS TO RESOLVE

Act as a **Staff Software Engineer & Systems Architect**. Analyze and establish a clear, justified stance on each of the following engineering areas:

### A. Frontend: Stack & Architecture
- **Tooling Evaluation:** Evaluate React + Vite + TypeScript vs. Next.js. Compare them in the context of an SPA client consuming a separate microservice, operational overhead, build velocity, and avoidance of unnecessary complexity (overkill).
- **State & UI Separation:** Propose a clean architecture on the client side separating UI presentation, state machines/hooks, and HTTP service communication.
- **Styling Solution:** Recommend an approach (e.g., Tailwind CSS, CSS Modules) that delivers an accessible, responsive, modern interface without boilerplate drag.

### B. Backend: Architecture & REST API Design (Go)
- **API Contract Design:**
  - Evaluate the trade-offs between:
    1. A unified calculation endpoint (e.g., `POST /api/v1/calculate` with `{ operation, a, b }`).
    2. Operation-specific semantic REST endpoints (e.g., `POST /api/v1/calculate/add`, `POST /api/v1/calculate/sqrt`, etc.).
  - Which approach better handles arity variations (binary operations like addition vs. unary operations like square root) while maintaining clean schema validation?
- **OpenAPI / Swagger:**
  - Assess whether embedding an OpenAPI/Swagger UI spec adds tangible reviewer value or constitutes unnecessary overhead for a 2–4 hour assessment versus clear markdown contracts in the README.
- **Backend Layering (Clean/Hexagonal Architecture without Dogma):**
  - Define an idiomatic Go package structure (e.g., `cmd/`, `internal/domain`, `internal/service`, `internal/handler`) that enforces separation of concerns and high testability without over-abstracting through dozens of trivial boilerplate interfaces.
- **Arithmetic Precision & IEEE 754 Pitfalls:**
  - How should floating-point inaccuracies (e.g., `0.1 + 0.2 = 0.30000000000000004`) and large number overflows be addressed in Go and serialized to JSON? Evaluate native `float64` vs. arbitrary-precision packages (e.g., `shopspring/decimal` or `math/big`).

### C. Testing Strategy: Unit, Integration, & End-to-End (E2E)
- **Unit Testing:**
  - Backend: Table-driven tests in Go covering standard operations, precision limits, boundary values, and deliberate error injections.
  - Frontend: Component and hook testing via Vitest and React Testing Library.
- **Integration & End-to-End (E2E) Evaluation:**
  - Given that frontend and backend operate as decoupled services, rigorously evaluate whether implementing End-to-End tests (e.g., Playwright/Cypress) or contract integration tests is justified within the 2–4 hour window.
  - If E2E is considered high-value, how can it be implemented minimally without introducing flaky browser setup dependencies into the reviewer's evaluation pipeline? If skipped or mocked, how do you justify the boundary?

### D. Containerization & Developer Experience (DX)
- Design multi-stage Dockerfiles (optimizing image sizes with Alpine/Distroless for Go and Nginx for React) and a single `docker-compose.yml` ensuring any evaluator can clone the repository and run `docker compose up --build` with zero local configuration.

### E. AI-Assisted Methodology, Skills & Prompt Auditing
- The prompt transparency requirement must demonstrate engineering rigor, not random prompt-and-pray iterations.
- **Skills vs. Modular Prompts:**
  - Evaluate the utility of incorporating predefined coding skills/rules (e.g., patterns inspired by `mattpocock/skills` or specialized system guidelines for Go idiomatic patterns and strict TypeScript) versus maintaining tightly scoped, contextual prompts per feature phase.
  - Where is the line between disciplined AI prompting and excessive process overhead?
- **Prompt Logging Strategy:**
  - Propose an organized structure for the prompt audit log (e.g., `docs/AI_PROMPTS.md`) documenting intent, input context, refinement steps, and quality control reviews.

### F. Comprehensive Gap Analysis & Blind Spot Investigation
- Conduct an exhaustive investigation into potential blind spots, edge cases, and hidden pitfalls that have not been explicitly covered in this prompt.
- Identify critical considerations regarding:
  - CORS configuration and pre-flight handling between frontend and backend.
  - Resiliency and error propagation (ensuring no `500 Internal Server Error` escapes for client-induced arithmetic or validation failures).
  - Input parsing sanitization (handling JSON payloads with string-encoded numbers, null values, trailing decimals, scientific notation, division by zero, negative radicands).
  - Continuous Integration (CI) readiness (e.g., GitHub Actions running linting, tests, and coverage checks on push).
  - Accessibility (ARIA labels, keyboard navigation for the calculator keypad).
~~~

**Architectural Outcome:** Established the complete system blueprint, selected Go 1.22+ (`shopspring/decimal`) + React 19 (Vite + TypeScript + Tailwind v4), defined the unified `POST /api/v1/calculate` schema with dual numeric/formatted string output, and designed the 400 vs. 422 error taxonomy.
</details>

<details>
<summary><strong>Prompt 1.2: Transition to Phased Execution Pipeline & Model Asymmetry Strategy</strong> (Click to expand)</summary>

~~~markdown
I have reviewed and fully approved your architectural blueprint, API specifications, and gap analysis mitigations. The precision choices and edge-case definitions align with the standard of engineering we want to present.

We are now ready to transition into the phased execution pipeline.

### 1. EXECUTION CONTEXT & MODEL ASYMMETRY
- **Target Repository:** `https://github.com/Juanda2005123/sezzle_calculator.git`
- **Execution Agent:** Development will be conducted inside **Antigravity**, an autonomous agent environment with shell access, filesystem control, and build toolchains.
- **Model Capability Delta:** The agent in Antigravity runs on **Gemini Flash**, whereas you (Gemini Argon) act as the **Staff Architect & Reasoning Engine**. While the domain logic of a calculator is straightforward, Gemini Flash requires **unambiguous, highly prescriptive, and deterministic prompts** to prevent subtle drift, missing edge cases, or loose typing.
- **Your Role:** You must provide crystal-clear, exhaustive instructions for each phase—including exact terminal commands, directory paths, dependency versions, and non-negotiable code contracts. Flash should never have to guess architectural decisions or mathematical semantics.

### 2. WORKFLOW & FEEDBACK LOOP
We will follow a strict **Staff Architect (You) ↔ Autonomous Implementer (Antigravity/Flash)** loop:
1. **You** deliver the complete, self-contained implementation prompt for the current phase.
2. **Antigravity (Flash)** executes the instructions, creates the files, and runs terminal verification commands.
3. **I** return the build outputs, test results, and file tree back to you for audit.
4. **You** review the implementation, catch any discrepancies against our architectural blueprint, and once approved, output the prompt for the next phase.

### 3. YOUR IMMEDIATE DELIVERABLES
#### A. Phasing & Agent Guidance Assessment
- Confirm whether your proposed 5–6 phase roadmap is optimal for an autonomous coding agent, or adjust phase boundaries to maximize testability and focus.
- **Agent Rules & Skills:** Decide whether Antigravity should rely on a comprehensive system rule file (e.g., `.cursorrules` / `AGENT_RULES.md`) or dedicated skill definitions.
#### B. Phase 1 Implementation Prompt (For Antigravity / Gemini Flash)
Generate the complete, ready-to-run prompt for **Phase 1: Repository Scaffolding, Git Remote, and Project Skeletons**.
~~~

**Architectural Outcome:** Established the 6-phase verification-gated execution roadmap and persistent root `AGENT_RULES.md` / `.cursorrules` guardrails.
</details>

<details>
<summary><strong>Prompt 1.3: Prompt Abstraction Calibration (Specifications Over Boilerplate Micromanagement)</strong> (Click to expand)</summary>

~~~markdown
Thank you for the structured assessment and breakdown. The 6-phase roadmap and the explicit CLI verification gates are solid.

However, we need to calibrate the level of abstraction in the implementation prompts for Antigravity:

### Feedback & Adjustments:
1. **Avoid Boilerplate Micromanagement:** Do not write out entire source files (such as `package.json`, `App.tsx`, `main.go`, or `tsconfig.json`) line-by-line inside the prompt. Antigravity is an autonomous coding agent with full shell and filesystem capabilities. Treating it like a copy-paste script wastes prompt context and diminishes its agentic strengths.
2. **True Architect Stance:** Your role as Staff Architect is to provide **prescriptive specifications, structural constraints, and acceptance criteria**—not the boilerplate code itself. The prompt should specify:
   - Target tools and exact package versions (e.g., `github.com/shopspring/decimal v1.4`, Tailwind CSS v4, Vitest, `@testing-library/react`).
   - The required directory layout and module paths.
   - Non-interactive CLI commands (e.g., `npm create vite@latest frontend -- --template react-ts` instead of interactive wizards).
   - Architectural guardrails (English only, no `any`, no `float64` in domain math, RFC 9457 error payloads).
   - The mandatory CLI verification commands and output metrics the agent must run and report back.
3. **Delegation:** Let the agent scaffold the files, wire up the dependencies, and write the initial code according to your specifications. If the agent deviates from your criteria, we will catch and correct it at the verification gate.

Please regenerate the **Phase 1 Execution Prompt** under this calibrated format: concise, highly prescriptive on rules, standards, commands, and verification criteria, but allowing Antigravity to generate the actual boilerplate code.
~~~

**Architectural Outcome:** Calibrated all 6 phase prompts to provide strict behavioral/mathematical contracts, input/output invariants, and mandatory CLI verification gates while delegating code synthesis to the autonomous agent.
</details>

---

## 3. Tier 2: Staff Architect → Antigravity Phased Execution Prompts (Verbatim)

<details>
<summary><strong>Phase 1 Prompt: Repository Scaffolding, Tooling & Guardrails</strong> (Click to expand)</summary>

~~~markdown
# PHASE 1 EXECUTION PROMPT: REPOSITORY SCAFFOLDING, TOOLING & GUARDRAILS

## 1. ROLE & ARCHITECTURAL DIRECTIVES
You are an autonomous Full-Stack Implementation Agent executing **Phase 1 of 6** for the Sezzle Calculator assessment under Staff Architect supervision.

- **Language Policy:** All code, identifiers, comments, commit messages, documentation, and test cases MUST be exclusively in English.
- **Execution Mode:** Use non-interactive CLI flags (`--yes`, `-y`) so terminal commands never hang waiting for user input.
- **Phase 1 Scope Boundary:** Set up the Git repository, directory layout, engineering rules (`AGENT_RULES.md` / `.cursorrules`), root `Makefile`, initial `docs/AI_PROMPTS.md`, and minimal compilable/testable skeletons for both `backend/` and `frontend/`. Do NOT implement the full calculator domain or UI logic yet.

---

## 2. STEP-BY-STEP SPECIFICATIONS

### Step 1: Git Initialization & Directory Scaffolding
1. Initialize Git on branch `main` (if not already initialized) and configure the `origin` remote to `https://github.com/Juanda2005123/sezzle_calculator.git`.
2. Create the required project directory tree:
   - `.github/workflows/`
   - `backend/cmd/api/`
   - `backend/internal/apperror/`
   - `backend/internal/calculator/`
   - `backend/internal/transport/http/`
   - `frontend/src/{api,components,hooks,types}/`
   - `docs/`
   - `scripts/`
3. Create a root `.gitignore` covering Go binaries/coverage outputs (`backend/bin/`, `coverage.out`), Node artifacts (`node_modules/`, `dist/`, `coverage/`), `.env*` files, and IDE/OS metadata.

### Step 2: Engineering Guardrails (`AGENT_RULES.md` & `.cursorrules`)
Create `AGENT_RULES.md` in the repository root and copy it to `.cursorrules`. It must codify these non-negotiable project rules:
- **English-Only Mandate:** 100% English across code, comments, errors, commits, and docs.
- **Backend Standards (Go 1.22+):**
  - Module path: `github.com/Juanda2005123/sezzle_calculator/backend`
  - **Arithmetic Precision:** Never use native `float64` for base-10 arithmetic (`add`, `subtract`, `multiply`, `divide`, `percent`). Always use `github.com/shopspring/decimal`. For irrational operations (`sqrt`, fractional `power`), validate domain constraints first, compute with guard precision, and round deterministically to 16 decimal places (`MaxPrecision = 16`) with trailing zeros stripped on formatted output.
  - **Error Taxonomy & HTTP Status Codes:** Never leak `500 Internal Server Error` on user input. Use a standardized JSON error envelope (`{"error": {"code": "...", "message": "...", "details": "..."}}`):
    - `400 Bad Request`: `ERR_MALFORMED_JSON`, `ERR_INVALID_OPERAND`, `ERR_UNSUPPORTED_OPERATION`, `ERR_INVALID_ARITY`.
    - `422 Unprocessable Entity`: `ERR_DIVISION_BY_ZERO`, `ERR_NEGATIVE_RADICAND`, `ERR_COMPLEX_RESULT`, `ERR_NUMERIC_OVERFLOW`.
    - `405 Method Not Allowed` (`ERR_METHOD_NOT_ALLOWED`) & `413 Content Too Large` (`ERR_PAYLOAD_TOO_LARGE` via 4KB `http.MaxBytesReader`).
- **Frontend Standards (React + TypeScript):**
  - Strict TypeScript (`strict: true`, zero `any` types).
  - Clean separation between `src/api/` (HTTP client), `src/hooks/` (reducer state machine & keyboard listeners), and `src/components/` (presentational UI).
  - Accessibility: `role="status"` and `aria-live="polite"` on the calculator display, `role="alert"` on error banners, explicit `aria-label` on operator buttons, and full physical keyboard navigation.
- **Testing Standards:**
  - Go: Table-driven unit and `httptest` suites running with `-race` and targeting >90% coverage.
  - Frontend: Vitest + React Testing Library targeting >85% coverage.

### Step 3: Root `Makefile`
Create a root `Makefile` (using valid TAB indentation) with the following phony targets:
- `dev-backend`: Runs the Go API (`cd backend && go run ./cmd/api`).
- `dev-frontend`: Runs the Vite dev server (`cd frontend && npm run dev`).
- `test-backend`: Runs Go tests with race detection (`cd backend && go test -v -race ./...`).
- `coverage-backend`: Runs Go tests with coverage profile and outputs function-level summary (`go tool cover -func=coverage.out`).
- `test-frontend`: Runs Vitest in single-run mode (`cd frontend && npm run test -- --run`).
- `coverage-frontend`: Runs Vitest coverage (`cd frontend && npm run test:coverage`).
- `build`: Compiles the Go binary to `backend/bin/calculator-api` and builds the frontend production bundle.
- `docker-up`, `docker-down`, and `smoke-test` (`./scripts/smoke-test.sh`).

### Step 4: Backend Skeleton (`backend/`)
1. Initialize the Go module as `github.com/Juanda2005123/sezzle_calculator/backend` and install `github.com/shopspring/decimal@v1.4.0`.
2. Implement a minimal, compilable `backend/cmd/api/main.go` that:
   - Verifies `shopspring/decimal` linkage by computing `0.1 + 0.2` and supporting a quick CLI check mode (e.g., if `SMOKE_CHECK=1`, print the exact decimal result `"0.3"` and exit `0`).
   - Starts an HTTP server on `PORT` (default `8080`) using standard `net/http` (`http.NewServeMux`) with a `GET /api/v1/health` endpoint returning `200 OK` and `{"status":"healthy"}`.
3. Run `go mod tidy` so `go.mod` and `go.sum` are clean.

### Step 5: Frontend Skeleton (`frontend/`)
1. Scaffold the Vite React + TypeScript project non-interactively while preserving the `src/{api,components,hooks,types}` subdirectories.
2. Install dependencies:
   - Production: `lucide-react`
   - Styling: `tailwindcss` and `@tailwindcss/vite` (Tailwind CSS v4 Vite plugin setup; import `@import "tailwindcss";` in `src/index.css`).
   - Testing: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@vitest/coverage-v8`.
3. Configure `vite.config.ts`:
   - Register the React and `@tailwindcss/vite` plugins.
   - Configure `server.proxy` so `/api` proxies to `http://localhost:8080` (`changeOrigin: true`).
   - Configure `test` for Vitest (`globals: true`, `environment: 'jsdom'`, `setupFiles` importing `@testing-library/jest-dom`, and `v8` coverage reporter).
4. Ensure `tsconfig.json` / `tsconfig.app.json` enforces `strict: true` and includes `"vitest/globals"` and `"@testing-library/jest-dom"` in `types`.
5. Ensure `package.json` defines `"test": "vitest"` and `"test:coverage": "vitest run --coverage"`.
6. Replace the default Vite boilerplate in `src/App.tsx` with a minimal placeholder component rendering the heading `"Sezzle Precision Calculator"`, and write a passing smoke test in `src/App.test.tsx` using React Testing Library that asserts this heading renders.

### Step 6: Initialize Prompt Audit Log (`docs/AI_PROMPTS.md`)
Create `docs/AI_PROMPTS.md` documenting the workflow, guardrails, and Phase 1 verification results.

---

## 3. MANDATORY ACCEPTANCE CRITERIA & VERIFICATION GATE
```bash
git remote -v
git status -s
cd backend && SMOKE_CHECK=1 go run ./cmd/api && go build -o ./bin/calculator-api ./cmd/api && cd ..
cd frontend && npm run build && npm run test -- --run && cd ..
```
~~~

**Verification Gate Result:** Passed (`SMOKE_CHECK=1` printed `0.3`, `calculator-api` binary built cleanly, Vite production build succeeded in 620ms, Vitest initial smoke test passed).
</details>

<details>
<summary><strong>Phase 2 Prompt: Backend Domain Engine & Table-Driven Unit Test Suite</strong> (Click to expand)</summary>

~~~markdown
# PHASE 2 EXECUTION PROMPT: BACKEND DOMAIN ENGINE & UNIT TEST SUITE

## 1. ROLE & EXECUTION CONTEXT
You are an autonomous Full-Stack Implementation Agent executing **Phase 2 of 6** for the Sezzle Calculator assessment.
- Read `AGENT_RULES.md` before writing code. All code, comments, error messages, and commit messages MUST be 100% in English.
- **Host Environment Note (Windows):** `go` is installed at `C:\Program Files\Go\bin`. Ensure it is in `$env:Path` for shell commands. Because the Windows host does not use CGO/`gcc`, omit `-race` during local Windows `go test` runs, and always quote Go coverage flags in PowerShell (`go test -v "-coverprofile=coverage.out" ./...` and `go tool cover "-func=coverage.out"`). Do NOT install external system packages via `winget` or `choco`.
- **Phase 2 Scope Boundary:** Implement the backend domain error package (`backend/internal/apperror`) and the pure arbitrary-precision arithmetic engine (`backend/internal/calculator`) along with exhaustive table-driven unit tests. Do NOT modify the HTTP transport layer yet (that is Phase 3).

---

## 2. PACKAGE SPECIFICATIONS & CONTRACTS

### A. Domain & Application Errors (`backend/internal/apperror`)
Create `errors.go` and `errors_test.go` in `package apperror`:
1. **Error Structure:** Define an `AppError` struct that implements the standard `error` interface:
   - `Code` (`string`, `json:"code"`)
   - `Message` (`string`, `json:"message"`)
   - `Details` (`string`, `json:"details,omitempty"`)
   - `HTTPStatus` (`int`, `json:"-"`)
2. **Standard Error Codes & Constructors:**
   - **HTTP 400 (`http.StatusBadRequest`):**
     - `ERR_MALFORMED_JSON` — Invalid JSON syntax, empty payload, or unknown fields.
     - `ERR_INVALID_OPERAND` — Missing/null required operand, or non-numeric/NaN/Infinite operand value.
     - `ERR_UNSUPPORTED_OPERATION` — Operation is not one of the 7 supported tokens.
     - `ERR_INVALID_ARITY` — Missing `operand_b` for binary operations, or unexpected non-null `operand_b` for unary-only operations (`sqrt`).
   - **HTTP 422 (`http.StatusUnprocessableEntity`):**
     - `ERR_DIVISION_BY_ZERO` — Division by zero (`a / 0`) or zero raised to a negative exponent (`0 ^ -b`).
     - `ERR_NEGATIVE_RADICAND` — Square root of a negative number (`sqrt(a)` where `a < 0`).
     - `ERR_COMPLEX_RESULT` — Negative base raised to a non-integer exponent (`a ^ b` where `a < 0` and `b` is fractional).
     - `ERR_NUMERIC_OVERFLOW` — Input or output magnitude exceeds `10^1000`, or exponent magnitude `|b| > 10000`.
   - **HTTP 405, 413, 500:**
     - `ERR_METHOD_NOT_ALLOWED` (`405`), `ERR_PAYLOAD_TOO_LARGE` (`413`), `ERR_INTERNAL` (`500`).
3. Write unit tests in `errors_test.go` verifying constructor fields, status codes, `Error()` string formatting, and `errors.As` unwrapping.

---

### B. Arbitrary-Precision Calculator Engine (`backend/internal/calculator`)
Create `service.go` and `service_test.go` in `package calculator` using `github.com/shopspring/decimal` (and `math/big` where needed for high-precision roots/powers).

#### 1. Supported Operations (`Operation` string type)
- `"add"` (`+`) — Binary
- `"subtract"` (`-`) — Binary
- `"multiply"` (`*`) — Binary
- `"divide"` (`/`) — Binary
- `"power"` (`^`) — Binary
- `"sqrt"` (`√`) — Unary
- `"percent"` (`%`) — Dual-Arity (Unary when `OperandB == nil`; Binary when `OperandB != nil`)

#### 2. Input & Output Contracts
- **Input:** `Operation`, `OperandA decimal.Decimal`, `OperandB *decimal.Decimal` (pointer to distinguish omitted/null vs zero).
- **Output (`CalculationResult`):**
  - `Operation` (`Operation`)
  - `OperandA` (`string`) — Normalized canonical string of `OperandA` (with `-0` normalized to `"0"`).
  - `OperandB` (`*string`) — Normalized canonical string of `OperandB` if non-nil, else `nil`.
  - `Result` (`decimal.Decimal`) — Exact decimal value rounded to at most `MaxPrecision = 16` decimal places.
  - `Formatted` (`string`) — Clean decimal string with trailing fractional zeros stripped (e.g., `12.000` -> `"12"`, `0.3000` -> `"0.3"`, `-0` -> `"0"`).
  - `Expression` (`string`) — Human-readable equation string:
    - Standard Binary (`add`, `subtract`, `multiply`, `divide`, `power`): `"<OperandA> <symbol> <OperandB> = <Formatted>"`
    - Binary `percent`: `"<OperandA>% of <OperandB> = <Formatted>"`
    - Unary `percent`: `"<OperandA>% = <Formatted>"`
    - Unary `sqrt`: `"sqrt(<OperandA>) = <Formatted>"`

#### 3. Mathematical & Boundary Rules (Strict Enforcement)
- **Precision & Guard Digits:** `MaxPrecision = 16` for final output rounding; 32 guard digits on intermediate division (`a.DivRound(b, 32).Round(16)`).
- **Overflow Protection (`ERR_NUMERIC_OVERFLOW`):** Max magnitude $10^{1000}$ (`decimal.New(1, 1000)`).
- **Arity Validation (`ERR_INVALID_ARITY`):** Require `OperandB` on binary ops; forbid `OperandB` on `sqrt`.
- **Operation-Specific Edge Cases:**
  - `divide`: `OperandB.IsZero()` -> `ERR_DIVISION_BY_ZERO`.
  - `sqrt`: `OperandA.IsNegative()` -> `ERR_NEGATIVE_RADICAND`; high-precision `big.Float` root supporting magnitudes above `math.MaxFloat64` (`sqrt(1e400) = 1e200`).
  - `power`: $0^{-n}$ -> `ERR_DIVISION_BY_ZERO`; $0^0 = 1$; negative base + fractional exponent -> `ERR_COMPLEX_RESULT`; $\vert{}b\vert{} > 10000$ (except $a \in \{-1,0,1\}$) or $\log_{10}(\vert{}a\vert{}) \times b > 1000$ -> `ERR_NUMERIC_OVERFLOW`.
  - `percent`: Unary $a / 100$; Binary $(a \times b) / 100$.

---

## 3. TABLE-DRIVEN UNIT TEST REQUIREMENTS (`service_test.go`)
Cover standard arithmetic, IEEE 754 traps (`0.1 + 0.2 = 0.3`), repeating/irrational decimals (`1/3`, `sqrt(2)`), high-magnitude `sqrt(1e400)`, exponentiation edge cases, unary/binary percentage modes, `-0` normalization, and all domain/arity error codes.

## 4. MANDATORY ACCEPTANCE CRITERIA & VERIFICATION GATE
- 100% of unit tests in `internal/apperror` and `internal/calculator` must pass.
- Statement coverage for `internal/apperror` and `internal/calculator` must be **>= 95%**.
~~~

**Verification Gate Result:** Passed (`internal/apperror`: **100.0%** coverage, `internal/calculator`: **95.5%** coverage; committed as `d1eba8c`).
</details>

<details>
<summary><strong>Phase 3 Prompt: Backend HTTP Transport, Middleware & httptest Integration Suite</strong> (Click to expand)</summary>

~~~markdown
# PHASE 3 EXECUTION PROMPT: BACKEND HTTP TRANSPORT, MIDDLEWARE & HTTPTEST INTEGRATION SUITE

## 1. ROLE & EXECUTION CONTEXT
You are an autonomous Full-Stack Implementation Agent executing **Phase 3 of 6** for the Sezzle Calculator assessment.
- Read `AGENT_RULES.md` before writing code. All code, comments, error messages, and commit messages MUST be 100% in English.
- **Phase 3 Scope Boundary:** Implement the HTTP transport layer in `backend/internal/transport/http`, write comprehensive HTTP integration tests using `net/http/httptest`, and refactor `backend/cmd/api/main.go` (and `main_test.go`) to use the new HTTP router and remove temporary Phase 1 scaffolding (`CalculateDecimalSum`).

---

## 2. ARCHITECTURAL SPECIFICATIONS (`backend/internal/transport/http`)

### A. Request/Response DTOs & Custom Operand Parsing (`dto.go`)
1. **Flexible Operand Type (`Operand`):**
   - Implement a custom type that unmarshals JSON numbers (`0.1`, `-42`, `1e5`) AND JSON strings (`"0.1"`, `" -42.5 "`) directly into `decimal.Decimal` without passing through `float64`.
   - Reject booleans (`true`/`false`), arrays, objects, empty strings, `"NaN"`, `"Infinity"`, `"-Infinity"`, or unparseable strings by returning an `apperror.NewInvalidOperandError(...)`.
2. **Calculation Request (`CalculateRequest`):**
   - `Operation` (`string`, `json:"operation"`), `OperandA` (`*Operand`, `json:"operand_a"`), `OperandB` (`*Operand`, `json:"operand_b,omitempty"`).
3. **Success Response Envelope (`CalculateResponse`):**
   - Serialize `"result"` as `json.Number` (initialized from `CalculationResult.Formatted`) and `"formatted"` as `string`.
4. **Error Response Envelope (`ErrorResponse`):**
   - Standardized `{"error": {"code": "...", "message": "...", "details": "..."}}`.

### B. HTTP Handlers (`handler.go`), Middleware (`middleware.go`) & Router (`router.go`)
1. `GET /api/v1/health` -> `200 OK` (`{"status":"healthy"}`).
2. `POST /api/v1/calculate` -> Enforce 4096-byte payload limit (`http.MaxBytesReader` -> `413 ERR_PAYLOAD_TOO_LARGE`), `decoder.DisallowUnknownFields()`, `decoder.UseNumber()`, and trailing token EOF verification.
3. Non-POST requests to `/api/v1/calculate` -> `405 Method Not Allowed` (`ERR_METHOD_NOT_ALLOWED`).
4. **CORS Middleware:** Configurable `ALLOWED_ORIGINS` (default `*`), `OPTIONS` preflight returning `204 No Content`.
5. **Panic Recovery Middleware:** Catches unexpected runtime panics, logs via `log/slog`, and returns `500 Internal Server Error` (`ERR_INTERNAL`).

---

## 3. HTTP INTEGRATION TEST SUITE REQUIREMENTS (`handler_test.go`)
Using `net/http/httptest`, test health check, happy paths (numbers, strings, unary/binary ops), 400 contract errors (malformed JSON, unknown fields, invalid operands, unsupported op, arity mismatch), 422 domain errors, 405 method not allowed, 204 CORS preflight, 413 payload > 4KB, and 500 panic recovery.

## 4. MANDATORY ACCEPTANCE CRITERIA & VERIFICATION GATE
- Statement coverage in `internal/transport/http` must be **>= 90%**, and total backend statement coverage must be **>= 90%**.
~~~

**Verification Gate Result:** Passed (`internal/transport/http`: **97.2%** coverage, total backend coverage: **90.4%**; committed as `caab52a`).
</details>

<details>
<summary><strong>Phase 4 Prompt: Frontend API Client, State Machine Hook, Keyboard Navigation & Accessible UI</strong> (Click to expand)</summary>

~~~markdown
# PHASE 4 EXECUTION PROMPT: FRONTEND API CLIENT, STATE MACHINE HOOK & ACCESSIBLE UI

## 1. ROLE & EXECUTION DIRECTIVES
You are an autonomous Full-Stack Implementation Agent executing **Phase 4 of 6** for the Sezzle Calculator assessment.
- Read `AGENT_RULES.md` before writing code. All code, comments, UI copy, ARIA labels, and commit messages MUST be 100% in English.
- **Workspace Boundary:** Operate strictly inside the repository root (`c:\Dev\sezzle\calculator`).
- **Phase 4 Scope Boundary:** Implement the complete React + TypeScript frontend (`src/types`, `src/api`, `src/hooks`, `src/components`, `src/App.tsx`).

---

## 2. FRONTEND ARCHITECTURAL SPECIFICATIONS

### A. Shared TypeScript Contracts (`frontend/src/types/calculator.ts`)
Enforce `strict: true` with zero `any` types (`Operation`, `CalculateRequest`, `CalculationData`, `CalculateResponse`, `ApiErrorDetail`, `ErrorResponse`, `HistoryItem`).

### B. HTTP Service Client (`frontend/src/api/calculatorApi.ts`)
- `CalculatorApiError` with `status`, `code`, `message`, `details`.
- `calculate(payload, signal)` with 8000ms timeout controller, structured error parsing, and `ERR_NETWORK` mapping on connection failures.
- `checkHealth()` verifying `GET /api/v1/health`.

### C. Calculator State Machine Hook (`frontend/src/hooks/useCalculator.ts`)
- Manage `displayValue`, `previousOperand`, `pendingOperation`, `expressionPreview`, `isWaitingForOperand`, `isLoading`, `error`, and `history` (up to 10 items).
- Enforce 24-character digit limit, leading zero suppression, single decimal guard, sign toggling, backspace, `clearAll`, immediate unary `sqrt`, dual-mode `percent` (unary standalone vs. binary percentage), operator switching, and chained calculation evaluation.

### D. Physical Keyboard Navigation Hook (`frontend/src/hooks/useKeyboardShortcuts.ts`)
- Map `0-9`, `.`, `+`, `-`, `*`/`x`, `/` (`preventDefault`), `^`, `%`, `r`/`R` (`sqrt`), `Enter`/`=` (`preventDefault`), `Backspace`, and `Escape` (`clearAll`), ignoring combinations with `Ctrl`/`Alt`/`Meta` and triggering visual active feedback on keypad buttons.

### E. Accessible, Responsive UI Components (`frontend/src/components/` & `App.tsx`)
- `Display.tsx` (`role="status"`, `aria-live="polite"`, `data-testid="calculator-display"`).
- `ErrorBanner.tsx` (`role="alert"`, `aria-live="assertive"`, `data-testid="error-banner"`).
- `Keypad.tsx` (4-column CSS Grid with explicit `aria-label` on all operators/utilities and `focus-visible:ring-2`).
- `HistoryPanel.tsx` & `KeyboardReference.tsx`.

## 3. MANDATORY ACCEPTANCE CRITERIA & VERIFICATION GATE
- `npm run build` (`tsc -b && vite build`) succeeds with **0 TypeScript errors** and **0 warnings**.
- Zero `any` types across all `.ts` and `.tsx` files in `frontend/src/`.
~~~

**Verification Gate Result:** Passed (`tsc -b && vite build` succeeded with 0 errors and 0 `any` types, 20 initial unit tests passing; committed as `c231b15`).
</details>

<details>
<summary><strong>Phase 5 Prompt: Exhaustive Frontend Test Suite (>= 85% Coverage) & Live Chromium E2E Verification</strong> (Click to expand)</summary>

~~~markdown
# PHASE 5 EXECUTION PROMPT: EXHAUSTIVE FRONTEND TEST SUITE (>= 85% COVERAGE) & LIVE CHROMIUM E2E VERIFICATION

## 1. ROLE & EXECUTION DIRECTIVES
You are an autonomous Full-Stack Implementation Agent executing **Phase 5 of 6** for the Sezzle Calculator assessment.
- **Phase 5 Scope Boundary:**
  1. Expand the Vitest + React Testing Library unit and component integration test suite so statement, branch, function, and line coverage across `frontend/src` exceeds **85%** (aim for **>90%**).
  2. Start the live Go backend (`:8080`) and Vite frontend (`:5173`) and use your **integrated Chromium browser** to execute a live End-to-End (E2E) visual, functional, and accessibility verification across the full stack, then cleanly terminate the background dev servers before committing.

---

## 2. PART 1: VITEST & REACT TESTING LIBRARY COVERAGE SPECIFICATIONS
Test full user journeys in `App.test.tsx` and component/hook suites:
1. Core Binary Operations & IEEE 754 Precision Flow (`0.1 + 0.2 = 0.3`).
2. Advanced Operations (`sqrt(144) = 12`, `2 ^ 3 = 8`, unary `50% = 0.5`, binary `150 + 20% = 30`).
3. Chained Operations & Operator Switching.
4. Domain Error Presentation & Recovery (`role="alert"` on `9 / 0`, dismiss button, `AC` reset).
5. Input Utilities (`AC`, `DEL`, `±`, multiple decimal point prevention).
6. Calculation History Panel & Keyboard Reference interactions.
7. Physical Keyboard Integration (`keydown` events driving `<App/>`).
8. API client edge cases (400/422 JSON errors, non-JSON 500 fallback, network error `ERR_NETWORK`, `AbortSignal`, `checkHealth`).

---

## 3. PART 2: LIVE FULL-STACK E2E VERIFICATION VIA INTEGRATED CHROMIUM
1. Start the Go backend (`:8080`) and Vite dev server (`:5173`).
2. Drive headless Chromium against `http://localhost:5173`:
   - Verify 0 console errors.
   - Verify `0.1 + 0.2 = 0.3` round-trip and DOM history entry.
   - Verify `sqrt(144) = 12` and `12 ^ 2 = 144`.
   - Verify `42 ÷ 0 =` renders the `role="alert"` `ERR_DIVISION_BY_ZERO` banner and dismisses cleanly.
   - Verify keyboard input (`5`, `0`, `%` -> `0.5`) and responsive viewport layout (no horizontal overflow).
3. Terminate background servers and release ports `8080` and `5173`.
~~~

**Verification Gate Result:** Passed (**98.39%** statement coverage, **95.85%** branch coverage, **97.43%** function coverage across 9 test files / 62 tests; headless Chromium CDP E2E suite verified all 4 live scenarios with 0 console errors; committed as `d95f850`).
</details>

<details>
<summary><strong>Phase 6 Prompt: Containerization, Smoke Testing, CI Workflow, OpenAPI 3.1 Spec & Production README</strong> (Click to expand)</summary>

~~~markdown
# PHASE 6 EXECUTION PROMPT: CONTAINERIZATION, SMOKE TESTING, CI, OPENAPI & PRODUCTION README

## 1. ROLE & EXECUTION DIRECTIVES
You are an autonomous Full-Stack Implementation Agent executing the final phase (**Phase 6 of 6**) for the Sezzle Calculator assessment.
- **Phase 6 Scope Boundary:** Implement Docker containerization assets (`backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml`), automated smoke testing (`scripts/smoke-test.sh`), GitHub Actions CI workflow (`.github/workflows/ci.yml`), OpenAPI 3.1 specification (`docs/openapi.yaml`), and the production-grade `README.md`.

---

## 2. PHASE 6 DELIVERABLES SPECIFICATION
- **A. Backend Containerization (`backend/Dockerfile`):** Multi-stage build (`golang:1.24-alpine` -> `gcr.io/distroless/static-debian12:nonroot`) with static `calculator-api` and `healthcheck` binaries running as `nonroot:nonroot`.
- **B. Frontend Containerization & Nginx (`frontend/Dockerfile` & `frontend/nginx.conf`):** Multi-stage build (`node:22-alpine` -> `nginx:1.27-alpine`) serving the SPA on port 80 and reverse-proxying `/api/` to `http://backend:8080/api/`.
- **C. Unified Orchestration (`docker-compose.yml`):** Orchestrates `backend` (`:8080`) and `frontend` (`:3000`) with `service_healthy` dependency gating.
- **D. Automated Smoke Testing (`scripts/smoke-test.sh`):** Polls backend health, verifies frontend HTTP 200, tests `0.1 + 0.2 = 0.3` through the Nginx proxy, and verifies `42 / 0 -> 422 ERR_DIVISION_BY_ZERO`.
- **E. GitHub Actions CI (`.github/workflows/ci.yml`):** Automated Backend Test & Build (`-race`), Frontend Test & Coverage, and Docker Compose Build verification on push/PR.
- **F. OpenAPI 3.1 Specification (`docs/openapi.yaml`) & Production `README.md`.**
~~~

**Verification Gate Result:** Passed (`docker compose build` succeeded, `docker compose up -d && ./scripts/smoke-test.sh` passed all 4 E2E container checks in 1s; committed as `2566253`).
</details>

---

## 4. Quality Control & Human Engineering Interventions Summary

| Phase | Verification Method | Key Engineering Invariant Verified | Outcome |
| :--- | :--- | :--- | :---: |
| **Phase 1** | `SMOKE_CHECK=1 go run ./cmd/api` & `npm run build` | Verified `shopspring/decimal` linkage (`0.1 + 0.2 = 0.3`) and strict TypeScript config. | **PASS** |
| **Phase 2** | `go test -coverprofile=coverage.out ./internal/...` | Enforced 32 guard digits on division, 16-digit output rounding, `big.Float` fallback for `sqrt(1e400)`, and $10^{1000}$ overflow protection. | **PASS (95.5% / 100%)** |
| **Phase 3** | `net/http/httptest` integration suite | Custom `Operand` unmarshaler rejecting booleans/NaN/Infinity without `float64` intermediate conversion; 4KB `MaxBytesReader`; panic recovery middleware. | **PASS (97.2%)** |
| **Phase 4** | `tsc -b && vite build` & static `any` scan | Zero `any` types; `e.preventDefault()` on `Enter` and `/` keys; WAI-ARIA `role="status"` and `role="alert"` live regions. | **PASS (0 errors)** |
| **Phase 5** | `vitest run --coverage` & Headless Chromium CDP | 62 unit/integration tests + live full-stack browser verification across Go API + Vite proxy. | **PASS (98.39%)** |
| **Phase 6** | `docker compose up --build -d` & `./scripts/smoke-test.sh` | Static `/bin/healthcheck` binary inside `distroless` image; Nginx `/api/` reverse proxy eliminating cross-origin preflight overhead. | **PASS (4/4 E2E)** |
