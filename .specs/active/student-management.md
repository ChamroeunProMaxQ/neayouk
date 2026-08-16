# Feature Spec: Student Management, Multi-Class Enrollment, Semester Progression & Monthly Payment Tracker

## 1. Goal & Context
Build an end-to-end **Student Management & Academic Tracking System** across backend (`apps/api`), frontend (`apps/web`), and shared contracts (`packages/contracts`). 

The feature supports full student profile CRUD, multi-class enrollments (students can belong to one or multiple classes/sections), semester progression (promoting or advancing students to their next class after each semester while archiving previous academic history), and a monthly tuition/fee payment tracking engine that records monthly payment transactions and computes live **remaining unpaid months**, partial payments, and outstanding balances for each student.

---

## 2. Requirements & Boundaries

### 2.1 Domain & Entity Modeling (Domain-Driven Naming + Legacy Mapping)

> **Architectural Decisions & Standards**:
> - **Domain Clarity**: Intuitive, domain-driven table names (**`classes`** instead of `levels`, **`student_payments`** instead of generic `transactions`) to prevent naming collisions with teacher payroll or general accounting.
> - **Full Field Preservation**: Retains 100% of the valuable school domain fields from `old-schema.txt` (Khmer names `first_name_km`/`last_name_km`, monthly due day `payable_date`, `discount`, `program`, `teacher_id`).
> - **Casing Standard**: **`snake_case`** for MySQL database schema; **`camelCase`** for TypeScript properties, Zod DTOs, and REST API payloads.
> - **Decoupled Entity Relations**: In Node.js ESM, relations across TypeORM entities use type-only imports (`import type { StudentClass }`, `import type { StudentPayment }`) and string entity target references (`@OneToMany('StudentClass', ...)`, `@ManyToOne('Student', ...)`) to prevent circular initialization errors.
> - **Strict Enum Usage**: All statuses across entities, seeds, and UI use shared enums (`StudentStatusEnum`, `SemesterEnum`, `ClassEnrollmentStatusEnum`, `PaymentStatusEnum`, `PaymentMethodEnum`) from `@repo/contracts`.

---

