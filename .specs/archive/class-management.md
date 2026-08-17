# Feature Spec: Class Management, Student Headcount, Academic Programs, Terms & Timetable Scheduling

## 1. Goal & Context
Build an end-to-end **Class Management, Student Headcount, Academic Programs, Terms, Progression & Timetable Scheduling System** across shared contracts (`packages/contracts`), backend API (`apps/api`), and frontend admin web (`apps/web`).

This feature empowers school administrators, academic directors, and teachers to:
1. **Manage Class Lifecycles (CRUD)**: Create, configure, list, search, filter, update, and soft-delete academic classes with program categories/IDs, sections, assigned teachers, and tuition fees.
2. **Configure Class Ranges & Windows ("From Which to Which")**:
   - **Academic Term Date Range**: Term/Semester duration (`startDate` to `endDate`, e.g., *01-Sep-2025 to 30-Jun-2026*).
   - **Daily Schedule Window & Shifts**: Shift configuration (`startTime` to `endTime`, e.g., *Morning 07:30 - 11:30*, *Afternoon 13:30 - 17:30*, *Evening 17:45 - 20:45*).
   - **Grade Level / Section / Room**: Grade level (e.g. *Grade 1*, *Grade 7*, *Kindergarten K1*, *ESL Level 1*), section identifiers (*A*, *B*), and physical classrooms/rooms.
3. **Track Live Student Enrollment Headcount**:
   - Monitor real-time enrolled student count (`studentCount`) for each class.
   - Display student count badge/indicator (e.g., `18 Students`).
   - View full enrolled student rosters per class with student IDs, Khmer/English names, gender, enrollment dates, and status.
4. **Organize by Academic Years, Terms / Semesters & Programs**:
   - Structure classes across academic years (e.g. `2025-2026`, `2026-2027`) and flexible academic terms/semesters (`SEMESTER_1`, `SEMESTER_2`, `TERM_1`, `TERM_2`, `TERM_3`, `TERM_4`, `SUMMER`).
   - Associate classes with structured **Academic Programs** (e.g., *Kindergarten (EYFS)*, *Primary School (Cambridge)*, *Secondary School*, *General English Program (GEP)*).
   - View high-level metrics via the **Academic Years Hub** (`/academics/academic-years`).
5. **Interactive Weekly Class Timetable & Schedule Manager**:
   - Configure weekly schedule slots by day of week (`MONDAY`–`SUNDAY`), time range (`startTime` to `endTime`), `subject`, `room`, and assigned `teacher`.
   - Visual weekly timetable matrix/grid view (`ClassTimetableGrid`) and full-screen Timetable Hub view (`/academics/timetable`).
   - Real-time time conflict detection (prevents overlapping classes for the same room or teacher).
6. **Class & Cohort Promotion / Progression**:
   - Transition cohorts and batch promote students from completed classes to next-level classes/terms with enrollment status tracking (`PromoteClassDialog`).

---

## 2. Requirements & Domain Modeling

### 2.1 Database Entities

