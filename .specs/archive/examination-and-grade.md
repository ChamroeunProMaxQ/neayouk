# Feature Spec: Monthly Gradebook Matrix & Configurable Grading Rules

## 1. Goal & Context
Build a streamlined, end-to-end **Monthly Gradebook Matrix & Configurable Grading Rules System** across shared contracts (`packages/contracts`), backend API (`apps/api`), and frontend admin web (`apps/web`).

This module provides a direct, highly efficient monthly grading workflow mirroring the design of `student_attendances`:
1. **Streamlined Direct Schema (No Redundant Header Table)**:
   - Student monthly scores are identified directly by `student_id`, `class_id`, `month` (`YYYY-MM`), `academic_year`, and `semester`.
   - Eliminates intermediate session header tables for fast, atomic, idempotent score upserts.
2. **Admin-Configurable Master Grading Rules**:
   - Admins configure master scoring rules with custom evaluation components and weight distributions (e.g. `Reading = 5% [Max: 10]`, `Vocabulary = 30% [Max: 30]`, `Grammar = 15% [Max: 20]`, `Listening = 20% [Max: 20]`, `Speaking = 15% [Max: 10]`, `Homework = 15% [Max: 10]` totaling $100\%$).
   - Master rules define customizable grade threshold scales ($A$: 90–100%, $B$: 80–89%, $C$: 70–79%, $D$: 60–69%, $E$: 50–59%, $F$: <50%).
   - **Single Master Rule Constraint**: Once a master grading rule is configured, creating additional rules is disabled; admins only edit the existing master rule to adjust criteria or weights.
3. **Attendance-Style Monthly Filter & Instant Spreadsheet Matrix**:
   - Teachers and administrators select a **Class** and **Month** (`YYYY-MM`) from a top filter bar (matching the established Attendance Matrix pattern).
   - The interactive gradebook immediately populates with all enrolled students and editable score cells for each configured component.
4. **Interactive Excel-Like Spreadsheet Grid & Auto-Calculations**:
   - Rapid keyboard navigation (Arrow Up/Down/Left/Right, `Tab`, `Enter`).
   - Teachers enter **raw points** (e.g. 28/30 for Vocab, 9/10 for Reading).
   - Instant client-side auto-calculation of:
     - Component Weighted Scores: $\frac{\text{rawScore}}{\text{maxScore}} \times \text{weight}$
     - Total Raw Score & Total Weighted Score (out of $100\%$)
     - Percentage & Letter Grade Badge ($A, B, C, D, E, F$)
     - Class Rank ($1, 2, 3, \dots$ handling score ties)
   - **Strict Score Validation & Disabled Save Button**:
     - Real-time client validation prevents entering scores higher than a component's `maxScore`.
     - When any score exceeds maximum allowed points, the **Save Changes** button is automatically disabled and an alert badge `Scores exceed maximum allowed limit` is displayed.
   - Clean numeric score handling (blank or zero treated as 0 points) with an optional qualitative teacher feedback / remarks modal per student.
   - One-click batch save (`/api/v1/admin/examinations/matrix/save`) to persist or update student monthly scores.
5. **Complete Reporting Suite & Client-Side PDF Export**:
   - **Client-Side PDF Export**: Generates a formatted PDF matching the official school template (`Monthly Score: [Month]`, `Class:`, `Teacher:`, blue header row `#2563EB`, dynamic component columns, bold green `Total`, bold orange `Average`, bold red `Rank`, and colored grade boxes $A\text{--}F$).
   - **Printable Student Monthly Report Card**: A dedicated printable modal showing the student's monthly performance breakdown, class rank, attendance summary, teacher comments, and signature area.
   - **Class Summary Analytics**: Real-time summary cards displaying class average, highest/lowest scores, pass rate (%), and grade distribution breakdown ($A\text{--}F$).
6. **Dedicated Navigation & RBAC**:
   - Top-level sidebar item **"Exams & Grades"** (`/examinations`) with sub-items for **Gradebook Matrix** (`/examinations/gradebook`), **Report Cards** (`/examinations/report-cards`), and **Grading Rules** (`/examinations/rules`).
   - Teachers record scores for their assigned classes; Admins manage rules, view all classes, and export reports.

---

## 2. Requirements & Domain Modeling

### 2.1 Database Entities

```mermaid
erDiagram
    classes ||--o{ student_scores : "has monthly scores"
    students ||--o{ student_scores : "achieves score"
    users ||--o{ student_scores : "recorded by"

    grading_rules {
        int id PK
        string uuid UK
        string name
        string code UK
        string academic_year
        string semester
        json components
        json grade_scale
        boolean is_default
        string status
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }

    student_scores {
        int id PK
        string uuid UK
        int student_id FK
        int class_id FK
        string month
        string academic_year
        string semester
        json scores
        decimal total_raw_score
        decimal total_weighted_score
        decimal percentage
        string grade_letter
        int rank
        text feedback
        int recorded_by FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
```

