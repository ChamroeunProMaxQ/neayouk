# Feature Spec: User Avatar Upload

## 1. Goal & Context
Provide a secure and efficient mechanism for users to upload and update their profile avatar image. The feature validates uploaded files, automatically crops images to a square (1:1 ratio), stores them in Google Cloud Storage (GCS), and persists the accessible image URL in the PostgreSQL user profile record.

## 2. Requirements & Boundaries
- [ ] **File Validation**: Restrict uploads strictly to `image/jpeg` and `image/png` MIME types with a maximum file size of 5MB.
- [ ] **Image Processing**: Automatically crop and resize uploaded images to a 1:1 aspect ratio before storing.
- [ ] **Cloud Storage Integration**: Upload processed avatar images to a Google Cloud Storage (GCP) bucket with appropriate object naming/versioning.
- [ ] **Database Persistence**: Update the authenticated user's profile record in PostgreSQL with the new avatar URL.
- [ ] **API Endpoint**: Expose an authenticated endpoint (e.g. `POST /api/v1/users/me/avatar` or `PATCH /api/v1/users/me/avatar`) accepting `multipart/form-data`.

## 3. Tech Design & File Scope
- Target Files:
  - `@src/user/user.controller.ts.js`
  - `@src/user/user.service.ts.js`
  - `@src/user/entity/user.entity.ts.js`
  - `@src/common/storage/gcp-storage.service.ts.js`
  - `packages/contracts/src/user.dto.ts`
- New Dependencies:
  - `@google-cloud/storage` (GCP Bucket client)
  - `sharp` (Image auto-cropping & processing)
  - `@types/multer` (File upload typing)

## 4. Acceptance Criteria
- [ ] Uploading non-JPG/PNG files or files exceeding 5MB returns a `400 Bad Request` with clear validation error messages.
- [ ] Valid image uploads are auto-cropped to a 1:1 aspect ratio.
- [ ] Images are successfully stored in GCP Bucket and return a public/accessible URL.
- [ ] User's `avatarUrl` field in the database is updated with the new storage URL.
- [ ] Unit tests pass via `pnpm test`
- [ ] API integration tests pass for valid and invalid file uploads.
