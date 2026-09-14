import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class UploadLogoDto {
  @IsFile()
  @MaxFileSize(2 * 1024 * 1024)
  @HasMimeType([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp',
  ])
  logo!: MemoryStoredFile;
}