---

#### 1. `grading_rules` Table
*Stores configurable master score breakdown schemes, component weights, max scores, and grade threshold scales.*

| Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Description & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique system UUID |
| `name` | `VARCHAR(255)` | NO | NULL | `name: string` | Name (e.g. "Standard School Evaluation Scheme") |
| `code` | `VARCHAR(50)` | NO | NULL | `code: string` | Unique identifier code (e.g. `RULE-DEFAULT`) |
| `academic_year` | `VARCHAR(20)` | YES | '2025-2026' | `academicYear?: string` | Academic year (e.g. `2025-2026`) |
| `semester` | `VARCHAR(26)` | YES | 'SEMESTER_1' | `semester?: SemesterEnum` | `SEMESTER_1`, `SEMESTER_2`, `TERM_1`, `TERM_2`, etc. |
| `components` | `JSON` | NO | `[]` | `components: GradingRuleComponent[]` | Array of `{ id, name, maxScore, weight, description }` |
| `grade_scale` | `JSON` | NO | `[]` | `gradeScale: GradeScaleItem[]` | Array of `{ letter, minScore, maxScore, label }` |
| `is_default` | `BOOLEAN` | NO | TRUE | `isDefault: boolean` | Active master grading template |
| `status` | `VARCHAR(26)` | NO | 'ACTIVE' | `status: string` | `ACTIVE`, `INACTIVE` |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | `createdAt: Date` | Creation timestamp |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | `updatedAt: Date` | Update timestamp |
| `deleted_at` | `DATETIME` | YES | NULL | `deletedAt?: Date` | Soft delete timestamp |

---

#### 2. `student_scores` Table
*Direct monthly score records for each student in a class, storing component breakdown and computed outcomes.*

| Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Description & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique system UUID |
| `student_id` | `INT` | NO | NULL | `studentId: number` | FK -> `students.id` (Indexed) |
| `class_id` | `INT` | NO | NULL | `classId: number` | FK -> `classes.id` (Indexed) |
| `month` | `VARCHAR(7)` | NO | NULL | `month: string` | Format `YYYY-MM` (e.g. `2026-08`) |
| `academic_year` | `VARCHAR(20)` | NO | '2025-2026' | `academicYear: string` | Academic year (e.g. `2025-2026`) |
| `semester` | `VARCHAR(26)` | NO | 'SEMESTER_1' | `semester: string` | Semester / Term |
| `scores` | `JSON` | NO | `{}` | `scores: Record<string, number>` | Raw points mapped by component ID |
| `total_raw_score` | `DECIMAL(6,2)`| NO | 0.00 | `totalRawScore: number` | Sum of raw points |
| `total_weighted_score`| `DECIMAL(6,2)`| NO | 0.00 | `totalWeightedScore: number` | Total weighted score ($0\text{--}100$) |
| `percentage` | `DECIMAL(5,2)`| NO | 0.00 | `percentage: number` | Calculated percentage ($0.00\text{--}100.00$) |
| `grade_letter` | `VARCHAR(5)` | NO | 'F' | `gradeLetter: string` | Resolved letter grade ($A, B, C, D, E, F$) |
| `rank` | `INT` | YES | NULL | `rank?: number` | Student's rank in class for this month |
| `feedback` | `TEXT` | YES | NULL | `feedback?: string` | Teacher's qualitative remarks/advice |
| `recorded_by` | `INT` | YES | NULL | `recordedBy?: number` | FK -> `users.id` |
| `created_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | `createdAt: Date` | Creation timestamp |
| `updated_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | `updatedAt: Date` | Update timestamp |
| `deleted_at` | `DATETIME` | YES | NULL | `deletedAt?: Date` | Soft delete timestamp |

**Unique Constraint**:
- `uq_student_scores_student_class_month (student_id, class_id, month)` ensuring atomic idempotency per student-class-month.

---

## 3. Architecture & File Structure

```
packages/contracts/src/
├── examination.dto.ts                  # Zod schemas & TypeScript types
├── route.ts                            # API_ROUTE.EXAMINATION.* constants
└── index.ts

apps/api/
├── database/
│   ├── migrations/
│   │   ├── 2026.08.18T00.00.01.create-grading_rules-table.ts
│   │   └── 2026.08.18T00.00.02.create-student_scores-table.ts
│   └── seeds/
│       └── 2026.08.18T00.00.00.examination-and-grading-seeder.ts
├── src/
│   └── examination/
│       ├── entity/
│       │   ├── grading-rule.entity.ts
│       │   └── student-score.entity.ts
│       ├── dto/
│       │   ├── grading-rule.dto.ts
│       │   └── gradebook.dto.ts
│       ├── mapper/
│       │   ├── grading-rule.mapper.ts
│       │   └── gradebook.mapper.ts
│       ├── admin.grading-rule.controller.ts
│       ├── admin.examination.controller.ts
│       ├── grading-rule.service.ts
│       ├── examination.service.ts
│       ├── examination.permission.ts
│       └── examination.module.ts
└── test/
    ├── examination.service.spec.ts
    ├── grading-rule.service.spec.ts
    └── examination.e2e-spec.ts
```

