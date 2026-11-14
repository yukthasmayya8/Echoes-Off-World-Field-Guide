import { describe, expect, it, vi } from 'vitest';
import type { HealthPayload } from '@echoes/shared';
import { ApiRequestError, EchoesApiClient } from './api';

function envelope<T>(data: T): unknown {
  return {
    success: true,
    data,
    meta: { apiVersion: '1.0.0', timestamp: '2026-11-14T00:00:00.000Z' },
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const health: HealthPayload = {
  status: 'ok',
  apiVersion: '1.0.0',
  timestamp: '2026-11-14T00:00:00.000Z',
  uptimeSeconds: 12,
  dataset: { artifacts: 5, verified: 4, needsReview: 1, routes: 2, quizzes: 4 },
};

function makeClient(fetchImpl: typeof fetch, timeoutMs = 1000): EchoesApiClient {
  return new EchoesApiClient({
    baseUrl: 'http://api.test/api/v1',
    timeoutMs,
    fetchImpl,
  });
}

describe('EchoesApiClient', () => {
  it('unwraps the success envelope for health', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(envelope(health)));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await expect(client.getHealth()).resolves.toEqual(health);

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/api/v1/health');
  });

  it('builds catalog search queries with body filters', async () => {
    const payload = {
      query: 'Rocky IV',
      body: 'mars',
      count: 1,
      results: [],
      availableBodies: ['moon', 'mars'],
    };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(envelope(payload)));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.searchCatalog('Rocky IV', { body: 'mars' });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/api/v1/catalog/search');
    expect(url.searchParams.get('q')).toBe('Rocky IV');
    expect(url.searchParams.get('body')).toBe('mars');
  });

  it('serializes every artifact filter', async () => {
    const payload = {
      count: 0,
      filters: { status: 'needs_review', q: 'eagle' },
      artifacts: [],
    };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(envelope(payload)));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.getArtifacts({
      body: 'moon',
      type: 'lunar-module',
      status: 'needs_review',
      q: 'eagle',
    });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/api/v1/artifacts');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      body: 'moon',
      type: 'lunar-module',
      status: 'needs_review',
      q: 'eagle',
    });
  });

  it('encodes artifact, route and quiz slugs', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(envelope({})));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.getArtifactBySlug('apollo-11-eagle');
    await client.getRouteBySlug('moon-what-we-left-behind');
    await client.getQuiz('sojourner');

    const paths = fetchMock.mock.calls.map((call) => new URL(String(call[0])).pathname);
    expect(paths).toEqual([
      '/api/v1/artifacts/apollo-11-eagle',
      '/api/v1/routes/moon-what-we-left-behind',
      '/api/v1/quizzes/sojourner',
    ]);
  });

  it('posts quiz answers with the option and optional question ID', async () => {
    const result = {
      artifactSlug: 'sojourner',
      questionId: 'sojourner-debrief-1',
      optionId: 'ramp',
      correct: true,
      correctOptionId: 'ramp',
      explanation: 'Rolled down a ramp.',
      sourceIds: ['nssdca-mesurpr'],
      sources: [],
      evaluatedBy: 'server',
    };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse(envelope(result)));
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await client.submitQuizAnswer('sojourner', 'ramp', 'sojourner-debrief-1');

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/api/v1/quizzes/sojourner/answer');
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      optionId: 'ramp',
      questionId: 'sojourner-debrief-1',
    });
  });

  it('maps a 404 failure envelope without triggering demo fallback', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'No artifact here.' },
          meta: { apiVersion: '1.0.0', timestamp: '2026-11-14T00:00:00.000Z' },
        },
        404,
      ),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);

    try {
      await client.getArtifactBySlug('missing');
      throw new Error('Expected a 404');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError);
      const apiError = error as ApiRequestError;
      expect(apiError.code).toBe('NOT_FOUND');
      expect(apiError.status).toBe(404);
      expect(apiError.isUnavailable).toBe(false);
    }
  });

  it('maps a network failure to NETWORK_ERROR', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      throw new TypeError('fetch failed');
    });
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await expect(client.getHealth()).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      isUnavailable: true,
    });
  });

  it('aborts a request after the configured timeout', async () => {
    const fetchMock = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch, 5);

    await expect(client.getHealth()).rejects.toMatchObject({
      code: 'REQUEST_TIMEOUT',
      isUnavailable: true,
    });
  });

  it('rejects an invalid JSON response', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response('<html>not json</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await expect(client.getHealth()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      isUnavailable: true,
    });
  });

  it('maps a 500 without a body to SERVER_ERROR', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('', { status: 500 }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);

    await expect(client.getHealth()).rejects.toMatchObject({
      code: 'SERVER_ERROR',
      isUnavailable: true,
    });
  });
});