#### 1. `students` Table
*Primary entity representing enrolled students, retaining full Khmer name support, monthly payment due day, and individual discounts from legacy schema.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Legacy Mapping & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique system UUID |
| `student_code` | `VARCHAR(50)` | YES | NULL | `studentCode?: string` | Unique student ID (auto-generated e.g. `STU-2026-000001`) |
| `first_name` | `VARCHAR(255)` | NO | NULL | `firstName: string` | English first name (*from legacy*) |
| `last_name` | `VARCHAR(255)` | NO | NULL | `lastName: string` | English last name (*from legacy*) |
| `first_name_km` | `VARCHAR(255)` | YES | NULL | `firstNameKm?: string` | Khmer first name (*from legacy `first_name_km`*) |
| `last_name_km` | `VARCHAR(255)` | YES | NULL | `lastNameKm?: string` | Khmer last name (*from legacy `last_name_km`*) |
| `gender` | `VARCHAR(16)` | NO | 'MALE' | `gender: 'MALE' \| 'FEMALE' \| 'OTHER'` | Gender (*from legacy*) |
| `date_of_birth` | `VARCHAR(255)` | YES | NULL | `dateOfBirth?: string` | DOB (*from legacy*) |
| `contact` | `VARCHAR(255)` | YES | NULL | `contact?: string` | Primary phone/contact (*from legacy*) |
| `guardian_name` | `VARCHAR(255)` | YES | NULL | `guardianName?: string` | Parent / Guardian name |
| `guardian_phone`| `VARCHAR(50)` | YES | NULL | `guardianPhone?: string` | Parent / Emergency contact phone |
| `payable_date` | `INT` | YES | 1 | `payableDate?: number` | Day of month fee is due (1–31) (*from legacy*) |
| `registered_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `registeredAt?: Date` | Enrollment start date (*from legacy*) |
| `discount` | `DECIMAL(10,2)` | NO | 0.00 | `discount: number` | Individual monthly discount (*from legacy*) |
| `status` | `VARCHAR(26)` | NO | 'ACTIVE' | `status: StudentStatusEnum` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `GRADUATED`, `DROPPED` |
| `created_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `createdAt?: Date` | Timestamp |
| `updated_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `updatedAt?: Date` | Timestamp |
| `deleted_at` | `DATETIME` | YES | NULL | `deletedAt?: Date \| null` | Soft-delete timestamp |

---

#### 2. `classes` Table *(Refined from legacy `levels`)*
*Represents an academic class / section / grade level with assigned teacher, program category, and base monthly fee.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Legacy Mapping & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique UUID |
| `name` | `VARCHAR(255)` | NO | NULL | `name: string` | Display name (e.g. "Primary - Grade 1A") (*legacy `level`*) |
| `code` | `VARCHAR(50)` | YES | NULL | `code?: string` | Short code (e.g. `G1-A`) |
| `grade_level` | `VARCHAR(50)` | YES | NULL | `gradeLevel?: string` | Grade level (*legacy `level`*) |
| `program` | `VARCHAR(255)` | YES | NULL | `program?: string` | Program name (e.g. "Kindergarten", "Primary", "Secondary", "Language") |
| `section` | `VARCHAR(255)` | YES | NULL | `section?: string` | Class section / room / shift (*legacy `class`*) |
| `monthly_fee` | `DECIMAL(10,2)` | NO | 0.00 | `monthlyFee: number` | Monthly tuition fee for this class (*legacy `fee`*) |
| `teacher_id` | `BIGINT UNSIGNED`| YES | NULL | `teacherId?: number` | Assigned teacher FK (*from legacy `teacher_id`*) |
| `academic_year` | `VARCHAR(20)` | YES | NULL | `academicYear?: string` | e.g. `2025-2026` |
| `semester` | `VARCHAR(26)` | YES | 'SEMESTER_1' | `semester?: SemesterEnum` | `SEMESTER_1`, `SEMESTER_2`, `SUMMER` |
| `capacity` | `INT` | NO | 30 | `capacity: number` | Max student capacity |
| `status` | `VARCHAR(26)` | NO | 'ACTIVE' | `status: StudentStatusEnum` | `ACTIVE`, `INACTIVE` |
| `created_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `createdAt?: Date` | Timestamp |
| `updated_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `updatedAt?: Date` | Timestamp |
| `deleted_at` | `DATETIME` | YES | NULL | `deletedAt?: Date \| null` | Soft-delete timestamp |

---

#### 3. `student_classes` Table *(Multi-Class Enrollment & Semester Progression Join Table)*
*Enables a student to belong to multiple classes (e.g. Primary Grade 1A + English ESL Level 1) and moves students to next classes each semester while archiving previous records.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Description / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `student_id` | `INT` | NO | NULL | `studentId: number` | FK $\rightarrow$ `students.id` (CASCADE) |
| `class_id` | `INT` | NO | NULL | `classId: number` | FK $\rightarrow$ `classes.id` (CASCADE) |
| `academic_year` | `VARCHAR(20)` | NO | NULL | `academicYear: string` | Academic year (e.g. `2025-2026`) |
| `semester` | `VARCHAR(26)` | NO | 'SEMESTER_1' | `semester: SemesterEnum` | `SEMESTER_1`, `SEMESTER_2`, `SUMMER` |
| `is_primary` | `BOOLEAN` | NO | TRUE | `isPrimary: boolean` | Primary / Homeroom class flag |
| `status` | `VARCHAR(26)` | NO | 'ENROLLED' | `status: ClassEnrollmentStatusEnum`| `ENROLLED`, `TRANSFERRED`, `COMPLETED`, `DROPPED` |
| `enrolled_at` | `DATETIME` | NO | CURRENT_TIMESTAMP | `enrolledAt: Date` | Date joined class |
| `completed_at` | `DATETIME` | YES | NULL | `completedAt?: Date` | Date completed / promoted |
| `remarks` | `TEXT` | YES | NULL | `remarks?: string` | Promotion remarks / notes |
| `created_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `createdAt?: Date` | Timestamp |
| `updated_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `updatedAt?: Date` | Timestamp |

---

#### 4. `student_payments` Table *(Refined from legacy `transactions` for Student Fee Ledger)*
*Records monthly fee payment transactions, links directly to the billed month & year, and powers the live unpaid months calculation.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Legacy Mapping & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique transaction UUID |
| `student_id` | `INT` | NO | NULL | `studentId: number` | FK $\rightarrow$ `students.id` (*legacy `student_id`*) |
| `class_id` | `INT` | YES | NULL | `classId?: number` | FK $\rightarrow$ `classes.id` (*legacy `level_id`*) |
| `billing_year` | `INT` | NO | NULL | `billingYear: number` | The billed calendar year (e.g. `2026`) |
| `billing_month` | `INT` | NO | NULL | `billingMonth: number` | The billed month index (1–12) |
| `amount_due` | `DECIMAL(10,2)` | NO | 0.00 | `amountDue: number` | Expected monthly fee (`class.monthly_fee` $-$ `discount`) |
| `amount_paid` | `DECIMAL(10,2)` | NO | 0.00 | `amountPaid: number` | Actual amount paid (*legacy `amount`*) |
| `discount_applied` | `DECIMAL(10,2)` | NO | 0.00 | `discountApplied: number` | Discount applied at time of payment |
| `status` | `VARCHAR(26)` | NO | 'PAID' | `status: PaymentStatusEnum` | `PAID`, `PARTIAL`, `UNPAID`, `OVERDUE` (*legacy `status`*) |
| `payment_method` | `VARCHAR(50)` | YES | 'CASH' | `paymentMethod?: PaymentMethodEnum` | `CASH`, `KHQR`, `BANK_TRANSFER`, `CREDIT_CARD` |
| `receipt_number` | `VARCHAR(100)` | YES | NULL | `receiptNumber?: string` | Invoice / receipt reference (*legacy `reference`*) |
| `paid_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `paidAt?: Date` | Payment timestamp (*legacy `transaction_date`*) |
| `notes` | `TEXT` | YES | NULL | `notes?: string` | Cashier notes or remarks |
| `recorded_by` | `INT` | YES | NULL | `recordedBy?: number` | Cashier user FK $\rightarrow$ `users.id` |
| `created_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `createdAt?: Date` | Timestamp |
| `updated_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `updatedAt?: Date` | Timestamp |

