import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./api-client";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import axios, { AxiosError, type AxiosRequestHeaders } from "axios";

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it("injects Authorization Bearer header when token exists in auth store", async () => {
    useAuthStore.setState({ token: "my-secret-access-token" });

    let capturedHeaders: AxiosRequestHeaders | undefined;
    apiClient.defaults.adapter = async (config) => {
      capturedHeaders = config.headers as AxiosRequestHeaders;
      return {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await apiClient.get("/test-endpoint");
    expect(capturedHeaders?.Authorization).toBe("Bearer my-secret-access-token");
  });

  it("handles 401 response and automatically calls refresh-token endpoint", async () => {
    useAuthStore.setState({
      token: "expired-access-token",
      refreshToken: "valid-refresh-token",
      isAuthenticated: true,
    });

    const axiosPostSpy = vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        data: {
          accessToken: "new-fresh-access-token",
          refreshToken: "new-fresh-refresh-token",
        },
      },
    });

    let callCount = 0;
    apiClient.defaults.adapter = async (config) => {
      callCount++;
      if (callCount === 1) {
        const error = new AxiosError(
          "Request failed with status code 401",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          {
            status: 401,
            statusText: "Unauthorized",
            data: { message: "Unauthorized" },
            headers: {},
            config,
          }
        );
        throw error;
      }

      expect(config.headers?.Authorization).toBe("Bearer new-fresh-access-token");
      return {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const result = await apiClient.get("/protected-route");

    expect(axiosPostSpy).toHaveBeenCalledWith(
      "/api/v1/auth/refresh-token",
      { refreshToken: "valid-refresh-token" },
      expect.anything()
    );
    expect(useAuthStore.getState().token).toBe("new-fresh-access-token");
    expect(useAuthStore.getState().refreshToken).toBe("new-fresh-refresh-token");
    expect(result.data).toEqual({ success: true });
  });

  it("logs out user when token refresh fails", async () => {
    useAuthStore.setState({
      token: "expired-access-token",
      refreshToken: "invalid-refresh-token",
      isAuthenticated: true,
    });

    vi.spyOn(axios, "post").mockRejectedValue(new Error("Invalid refresh token"));

    apiClient.defaults.adapter = async (config) => {
      const error = new AxiosError(
        "Request failed with status code 401",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          status: 401,
          statusText: "Unauthorized",
          data: { message: "Unauthorized" },
          headers: {},
          config,
        }
      );
      throw error;
    };

    await expect(apiClient.get("/protected-route")).rejects.toThrow();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
