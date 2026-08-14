interface PaginationParams {
    page?: number;
    pageSize?: number;
}

export function getSkipTake({ page = 1, pageSize = 10 }: PaginationParams) {
    const skip = pageSize * (page - 1);
    return { skip, take: pageSize };
}