---

### 2.2 Monthly Unpaid Months & Balance Calculation Logic
1. **Billing Timeline Generation**:
   - For every student, the active enrollment period starts at `registered_at` (or primary `student_classes.enrolled_at`).
   - For each month from enrollment start up to the current active month, expected fee due is computed as:
     $$\text{Fee Due} = \text{Primary Class Monthly Fee} - \text{Student Base Discount}$$
2. **Transaction Reconciliation**:
   - Compares recorded payments in `student_payments` for records with `student_id = student.id`.
   - If `amount_paid >= amount_due`, marked as `PAID`.
   - If `amount_paid > 0` and `amount_paid < amount_due`, marked as `PARTIAL` with outstanding balance $\text{amount\_due} - \text{amount\_paid}$.
3. **Unpaid Months Computation**:
   - Any month in the student's timeline with no matching payment is marked **`UNPAID`** (or **`OVERDUE`** if past `payable_date`).
   - The API summary returns:
     - `totalPaidAmount`: Sum of all payments received.
     - `totalUnpaidMonths`: Total count of unpaid and partial months.
     - `unpaidMonthsList`: List of specific unpaid/partial months with names, amounts due, and statuses.
     - `totalOutstandingAmount`: Total dollar balance due across all unpaid and partial months.
     - `lastPaymentDate`: Most recent payment date recorded.
4. **Performance Optimization (`getStudentPaymentSummary`)**:
   - Supports `getStudentPaymentSummary(studentOrId: number | Student)` overload to eliminate redundant database queries when the student entity with relations is already loaded in batch.

---

### 2.3 Shared Contracts (`@repo/contracts`)

1. **Enums (`packages/contracts/src/*.enum.ts`)**:
   - `StudentStatusEnum`: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `GRADUATED`, `DROPPED`.
   - `SemesterEnum`: `SEMESTER_1`, `SEMESTER_2`, `SUMMER`.
   - `PaymentStatusEnum`: `PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`.
   - `ClassEnrollmentStatusEnum`: `ENROLLED`, `TRANSFERRED`, `COMPLETED`, `DROPPED`.
   - `PaymentMethodEnum`: `CASH`, `KHQR`, `BANK_TRANSFER`, `CREDIT_CARD`.