### 3.2 Frontend Architecture (`apps/web`)

```
apps/web/src/
├── features/
│   └── examinations/
│       ├── components/
│       │   ├── examination-filter-bar.tsx       # Class & Month selector
│       │   ├── gradebook-matrix.tsx             # Interactive spreadsheet grid with keyboard navigation
│       │   ├── gradebook-toolbar.tsx            # Save, Export PDF, Analytics triggers
│       │   ├── grading-rule-list-table.tsx      # Admin master rules table (single rule enforcement)
│       │   ├── grading-rule-form-dialog.tsx     # Dynamic modal for editing components & weights
│       │   ├── student-report-card-modal.tsx    # Printable student monthly report card
│       │   └── grade-analytics-cards.tsx        # Class average, pass rate, grade distribution
│       ├── lib/
│       │   └── export-gradebook-pdf.ts          # Client-side PDF export in official school template
│       ├── hooks/
│       │   ├── use-gradebook-matrix-query.ts    # Fetches matrix roster for selected class & month
│       │   ├── use-save-gradebook-mutation.ts   # Batch saves student scores
│       │   ├── use-grading-rules-query.ts       # Rules query & mutation hooks
│       │   └── use-student-report-card-query.ts # Single student report card query
│       └── index.ts
├── routes/
│   ├── gradebook-page.tsx                      # Gradebook Matrix page (/examinations/gradebook)
│   ├── grading-rules-page.tsx                  # Master Grading Rules manager page (/examinations/rules)
│   ├── report-cards-page.tsx                   # Student Report Cards page (/examinations/report-cards)
│   └── router.tsx                              # Route definitions under ProtectedLayout
```

---

## 4. Testing & Quality Assurance Plan

### 4.1 All 6 Condition Categories
1. **Happy Path (200 / 201)**:
   - Create and update master grading rule with components summing to 100%.
   - Load gradebook matrix for class and month: loads enrolled students with active component columns.
   - Batch save student scores: correctly calculates total weighted score, percentage, assigns letter grade ($A\text{--}F$), and determines correct class ranks.
   - Client-side PDF export and fetch student report card.
2. **Validation Failures (400 Bad Request)**:
   - Component weights sum $\neq 100\%$ rejected with clear error.
   - Raw score exceeding component `maxScore` rejected on backend and disabled on frontend Save button.
   - Negative scores or non-numeric inputs rejected.
   - Invalid month string (e.g. `2026-15`) rejected.
3. **Duplicate & Uniqueness Conflicts (409 Conflict)**:
   - Duplicate grading rule code rejected.
4. **Resource Not Found & Invalid State (404 / 422)**:
   - Requesting matrix for non-existent class ID returns 404.
5. **Authentication & Authorization (401 / 403)**:
   - Unauthenticated requests blocked.
   - Teachers restricted to scoring classes they teach; Admins can access all classes.
6. **Edge & Boundary Limits**:
   - 0 raw score produces 0.00% and 'F' grade.
   - Perfect score produces 100.00% and 'A' grade.
   - Rank ties handled properly (e.g. two #1 ranks both get Rank 1, next student gets Rank 3).

### 4.2 Acceptance Criteria
- [x] Shared contracts in `@repo/contracts` build cleanly (`pnpm --filter @repo/contracts build`).
- [x] Database migrations run cleanly up and down (`pnpm --filter api migrate up` / `down`).
- [x] Seeder generates realistic examination scores (`pnpm --filter api seed up`).
- [x] Vitest unit tests and E2E tests pass all 6 condition categories:
  - `pnpm --filter api test src/examination/examination.service.spec.ts` (10 tests passed)
  - `pnpm --filter api test src/examination/grading-rule.service.spec.ts` (6 tests passed)
  - `pnpm --filter api test:e2e test/examination.e2e-spec.ts` (13 tests passed)
- [x] Frontend interactive Gradebook Matrix renders smoothly with keyboard shortcuts, live calculation, over-max score validation & disabled Save button, client-side PDF export, and printable report cards.
- [x] Full monorepo validation passes (`pnpm test`, `pnpm test:e2e`, `pnpm --filter web build`).
