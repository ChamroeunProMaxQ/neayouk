import { useMutation } from "@tanstack/react-query";
import {
  API_ROUTE,
  type LogInDto,
  type LogInResponseDto,
  type ResponseDto,
} from "@repo/contracts";
import { useAuthStore, type AuthUser } from "../stores/use-auth-store";

export interface LoginResult {
  tokens: LogInResponseDto;
  profile?: AuthUser;
}

export function useLoginMutation() {
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation<LoginResult, Error, LogInDto>({
    mutationFn: async (credentials: LogInDto): Promise<LoginResult> => {
      const response = await fetch(API_ROUTE.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message || "Invalid username or password";
        throw new Error(errorMessage);
      }

      const resJson = (await response.json()) as ResponseDto<LogInResponseDto>;
      const tokens = resJson.data;

      if (!tokens?.accessToken) {
        throw new Error("Authentication failed: Access token missing.");
      }

      let profile: AuthUser | undefined;
      try {
        const profileRes = await fetch(API_ROUTE.AUTH.PROFILE, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        if (profileRes.ok) {
          const profileJson = (await profileRes.json()) as ResponseDto<AuthUser>;
          profile = profileJson.data;
        }
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