2. **Student DTOs & Zod Schemas (`packages/contracts/src/student.dto.ts`)**:
   - `StudentSchema`: Complete student model attribute schema.
   - `CreateStudentSchema`: Payload for registering a student (`firstName`, `lastName`, `firstNameKm`, `lastNameKm`, `gender`, `dateOfBirth`, `contact`, `guardianName`, `guardianPhone`, `payableDate`, `discount`, `classIds`, `primaryClassId`, `registeredAt`, `status`).
   - `UpdateStudentSchema`: Partial update schema.
   - `FindStudentsSchema`: Search (`search`), class filter (`classId`), payment status filter (`paymentStatus: ['ALL', 'PAID', 'PARTIAL', 'UNPAID', 'OVERDUE']`), billing period (`billingYear`, `billingMonth`), gender (`gender`), status (`status`), sorting (`sortBy`, `sortOrder`), soft-delete filters (`includeDeleted`, `onlyDeleted`), and pagination.
   - `StudentPaymentSummarySchema`: `{ totalPaidAmount, totalUnpaidMonths, unpaidMonthsList, totalOutstandingAmount, lastPaymentDate }`.
   - `StudentWithSummarySchema`: Full student entity joined with active classes and financial summary.

3. **Class & Semester Progression DTOs (`packages/contracts/src/class.dto.ts`)**:
   - `ClassSchema`, `CreateClassSchema`, `UpdateClassSchema`, `FindClassesSchema`.
   - `AssignStudentClassesSchema`: `{ studentId: number, classIds: number[], primaryClassId?: number, academicYear: string, semester: SemesterEnum }`.
   - `PromoteStudentSchema`: Payload to move a student to the next class for a new semester (`studentId`, `fromClassId`, `toClassId`, `academicYear`, `semester`, `completePreviousEnrollment`, `remarks`).
   - `BatchPromoteStudentsSchema`: Bulk class promotion for semester transitions.

4. **Payment Transaction DTOs (`packages/contracts/src/student-payment.dto.ts`)**:
   - `StudentPaymentSchema`: Payment record model.
   - `RecordPaymentSchema`: Payload for recording monthly fee payment (`studentId`, `classId?`, `billingYear`, `billingMonth`, `amountPaid`, `discountApplied?`, `paymentMethod`, `receiptNumber?`, `notes?`, `paidAt?`).
   - `BatchRecordPaymentSchema`: Payload for paying multiple months at once.
   - `FindStudentPaymentsSchema`: Query params for payment transactions.

5. **API Route Constants (`packages/contracts/src/route.ts`)**:
   ```typescript
   STUDENT: {
     LIST: '/api/v1/admin/students',
     CREATE: '/api/v1/admin/students',
     GET: '/api/v1/admin/students/:id',
     UPDATE: '/api/v1/admin/students/:id',
     DELETE: '/api/v1/admin/students/:id',
     SUMMARY: '/api/v1/admin/students/:id/summary',
     ASSIGN_CLASSES: '/api/v1/admin/students/:id/classes',
     PROMOTE: '/api/v1/admin/students/:id/promote',
     BATCH_PROMOTE: '/api/v1/admin/students/batch-promote',
     PAYMENTS: '/api/v1/admin/students/:id/payments',
     RECORD_PAYMENT: '/api/v1/admin/students/:id/payments',
   },
   CLASS: {
     LIST: '/api/v1/admin/classes',
     CREATE: '/api/v1/admin/classes',
     GET: '/api/v1/admin/classes/:id',
     UPDATE: '/api/v1/admin/classes/:id',
     DELETE: '/api/v1/admin/classes/:id',
   },
   ```

---

### 2.4 Backend API (`apps/api`)

1. **Database Migrations (`apps/api/database/migrations`)**:
   - `2026.08.17T00.00.01.create-students-table.ts`: Creates `students` table.
   - `2026.08.17T00.00.02.create-classes-table.ts`: Creates `classes` table.
   - `2026.08.17T00.00.03.create-student_classes-table.ts`: Creates join table for multi-class & semester progression.
   - `2026.08.17T00.00.04.create-student_payments-table.ts`: Creates `student_payments` table with unique constraint `(student_id, billing_year, billing_month)`.

2. **Umzug Seed Data (`apps/api/database/seeds`)**:
   - `2026.08.17T00.00.00.student-seeder.ts`: Seeds 14 classes (Kindergarten, Primary, Secondary, ESL), 12 students with authentic Khmer names, primary + secondary enrollments, and 2026 payment history.

3. **TypeORM Entities**:
   - `Student`: Has Many `StudentClass`, Has Many `StudentPayment`.
   - `Class`: Has Many `StudentClass`, Has Many `StudentPayment`.
   - `StudentClass`: Belongs To `Student` and `Class`.
   - `StudentPayment`: Belongs To `Student` and `Class`.

