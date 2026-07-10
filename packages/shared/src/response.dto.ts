export class PaginationResponseDto {
  page: number;
  pageSize: number;
  totalPage: number;
  totalCount: number;

  constructor(page: number, pageSize: number, count: number) {
    this.page = page;
    this.pageSize = pageSize;
    this.totalCount = count;
    this.totalPage = Math.ceil(count / pageSize);
  }
}

export class ResponseDto<T> {
  status: number;
  message: string;
  data?: T;
  pagination?: PaginationResponseDto;

  constructor(
    status: number,
    message: string,
    data?: T,
    pagination?: PaginationResponseDto,
  ) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.pagination = pagination ? pagination : undefined;
  }
}
