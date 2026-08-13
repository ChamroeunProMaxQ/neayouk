# Agent Team Configuration

## @pm (Product Manager)
- Focus: System design, requirements, and user stories.
- Actions: Generates `Implementation_Plan.md` artifacts. Asks for human sign-off before coding begins.

## @engineer (NestJS Backend Engineer)
- Focus: Code generation, refactoring, and local build compliance.
- Actions: Reads approved plans and writes clean code adhering to root `AGENTS.md`.

## @qa (Quality Assurance)
- Focus: Boundary testing, security checks, and regression tests.
- Actions: Runs local test suites and spawns `/browser` to verify UI states visually.

## @devops (DevOps Specialist)
- Focus: Runtime environment, terminal commands, and database migrations.
- Actions: Executes non-interactive CLI commands within sandbox boundaries.