4. **Services & Business Logic**:
   - `StudentService`:
     - `findAll(query: FindStudentsDto)`: Search by name/code, filter by class, filter by current month payment status (`PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`), pagination, sorting.
     - `findOne(id: number)`: Returns student with active enrollments and payment summary.
     - `create(dto: CreateStudentDto)`: Creates student with auto-generated code `STU-${year}-${count.padStart(6, '0')}` and assigns initial classes.
     - `update(id: number, dto: UpdateStudentDto)`: Updates profile with early return validations.
     - `softDelete(id: number)`: Soft delete student and update status.
     - `assignClasses(studentId, dto)`: Updates or adds class memberships.
     - `promoteStudent(dto: PromoteStudentDto)`: Transactional workflow that marks current enrollment as `COMPLETED` and creates new `ENROLLED` record in destination class.
     - `batchPromoteStudents(dto: BatchPromoteStudentsDto)`: Bulk promotion across semester boundaries.
   - `StudentPaymentService`:
     - `getStudentPaymentSummary(studentOrId: number | Student)`: Dynamically determines remaining unpaid months, partial deposits, and total outstanding balance.
     - `recordPayment(dto: RecordPaymentDto, userId: number)`: Upserts payment record, computes `PAID` / `PARTIAL` / `UNPAID` status, and returns updated summary.
     - `findPayments(studentId: number, query: FindStudentPaymentsDto)`: Lists payment history.

5. **CASL RBAC & Security**:
   - Guarded with `JwtAuthGuard`, `UserTypesGuard([UserTypeEnum.ADMIN, UserTypeEnum.CMS])`, and `CaslAccessGuard`.
   - Permissions: `student:read`, `student:create`, `student:update`, `student:delete`, `academic:manage`, `fee:manage`.
   - Standard `@CurrentUser()` injection for cashier / operator audit trail.

---

### 2.5 Web Frontend (`apps/web`)

1. **Feature Module Architecture (`apps/web/src/features/students`)**:
   ```
   src/features/students/
   ├── components/
   │   ├── student-list-table.tsx       # Main TanStack Table v8 with Infinite Scroll & Payment Filter
   │   ├── student-form.tsx             # Student create/edit form driven by contracts
   │   ├── student-form-dialog.tsx      # Modal dialog wrapper for create/edit
   │   ├── delete-student-dialog.tsx    # Soft-delete confirmation dialog
   │   ├── student-detail-dialog.tsx    # Tabbed overview modal (Tuition, Classes, Profile)
   │   ├── student-payment-tracker.tsx  # Interactive Jan-Dec monthly payment matrix & unpaid ledger
   │   ├── record-payment-dialog.tsx    # Modal for cashier to record month payment
   │   ├── student-promote-dialog.tsx   # Semester class progression modal dialog
   │   ├── class-badge-list.tsx         # Multi-class badges (primary highlighted)
   │   ├── payment-status-badge.tsx     # Green (Paid), Blue (Partial), Amber/Red (Unpaid)
   │   ├── student-list-table.spec.tsx  # Vitest component test
   │   ├── student-form.spec.tsx        # Vitest form validation test
   │   └── index.ts                     # Feature exports
   ├── hooks/
   │   ├── use-students-infinite-query.ts # TanStack Query infinite scroll hook
   │   ├── use-student-summary-query.ts  # Fetches student financial & class breakdown
   │   ├── use-student-mutations.ts      # Create, update, delete, promote mutations
   │   └── use-payment-mutations.ts      # Record payment, batch payments
   └── index.ts                          # Public feature exports
   ```

