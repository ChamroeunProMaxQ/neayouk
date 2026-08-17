import { useQuery } from "@tanstack/react-query";
import {
  API_ROUTE,
  type FindProgramsDto,
  type ProgramAttribute,
  type ResponseDto,
} from "@repo/contracts";
import { apiClient } from "@/shared/lib/api-client";

export function useProgramsQuery(params?: FindProgramsDto) {
  return useQuery<{
    programs: ProgramAttribute[];
    pagination?: { page: number; pageSize: number; totalCount: number; totalPage: number };
  }>({
    queryKey: ["programs", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize ?? 50));

      const url = `${API_ROUTE.PROGRAM.LIST}?${searchParams.toString()}`;
      const response = await apiClient.get<
        ResponseDto<ProgramAttribute[]> | { data: [ProgramAttribute[], number] } | any
      >(url);

      const raw = response.data;
      if (Array.isArray(raw?.data)) {
        // [programs, count] tuple format or paginated array
        if (Array.isArray(raw.data[0])) {
          return {
            programs: raw.data[0],
            pagination: {
              page: params?.page ?? 1,
              pageSize: params?.pageSize ?? 50,
              totalCount: raw.data[1] ?? raw.data[0].length,
              totalPage: Math.ceil((raw.data[1] ?? raw.data[0].length) / (params?.pageSize ?? 50)),
            },
          };
        }
        return {
          programs: raw.data,
          pagination: raw.pagination,
        };
      }

      return {
        programs: [],
        pagination: { page: 1, pageSize: 50, totalCount: 0, totalPage: 1 },
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
