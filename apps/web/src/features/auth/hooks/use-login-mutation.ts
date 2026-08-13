import { useMutation } from "@tanstack/react-query";
import {
  API_ROUTE,
  type LogInDto,
  type ResponseDto,
  type UserDto,
} from "@repo/contracts";
import { useAuthStore } from "../stores/use-auth-store";

export function useLoginMutation() {
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation<ResponseDto<UserDto>, Error, LogInDto>({
    mutationFn: async (credentials: LogInDto) => {
      const response = await fetch(API_ROUTE.USER.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      return (await response.json()) as ResponseDto<UserDto>;
    },
    onSuccess: (data) => {
      if (data.data) {
        setUser(data.data);
        setToken("mock-jwt-token");
      }
    },
  });
}
