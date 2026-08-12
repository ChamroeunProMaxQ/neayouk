interface PaginationParams {
    page: number;
    pageSize: number;
}

export function getSkipLimit({ page, pageSize }: PaginationParams) {
    const skip = pageSize * (page - 1);
    return { skip, take: pageSize };
}