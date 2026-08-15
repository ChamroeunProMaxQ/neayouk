import { useMutation } from "@tanstack/react-query";
import {
  API_ROUTE,
  type LogInDto,
  type LogInResponseDto,
  type ResponseDto,
} from "@repo/contracts";
import { useAuthStore, type AuthUser } from "../stores/use-auth-store";
import { apiClient } from "@/shared/lib/api-client";

export interface LoginResult {
  tokens: LogInResponseDto;
  profile?: AuthUser;
}

export function useLoginMutation() {
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation<LoginResult, Error, LogInDto>({
    mutationFn: async (credentials: LogInDto): Promise<LoginResult> => {
      let resJson: ResponseDto<LogInResponseDto>;
      try {
        const response = await apiClient.post<ResponseDto<LogInResponseDto>>(
          API_ROUTE.AUTH.LOGIN,
          credentials
        );
        resJson = response.data;
      } catch (err: unknown) {
        const message =
          (err as { message?: string }).message || "Invalid username or password";
        throw new Error(message);
      }

      const tokens = resJson.data;

      if (!tokens?.accessToken) {
        throw new Error("Authentication failed: Access token missing.");
      }

      let profile: AuthUser | undefined;
      try {
        const profileRes = await apiClient.get<ResponseDto<AuthUser>>(
          API_ROUTE.AUTH.PROFILE,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );
        profile = profileRes.data.data;
      } catch {
        // Fallback to credentials username if profile fetch fails
      }

      if (!profile) {
        profile = { username: credentials.username };
      }

      return { tokens, profile };
    },
    onSuccess: (data) => {
      setTokens({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      });
      if (data.profile) {
        setUser(data.profile);
      }
    },
  });
}