#### 1. `classes` Table *(Academic Module)*
*Represents an academic class / section with schedule window, term date ranges, assigned room & shift, program association, and student count.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Description & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique system UUID |
| `name` | `VARCHAR(255)` | NO | NULL | `name: string` | Display name (e.g. "Primary - Grade 1A") |
| `code` | `VARCHAR(50)` | YES | NULL | `code?: string` | Short code (e.g. `G1-A`, `ESL-101`) |
| `grade_level` | `VARCHAR(50)` | YES | NULL | `gradeLevel?: string` | Grade level (e.g. `K1`, `1`, `7`, `ESL`) |
| `program_id` | `INT` | YES | NULL | `programId?: number` | FK $\rightarrow$ `programs.id` (ON DELETE SET NULL) |
| `program` | `VARCHAR(255)` | YES | NULL | `program?: string` | Legacy / snapshot program name string |
| `section` | `VARCHAR(255)` | YES | NULL | `section?: string` | Section identifier (e.g. `A`, `B`, `Room 101`) |
| `room` | `VARCHAR(100)` | YES | NULL | `room?: string` | Homeroom / Classroom location (e.g. `Building A - Room 204`) |
| `shift` | `VARCHAR(50)` | YES | 'MORNING' | `shift?: ShiftEnum` | `MORNING`, `AFTERNOON`, `EVENING`, `FULL_DAY`, `WEEKEND` |
| `start_time` | `VARCHAR(10)` | YES | '07:30' | `startTime?: string` | Class daily start time (e.g. `07:30`) |
| `end_time` | `VARCHAR(10)` | YES | '11:30' | `endTime?: string` | Class daily end time (e.g. `11:30`) |
| `start_date` | `DATE` | YES | NULL | `startDate?: string \| Date` | Academic term start date (e.g. `2025-09-01`) |
| `end_date` | `DATE` | YES | NULL | `endDate?: string \| Date` | Academic term end date (e.g. `2026-06-30`) |
| `monthly_fee` | `DECIMAL(10,2)` | NO | 0.00 | `monthlyFee: number` | Base monthly tuition fee |
| `teacher_id` | `BIGINT UNSIGNED`| YES | NULL | `teacherId?: number` | Primary homeroom teacher FK $\rightarrow$ `users.id` |
| `academic_year` | `VARCHAR(20)` | YES | '2025-2026' | `academicYear?: string` | Academic year (e.g. `2025-2026`) |
| `semester` | `VARCHAR(26)` | YES | 'SEMESTER_1' | `semester?: SemesterEnum` | `SEMESTER_1`, `SEMESTER_2`, `TERM_1`, `TERM_2`, `TERM_3`, `TERM_4`, `SUMMER` |
| `status` | `VARCHAR(26)` | NO | 'ACTIVE' | `status: string` | `ACTIVE`, `INACTIVE`, `ARCHIVED`, `COMPLETED` |
| `created_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `createdAt?: Date` | Creation timestamp |
| `updated_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `updatedAt?: Date` | Update timestamp |
| `deleted_at` | `DATETIME` | YES | NULL | `deletedAt?: Date \| null` | Soft-delete timestamp |

---

