.PHONY: dev-backend dev-frontend test-backend coverage-backend test-frontend coverage-frontend build docker-up docker-down smoke-test

dev-backend:
	cd backend && go run ./cmd/api

dev-frontend:
	cd frontend && npm run dev

test-backend:
	cd backend && go test -v -race ./...

coverage-backend:
	cd backend && go test -v -race -coverprofile=coverage.out ./... && go tool cover -func=coverage.out

test-frontend:
	cd frontend && npm run test -- --run

coverage-frontend:
	cd frontend && npm run test:coverage

build:
	cd backend && go build -o ./bin/calculator-api ./cmd/api
	cd frontend && npm run build

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

smoke-test:
	bash ./scripts/smoke-test.sh
