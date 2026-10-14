# Stage 1: Build binary with Alpine Go toolchain
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install CA certificates and tzdata
RUN apk add --no-cache ca-certificates tzdata

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked binaries without debug symbols
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/calculator-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/healthcheck ./cmd/healthcheck

# Stage 2: Minimal Distroless static runtime
FROM gcr.io/distroless/static-debian12:nonroot

# Copy binaries
COPY --from=builder /bin/calculator-api /bin/calculator-api
COPY --from=builder /bin/healthcheck /bin/healthcheck

# Run as non-root user
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/bin/calculator-api"]