#### 2. `class_timetables` Table
*Stores individual weekly subject schedule slots for a class.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Description & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique schedule slot UUID |
| `class_id` | `INT` | NO | NULL | `classId: number` | FK $\rightarrow$ `classes.id` (CASCADE on delete) |
| `day_of_week` | `VARCHAR(20)` | NO | 'MONDAY' | `dayOfWeek: DayOfWeekEnum` | `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY` |
| `subject` | `VARCHAR(255)` | NO | NULL | `subject: string` | Subject name (e.g. `Mathematics`, `Khmer`, `English`, `Science`, `Physics`) |
| `subject_code` | `VARCHAR(50)` | YES | NULL | `subjectCode?: string` | Short code (e.g. `MATH-101`, `ENG-ESL`) |
| `teacher_id` | `BIGINT UNSIGNED`| YES | NULL | `teacherId?: number` | Subject teacher FK $\rightarrow$ `users.id` |
| `teacher_name` | `VARCHAR(255)` | YES | NULL | `teacherName?: string` | Optional snapshot or external teacher name |
| `room` | `VARCHAR(100)` | YES | NULL | `room?: string` | Specific classroom or lab (e.g. `Room 101`, `Science Lab`) |
| `start_time` | `VARCHAR(10)` | NO | '08:00' | `startTime: string` | Slot start time (`HH:mm`, e.g. `08:00`) |
| `end_time` | `VARCHAR(10)` | NO | '09:30' | `endTime: string` | Slot end time (`HH:mm`, e.g. `09:30`) |
| `color_tag` | `VARCHAR(50)` | YES | '#45AC5E' | `colorTag?: string` | Color identifier for visual calendar rendering |
| `notes` | `TEXT` | YES | NULL | `notes?: string` | Additional schedule remarks or instructions |
| `created_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `createdAt?: Date` | Creation timestamp |
| `updated_at` | `DATETIME` | YES | CURRENT_TIMESTAMP | `updatedAt?: Date` | Update timestamp |

---

#### 3. `programs` Table
*Defines distinct academic curricula and grade structures.*

| Database Column (`snake_case`) | Type | Nullable | Default | TypeScript Property (`camelCase`) | Description & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | AUTO_INCREMENT | `id: number` | Primary key |
| `uuid` | `VARCHAR(36)` | NO | (UUIDv4) | `uuid: string` | Unique program UUID |
| `name` | `VARCHAR(255)` | NO | NULL | `name: string` | Program title (e.g. `Cambridge Primary`) |
| `code` | `VARCHAR(50)` | NO | NULL | `code: string` | Unique identifier code (e.g. `PRI-CAM`) |
| `books` | `JSON` | YES | `[]` | `books: string[]` | Textbooks and curriculum materials |
| `grade_levels` | `JSON` | YES | `[]` | `gradeLevels: string[]` | List of applicable grades (e.g. `["G1", "G2", "G3"]`) |
| `status` | `VARCHAR(26)` | NO | 'ACTIVE' | `status: "ACTIVE" \| "INACTIVE"` | Program active status |

---

### 2.2 Shared Contracts (`@repo/contracts`)

1. **Enums (`packages/contracts/src/semester.enum.ts` & `packages/contracts/src/class.dto.ts`)**:
   - `SemesterEnum`: `SEMESTER_1`, `SEMESTER_2`, `TERM_1`, `TERM_2`, `TERM_3`, `TERM_4`, `SUMMER`
   - `ShiftEnum`: `MORNING`, `AFTERNOON`, `EVENING`, `FULL_DAY`, `WEEKEND`
   - `DayOfWeekEnum`: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
   - `ClassEnrollmentStatusEnum`: `ENROLLED`, `COMPLETED`, `DROPPED`, `TRANSFERRED`

2. **DTO Schemas (`packages/contracts/src/class.dto.ts`)**:
   - `ClassSchema`: Complete class model schema including `room`, `shift`, `startTime`, `endTime`, `startDate`, `endDate`, `programId`, `programName`, `studentCount`.
   - `CreateClassSchema`: Payload with refine validation ensuring `endTime > startTime` and `endDate >= startDate`.
   - `UpdateClassSchema`: Partial payload with range validations.
   - `FindClassesSchema`: Filter & pagination schema (`search`, `academicYear`, `semester`, `shift`, `gradeLevel`, `programId`, `status`, `sortBy`, `sortOrder`, `page`, `pageSize`).
   - `ClassTimetableSchema`: Timetable slot schema.
   - `CreateClassTimetableSchema` / `UpdateClassTimetableSchema`: Timetable slot creation and modification payloads.
   - `PromoteStudentSchema` / `BatchPromoteStudentsSchema`: Cohort promotion payloads.
   - `AcademicYearSummaryItemSchema`: Academic year aggregate statistics schema.

3. **API Route Constants (`packages/contracts/src/route.ts`)**:
   - `CLASS`:
     - `LIST`: `/api/v1/admin/classes`
     - `CREATE`: `/api/v1/admin/classes`
     - `GET`: `/api/v1/admin/classes/:id`
     - `UPDATE`: `/api/v1/admin/classes/:id`
     - `DELETE`: `/api/v1/admin/classes/:id`
     - `STUDENTS`: `/api/v1/admin/classes/:id/students`
     - `TIMETABLE`: `/api/v1/admin/classes/:id/timetable`
     - `CREATE_TIMETABLE`: `/api/v1/admin/classes/:id/timetable`
     - `UPDATE_TIMETABLE`: `/api/v1/admin/classes/timetable/:slotId`
     - `DELETE_TIMETABLE`: `/api/v1/admin/classes/timetable/:slotId`
     - `ACADEMIC_YEARS_SUMMARY`: `/api/v1/admin/classes/academic-years-summary`
     - `BATCH_PROMOTE`: `/api/v1/admin/classes/batch-promote`
   - `PROGRAM`:
     - `LIST`: `/api/v1/admin/programs`
     - `CREATE`: `/api/v1/admin/programs`
     - `GET`: `/api/v1/admin/programs/:id`
     - `UPDATE`: `/api/v1/admin/programs/:id`
     - `DELETE`: `/api/v1/admin/programs/:id`

---

### 2.3 Backend API Architecture (`apps/api`)

1. **Database Migrations (`apps/api/database/migrations`)**:
   - `2026.08.17T00.00.02.create-classes-table.ts`: Core classes table.
   - `2026.08.17T01.00.01.add-class-config-columns.ts`: Adds `room`, `shift`, `start_time`, `end_time`, `start_date`, `end_date`.
   - `2026.08.17T01.00.02.create-class_timetables-table.ts`: Creates `class_timetables` table with foreign keys & indexes.
   - `2026.08.17T02.00.01.create-programs-table.ts`: Creates `programs` table.
   - `2026.08.17T02.00.02.add-program_id-to-classes.ts`: Relates `classes.program_id` to `programs.id`.

2. **Data Seeders (`apps/api/database/seeds`)**:
   - `2026.08.17T01.00.00.class-timetable-seeder.ts`: Realistic weekly schedules across Kindergarten, Primary, Secondary, and Language classes.
   - `2026.08.17T02.00.00.program-seeder.ts`: Standard curricula (EYFS, Cambridge Primary, Secondary, GEP).

3. **Academic Module (`apps/api/src/academic/`)**:
   - `AcademicModule`: Encapsulates classes, timetables, and programs.
   - `ClassEntity` & `ClassTimetableEntity` & `ProgramEntity`: TypeORM entity mappings with JSON serializers.
   - `AdminClassController`: Endpoints for class lifecycle, timetable slot management, student rosters, academic year metrics, and batch promotions.
   - `ClassService`:
     - Dynamic query builder for multi-field filtering and active enrollment counts (`studentCount`).
     - Conflict detection engine: `checkTimetableConflict()` preventing overlapping teacher and room schedules.
     - Promotion engine: `batchPromoteStudents()` handling atomic status transitions and new class enrollments.
   - `AcademicPermission`: CASL ability rules for `academic` resource management.

---

### 2.4 Frontend Architecture (`apps/web`)

1. **Routes (`apps/web/src/routes/`)**:
   - `/academics/classes` $\rightarrow$ `ClassesPage` (Class Directory, Filters, Detail, Form, Delete)
   - `/academics/academic-years` $\rightarrow$ `AcademicYearsPage` (Academic Term & Year Distribution Hub)
   - `/academics/programs` $\rightarrow$ `ProgramsPage` (Program & Curriculum Catalog)
   - `/academics/timetable` $\rightarrow$ `TimetablePage` (Master Weekly Timetable Matrix)

2. **Classes Feature Components (`apps/web/src/features/classes/components/`)**:
   - **`class-list-table.tsx`**: Infinite-scroll data table with URL sync (`useUrlFilters`), search with debounce, shift and semester badges, live student headcount pill, and action menus.
   - **`class-form-dialog.tsx`**: Modal for creating and editing classes with program selection, shift configuration, time and date range validations, fee inputs, and teacher assignment.
   - **`class-detail-dialog.tsx`**: Rich 3-tab modal dialog (Overview & Config, Enrolled Students Roster with real-time filtering, and Weekly Timetable grid) with safe null/undefined prop handling.
   - **`class-timetable-grid.tsx`**: Matrix grid mapping days (Monday–Sunday) to time blocks with color-coded subject cards and slot actions.
   - **`timetable-slot-dialog.tsx`**: Slot editor for subject, teacher, room, time range, and color tags.
   - **`promote-class-dialog.tsx`**: Class cohort promotion modal enabling bulk selection of enrolled students to advance into a new class and academic session.
   - **`academic-years-view.tsx`**: Card and breakdown metrics showing total classes and student counts per academic year/semester.
   - **`timetable-hub-view.tsx`**: Dedicated view for browsing and managing timetables across all classes.
   - **`delete-class-dialog.tsx`**: Safe confirmation modal alerting users when deleting a class with active enrollments.

3. **Custom Hooks (`apps/web/src/features/classes/hooks/`)**:
   - `use-classes-infinite-query.ts`: TanStack Infinite Query for paginated class directory with filter caching.
   - `use-class-mutations.ts`: Mutations for creating, updating, deleting classes and batch student promotion.
   - `use-class-timetable-query.ts`: Queries and mutations for class timetable slots.
   - `use-class-students-query.ts`: Queries for fetching active students in a class.

---

## 3. Test Coverage & Verification

### 3.1 Backend Test Results (`class.service.spec.ts` & `program.service.spec.ts`)
- **11 / 11 unit tests passed** in `src/academic/class.service.spec.ts`:
  - Happy path creation and retrieval with calculated `studentCount`.
  - Filter queries by academic year, semester, shift, and search keywords.
  - Timetable slot creation and weekly schedule ordering.
  - Conflict detection for overlapping rooms and teachers (409 Conflict).
  - Validation failures for `endTime <= startTime` and `endDate <= startDate`.
  - Batch student promotion and enrollment status transitions.
- **11 / 11 unit tests passed** in `src/academic/program.service.spec.ts`.

### 3.2 Frontend Test Results (`class-list-table.spec.tsx`)
- **4 / 4 component tests passed**:
  - Renders class rows with correct badges and headcount pills.
  - Debounced search query triggers API refetch with updated parameters.
  - Dropdown filters update query parameters.
  - Action buttons open view, edit, and timetable modals.
- **TypeScript & Linting**: 0 errors, 0 warnings across all `apps/web/src/features/classes/` components.

---

## 4. Feature Status: COMPLETED
All deliverables outlined in this specification—including shared contracts, backend migrations, seeds, academic entity services, conflict checking, frontend infinite scroll tables, detail rosters, visual timetable matrix, cohort promotion, and test suites—are implemented, verified, and active in the repository.
