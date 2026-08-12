# Tasks: User Avatar Upload

- [x] **1. Dependencies & Configuration Setup**
  - [x] Install `@google-cloud/storage` and `sharp` dependencies in `apps/api`.
  - [x] Add GCP Storage configuration parameters (`GCP_STORAGE_BUCKET`, `GCP_PROJECT_ID`, `GCP_KEY_FILE`) to environment variables and configuration module.

- [x] **2. Data Contracts & Database Migration**
  - [x] Add `avatarUrl` field to Zod user schemas in `@repo/contracts`.
  - [x] Add `avatarUrl` column to User entity in `apps/api/src/user/entity/user.entity.ts`.
  - [x] Create Umzug migration script for adding `avatarUrl` to `users` table.

- [x] **3. Storage & Image Processing Service**
  - [x] Implement `GcpStorageService` for uploading files to GCP bucket.
  - [x] Implement image processing helper/service using `sharp` to crop images to 1:1 ratio (center-cropped square) and convert/optimize format.

- [x] **4. User Service & Controller Integration**
  - [x] Add `uploadAvatar(userId, file)` method in `UserService`.
  - [x] Add `POST /api/v1/users/me/avatar` endpoint in `UserController` with `FileInterceptor` and validation pipe (`FileInterceptor('avatar')`, `ParseFilePipe` with `MaxFileSizeValidator` 5MB and `FileTypeValidator` `.(jpg|jpeg|png)`).

- [x] **5. Testing & Verification**
  - [x] Write unit tests for `GcpStorageService` and image processing logic.
  - [x] Write unit tests for avatar upload endpoint and service logic.