2. **Interactive UI / UX Highlights**:
   - **Student List Table (`student-list-table.tsx`)**:
     - Columns: Student Code, Student Name, Gender, Enrolled Classes (multi-badges), Fee Status / Remaining Unpaid Months, Enrollment Date, Actions.
     - Search input with 800ms debounce (`useDebounce`) synced with URL parameters (`useUrlFilters`).
     - Filters: Class dropdown, Student Status dropdown, Gender dropdown, and **Payment Status dropdown** (`All Payment Statuses`, `Paid`, `Partial`, `Unpaid`, `Overdue`).
     - Sorting: Clickable column headers with `#45AC5E` arrow indicators for Student Code, Name, Discount, Status, Enrollment Date, and Updated Date.
     - Row action buttons with permission checks (`student:update`, `student:delete`, `academic:manage`, `fee:manage`) rendered in disabled state (`opacity-40 cursor-not-allowed`) if unauthorized.
   - **Dialog & Modal Ergonomics (`dialog.tsx`, `student-detail-dialog.tsx`)**:
     - Click-outside / blur backdrop dismissal.
     - Top-right `X` close button on `DialogContent`.
     - Keyboard <kbd>Escape</kbd> listener.
     - Explicit "Close" button in the dialog footer.
   - **Remaining Unpaid Months & Financial Tracker (`student-payment-tracker.tsx`)**:
     - Visual grid for each month of the academic year.
     - Green card with checkmark for `PAID` months.
     - Blue card for `PARTIAL` months with outstanding amount displayed.
     - Red/Amber card for `UNPAID` / `OVERDUE` months with quick "Pay Month" action button.
     - Summary bar showing `Total Paid: $XXX`, `Remaining Unpaid: X months ($YYY)`.
   - **Multi-Class & Semester Promotion Dialog (`student-promote-dialog.tsx`)**:
     - Displays current class enrollments.
     - Allows selecting next semester / next academic year class.
     - Marks previous enrollment as `COMPLETED` and enrols student in the new target class.

3. **Routing & Navigation**:
   - Registered `/students` route under `AdminLayout`.
   - Added "Students" navigation item to `AdminSidebar` with `GraduationCap` icon, guarded by `can('read', 'student')`.

---

## 3. Tech Design & File Scope

### Target Files:

#### Contracts (`packages/contracts`):
- `packages/contracts/src/student-status.enum.ts` [NEW]
- `packages/contracts/src/payment-status.enum.ts` [NEW]
- `packages/contracts/src/semester.enum.ts` [NEW]
- `packages/contracts/src/student.dto.ts` [NEW]
- `packages/contracts/src/class.dto.ts` [NEW]
- `packages/contracts/src/student-payment.dto.ts` [NEW]
- `packages/contracts/src/user.dto.ts` [MODIFY]
- `packages/contracts/src/route.ts` [MODIFY]
- `packages/contracts/src/index.ts` [MODIFY]

#### Backend API (`apps/api`):
- `apps/api/database/migrations/2026.08.17T00.00.01.create-students-table.ts` [NEW]
- `apps/api/database/migrations/2026.08.17T00.00.02.create-classes-table.ts` [NEW]
- `apps/api/database/migrations/2026.08.17T00.00.03.create-student_classes-table.ts` [NEW]
- `apps/api/database/migrations/2026.08.17T00.00.04.create-student_payments-table.ts` [NEW]
- `apps/api/database/seeds/2026.08.17T00.00.00.student-seeder.ts` [NEW]
- `apps/api/src/student/entity/student.entity.ts` [NEW]
- `apps/api/src/student/entity/class.entity.ts` [NEW]
- `apps/api/src/student/entity/student-class.entity.ts` [NEW]
- `apps/api/src/student/entity/student-payment.entity.ts` [NEW]
- `apps/api/src/student/dto/create-student.dto.ts` [NEW]
- `apps/api/src/student/dto/find-students.dto.ts` [NEW]
- `apps/api/src/student/dto/class.dto.ts` [NEW]
- `apps/api/src/student/dto/student-payment.dto.ts` [NEW]
- `apps/api/src/student/student.service.ts` [NEW]
- `apps/api/src/student/student-payment.service.ts` [NEW]
- `apps/api/src/student/class.service.ts` [NEW]
- `apps/api/src/student/admin.student.controller.ts` [NEW]
- `apps/api/src/student/admin.class.controller.ts` [NEW]
- `apps/api/src/student/student.permission.ts` [NEW]
- `apps/api/src/student/student.module.ts` [NEW]
- `apps/api/src/app.module.ts` [MODIFY]
- `apps/api/test/student.e2e-spec.ts` [NEW]

