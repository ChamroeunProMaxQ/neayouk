import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from "axios";
import { API_ROUTE, type LogInResponseDto, type ResponseDto } from "@repo/contracts";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

// Queue item definition for pending requests during token refresh
interface FailedRequestQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequestQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
      continue;
    }
    if (token) {
      prom.resolve(token);
    }
  }

  failedQueue = [];
};

function extractErrorMessage(error: AxiosError<ApiErrorResponse>): void {
  const responseData = error.response?.data;
  if (!responseData) return;

  if (typeof responseData.message === "string") {
    error.message = responseData.message;
    return;
  }

  if (Array.isArray(responseData.message) && responseData.message.length > 0) {
    error.message = responseData.message.join(", ");
    return;
  }

  if (typeof responseData.error === "string") {
    error.message = responseData.error;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Automatically inject Authorization token header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized errors and automatically perform token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      extractErrorMessage(error);
      return Promise.reject(error);
    }

    const isRefreshCandidate =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== API_ROUTE.AUTH.REFRESH_TOKEN;

    // Guard Clause: If not a refresh candidate, extract error message and reject early
    if (!isRefreshCandidate) {
      extractErrorMessage(error);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If a refresh is already in progress, wait until completed
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      extractErrorMessage(error);
      return Promise.reject(error);
    }

    try {
      // Direct axios post call to avoid recursive interceptor invocation
      const response = await axios.post<ResponseDto<LogInResponseDto>>(
        API_ROUTE.AUTH.REFRESH_TOKEN,
        { refreshToken },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const newTokens = response.data?.data;
      if (!newTokens?.accessToken) {
        throw new Error("Token refresh response missing access token.");
      }

      useAuthStore.getState().setTokens({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken || refreshToken,
      });

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      }

      processQueue(null, newTokens.accessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
