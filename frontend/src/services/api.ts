/**
 * The only network client in the frontend.
 *
 * Feature components must never call `fetch` directly — they receive data as
 * props from the parent application, which uses this client through
 * `artifactService`.
 */
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_API_TIMEOUT_MS,
  type ApiErrorDetail,
  type Artifact,
  type ArtifactFilters,
  type ArtifactListResult,
  type Body,
  type CatalogSearchResult,
  type GuidedRoute,
  type GuidedRouteListResult,
  type HealthPayload,
  type Quiz,
  type QuizAnswerResult,
} from '@echoes/shared';

export type ApiRequestErrorCode =
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'SERVER_ERROR'
  | 'HTTP_ERROR';

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: ApiErrorDetail[];
  readonly originalError?: unknown;

  constructor(
    code: string,
    message: string,
    options: { status?: number; details?: ApiErrorDetail[]; originalError?: unknown } = {},
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.originalError = options.originalError;
  }

  /**
   * True when the API cannot serve the request at all, so the demo dataset can
   * be used. A 404 or a validation error is a real answer, not an outage.
   */
  get isUnavailable(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'REQUEST_TIMEOUT' ||
      this.code === 'SERVER_ERROR' ||
      this.code === 'INVALID_RESPONSE'
    );
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface CatalogFilters {
  body?: Body;
}

type QueryValue = string | number | boolean | undefined;

function readBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;
  return value && value.trim().length > 0 ? value.trim() : DEFAULT_API_BASE_URL;
}

function readTimeoutMs(): number {
  const parsed = Number(import.meta.env.VITE_API_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_API_TIMEOUT_MS;
}

function browserOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
}

interface FailureEnvelope {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
}

export class EchoesApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? readBaseUrl()).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? readTimeoutMs();
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  private buildUrl(path: string, query?: Record<string, QueryValue>): URL {
    const target = path.startsWith('/') ? path : `/${path}`;
    const base = /^https?:\/\//.test(this.baseUrl)
      ? this.baseUrl
      : `${browserOrigin()}${this.baseUrl}`;
    const url = new URL(`${base}${target}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === '') continue;
      url.searchParams.set(key, String(value));
    }

    return url;
  }

  private async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST';
      query?: Record<string, QueryValue>;
      body?: unknown;
    } = {},
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = { Accept: 'application/json' };
    const init: RequestInit = {
      method: options.method ?? 'GET',
      headers,
      signal: controller.signal,
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    try {
      const response = await this.fetchImpl(url.toString(), init);
      const raw = await response.text();

      let payload: unknown;
      if (raw.length > 0) {
        try {
          payload = JSON.parse(raw);
        } catch {
          throw new ApiRequestError(
            'INVALID_RESPONSE',
            'The Echoes API returned a response that was not valid JSON.',
            { status: response.status },
          );
        }
      }

      if (!response.ok) {
        const failure = (payload ?? {}) as FailureEnvelope;
        const fallbackCode = response.status >= 500 ? 'SERVER_ERROR' : 'HTTP_ERROR';
        throw new ApiRequestError(
          failure.error?.code ?? fallbackCode,
          failure.error?.message ?? `The Echoes API responded with HTTP ${response.status}.`,
          { status: response.status, details: failure.error?.details },
        );
      }

      if (
        !payload ||
        typeof payload !== 'object' ||
        (payload as { success?: unknown }).success !== true ||
        !('data' in payload)
      ) {
        throw new ApiRequestError(
          'INVALID_RESPONSE',
          'The Echoes API response did not use the expected success envelope.',
          { status: response.status },
        );
      }

      return (payload as { data: T }).data;
    } catch (error) {
      if (error instanceof ApiRequestError) throw error;

      if (controller.signal.aborted) {
        throw new ApiRequestError(
          'REQUEST_TIMEOUT',
          `The Echoes API did not respond within ${this.timeoutMs} ms.`,
          { originalError: error },
        );
      }

      throw new ApiRequestError(
        'NETWORK_ERROR',
        'Could not reach the Echoes API. The verified local archive dataset is available.',
        { originalError: error },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  getHealth(): Promise<HealthPayload> {
    return this.request<HealthPayload>('/health');
  }

  searchCatalog(query = '', filters: CatalogFilters = {}): Promise<CatalogSearchResult> {
    return this.request<CatalogSearchResult>('/catalog/search', {
      query: { q: query, body: filters.body },
    });
  }

  getArtifacts(filters: ArtifactFilters = {}): Promise<ArtifactListResult> {
    return this.request<ArtifactListResult>('/artifacts', {
      query: {
        body: filters.body,
        type: filters.type,
        status: filters.status,
        q: filters.q,
      },
    });
  }

  getArtifactBySlug(slug: string): Promise<Artifact> {
    return this.request<Artifact>(`/artifacts/${encodeURIComponent(slug)}`);
  }

  getRoutes(): Promise<GuidedRouteListResult> {
    return this.request<GuidedRouteListResult>('/routes');
  }

  getRouteBySlug(slug: string): Promise<GuidedRoute> {
    return this.request<GuidedRoute>(`/routes/${encodeURIComponent(slug)}`);
  }

  getQuiz(artifactSlug: string): Promise<Quiz> {
    return this.request<Quiz>(`/quizzes/${encodeURIComponent(artifactSlug)}`);
  }

  submitQuizAnswer(
    artifactSlug: string,
    optionId: string,
    questionId?: string,
  ): Promise<QuizAnswerResult> {
    return this.request<QuizAnswerResult>(
      `/quizzes/${encodeURIComponent(artifactSlug)}/answer`,
      {
        method: 'POST',
        body: {
          optionId,
          ...(questionId ? { questionId } : {}),
        },
      },
    );
  }
}

/** Shared singleton used by the application layer. */
export const apiClient = new EchoesApiClient();