#### Web Frontend (`apps/web`):
- `apps/web/src/features/students/hooks/use-students-infinite-query.ts` [NEW]
- `apps/web/src/features/students/hooks/use-student-summary-query.ts` [NEW]
- `apps/web/src/features/students/hooks/use-student-mutations.ts` [NEW]
- `apps/web/src/features/students/hooks/use-classes-query.ts` [NEW]
- `apps/web/src/features/students/hooks/use-payment-mutations.ts` [NEW]
- `apps/web/src/features/students/components/student-list-table.tsx` [NEW]
- `apps/web/src/features/students/components/student-form.tsx` [NEW]
- `apps/web/src/features/students/components/student-form-dialog.tsx` [NEW]
- `apps/web/src/features/students/components/delete-student-dialog.tsx` [NEW]
- `apps/web/src/features/students/components/student-detail-dialog.tsx` [NEW]
- `apps/web/src/features/students/components/student-payment-tracker.tsx` [NEW]
- `apps/web/src/features/students/components/record-payment-dialog.tsx` [NEW]
- `apps/web/src/features/students/components/student-promote-dialog.tsx` [NEW]
- `apps/web/src/features/students/components/class-badge-list.tsx` [NEW]
- `apps/web/src/features/students/components/payment-status-badge.tsx` [NEW]
- `apps/web/src/features/students/components/student-list-table.spec.tsx` [NEW]
- `apps/web/src/features/students/components/student-form.spec.tsx` [NEW]
- `apps/web/src/features/students/index.ts` [NEW]
- `apps/web/src/features/admin/components/admin-sidebar.tsx` [MODIFY]
- `apps/web/src/routes/students-page.tsx` [NEW]
- `apps/web/src/routes/router.tsx` [MODIFY]

---

## 4. Acceptance Criteria

### 4.1 Shared Contracts & DTOs
- [x] `@repo/contracts` exports all Zod schemas and inferred DTO types for Students, Classes, Enrollments, and Student Payments.
- [x] `API_ROUTE.STUDENT` and `API_ROUTE.CLASS` endpoint constants are defined and consumed across both API and Web.
- [x] `@repo/contracts` builds cleanly without errors (`pnpm --filter @repo/contracts build`).

### 4.2 Database & Backend API
- [x] Migrations create `students`, `classes`, `student_classes`, and `student_payments` tables with proper indexes and foreign key constraints.
- [x] Umzug seed data created with 14 classes, 12 students, dual enrollments, and payment history using domain enums.
- [x] Full CRUD for students is operational with soft-delete support (`studentRepo.softDelete()`).
- [x] Student can be enrolled in one or multiple classes with distinction for primary/homeroom class.
- [x] Promotion endpoint moves student to the target class for the next semester, setting previous enrollment to `COMPLETED` and new enrollment to `ENROLLED`.
- [x] Payment engine records monthly transactions, handles partial amounts, and calculates live **remaining unpaid months**.
- [x] List endpoint supports filtering by payment status (`PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`).
- [x] Endpoints are guarded with CASL authorization (`student:read`, `student:create`, `student:update`, `student:delete`, `fee:manage`).
- [x] E2E tests pass for student CRUD, multi-class assignment, promotion, and monthly payment tracking (`pnpm --filter api test:e2e`).

### 4.3 Web Frontend & UX
- [x] `StudentListTable` implements infinite scroll (`useInfiniteQuery`), debounced URL search (`useUrlFilters`), class filter, status filter, gender filter, and payment status filter.
- [x] Table headers allow sorting on Student Code, Name, Discount, Status, Enrollment Date, and Updated Date.
- [x] Table renders distinct visual badges for multi-class enrollment and payment status (Green for fully paid, Blue for partial, Red/Amber badge showing exact count of remaining unpaid months).
- [x] Payment Tracker modal displays monthly payment status matrix and allows recording payments for specific months.
- [x] Student Promotion dialog allows promoting a student to the next class/semester.
- [x] Modal dialogs support backdrop click closing, top-right `X` close button, keyboard <kbd>Escape</kbd>, and footer close button.
- [x] Action buttons (Add, Edit, Delete, Pay, Promote) dynamically disable (`opacity-40 cursor-not-allowed`) when user lacks permissions.
- [x] Frontend unit & component tests pass (`pnpm --filter web test`).

### 4.4 Code Quality & Architecture Standards
- [x] Strict adherence to `prefer-early-return` (flat execution flow, guard clauses, no nested else blocks).
- [x] Zero local DTO duplication in frontend or backend (strict compliance with `share-dto-from-contract`).
- [x] Standard shadcn/ui components used across all forms, dialogs, and tables (`prefer-shadcn-ui`).
- [x] Monorepo production build succeeds cleanly (`turbo run build`).
