/**
 * VCDS™ Safe Fetch — wraps all API calls with:
 *  - Automatic error handling (no unhandled rejections)
 *  - Request timeout (10s default)
 *  - JWT token injection from SecureStore
 *  - Response body size limit (5MB)
 *  - Sentry error capture on failure
 */
import * as Sentry from "@sentry/react-native";
import { secureGet } from "./secureStorage";

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_BODY_SIZE = 5 * 1024 * 1024;

export interface SafeFetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function safeFetch<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<SafeFetchResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = await secureGet("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const text = await response.text();
    if (text.length > MAX_BODY_SIZE) {
      return { data: null, error: "Response too large", status: response.status };
    }

    let data: T | null = null;
    try { data = JSON.parse(text); } catch { data = text as unknown as T; }

    if (!response.ok) {
      const msg = (data as any)?.message ?? `HTTP ${response.status}`;
      Sentry.captureMessage(`API Error: ${url} → ${response.status} ${msg}`, "warning");
      return { data: null, error: msg, status: response.status };
    }

    return { data, error: null, status: response.status };
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Request timed out" : (err?.message ?? "Network error");
    Sentry.captureException(err, { extra: { url } });
    return { data: null, error: msg, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}
