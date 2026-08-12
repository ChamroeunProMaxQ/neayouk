# Tasks: User Avatar Upload

- [ ] **1. Dependencies & Configuration Setup**
  - [ ] Install `@google-cloud/storage` and `sharp` dependencies in `apps/api`.
  - [ ] Add GCP Storage configuration parameters (`GCP_STORAGE_BUCKET`, `GCP_PROJECT_ID`, `GCP_KEY_FILE`) to environment variables and configuration module.

- [ ] **2. Data Contracts & Database Migration**
  - [ ] Add `avatarUrl` field to Zod user schemas in `@repo/contracts`.
  - [ ] Add `avatarUrl` column to User entity in `apps/api/src/user/entity/user.entity.ts`.
  - [ ] Create Umzug migration script for adding `avatarUrl` to `users` table.

- [ ] **3. Storage & Image Processing Service**
  - [ ] Implement `GcpStorageService` for uploading files to GCP bucket.
  - [ ] Implement image processing helper/service using `sharp` to crop images to 1:1 ratio (center-cropped square) and convert/optimize format.

- [ ] **4. User Service & Controller Integration**
  - [ ] Add `uploadAvatar(userId, file)` method in `UserService`.
  - [ ] Add `POST /api/v1/users/me/avatar` endpoint in `UserController` with `FileInterceptor` and validation pipe (`FileInterceptor('avatar')`, `ParseFilePipe` with `MaxFileSizeValidator` 5MB and `FileTypeValidator` `.(jpg|jpeg|png)`).

- [ ] **5. Testing & Verification**
  - [ ] Write unit tests for `GcpStorageService` and image processing logic.
  - [ ] Write e2e tests for avatar upload endpoint (success case, file size limit, invalid file type).
