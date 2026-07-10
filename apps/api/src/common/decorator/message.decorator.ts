import { SetMetadata } from '@nestjs/common';

export const HTTP_MESSAGE_KEY = 'httpMessage';

export const HttpMessage = (message: string) =>
  SetMetadata(HTTP_MESSAGE_KEY, message);
