# ADR-001 — Repository Boundary

## Status
Accepted

## Context
The application needs to persist `Board` entities. However, tying the application core directly to a specific database or storage mechanism (like an in-memory Map) violates the Dependency Inversion Principle (DIP) and makes the system hard to test and evolve.

## Decision
We introduced a `BoardRepository` interface inside the application boundary (port) and implemented it using `InMemoryBoardRepository` in the infrastructure layer (adapter). The `BoardApplicationService` depends exclusively on the interface.

## Positive consequences
- The application core is completely decoupled from the persistence mechanism.
- We can swap the in-memory repository for a real database (e.g., PostgreSQL) in the future without changing the business logic or the application service.
- The application service can be easily unit-tested using a mock repository.

## Trade-off
- Increases the initial complexity of the project by requiring additional interfaces and architectural boundaries for a simple in-memory storage.

## Evidence / validation
- `BoardApplicationService` constructor only injects `BoardRepository`.
- `InMemoryBoardRepository` is located in the `infrastructure.persistence` package, outside the `domain` and `application` packages.