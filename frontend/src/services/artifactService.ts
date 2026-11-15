/**
 * Application-facing data gateway.
 *
 * Every feature receives already-loaded data from the parent application, so
 * this module is the only place that decides between the live API and the
 * verified local demo dataset. A fallback is always surfaced to the UI.
 */
import type {
  Artifact,
  ArtifactFilters,
  ArtifactListResult,
  Body,
  CatalogSearchResult,
  DataSource,
  GuidedRoute,
  GuidedRouteListResult,
  HealthPayload,
  Quiz,
  QuizAnswerResult,
  Sourced,
} from '@echoes/shared';
import { ApiRequestError, apiClient, type EchoesApiClient } from './api';
import {
  evaluateLocalQuizAnswer,
  getLocalArtifactBySlug,
  getLocalQuiz,
  getLocalRouteBySlug,
  getLocalRoutes,
  listLocalArtifacts,
  LocalQuizError,
  searchLocalCatalog,
} from './localFallback';

export class ArtifactService {
  private source: DataSource = 'api';

  constructor(private readonly client: EchoesApiClient = apiClient) {}

  get currentSource(): DataSource {
    return this.source;
  }

  private apiResult<T>(data: T): Sourced<T> {
    this.source = 'api';
    return { data, source: 'api' };
  }

  private fallback<T>(
    operation: string,
    error: unknown,
    loadLocal: () => T,
  ): Sourced<T> {
    if (error instanceof ApiRequestError && error.isUnavailable) {
      const notice =
        `Using the verified local archive while the live connection is unavailable (${operation}). ` +
        'All shown records are verified; records under editorial review stay hidden.';
      this.source = 'demo';
      return { data: loadLocal(), source: 'demo', notice };
    }
    throw error;
  }

  async getHealth(): Promise<Sourced<HealthPayload | null>> {
    try {
      return this.apiResult(await this.client.getHealth());
    } catch (error) {
      return this.fallback('API health', error, () => null);
    }
  }

  async searchCatalog(
    query: string,
    filters: { body?: Body } = {},
  ): Promise<Sourced<CatalogSearchResult>> {
    try {
      return this.apiResult(await this.client.searchCatalog(query, filters));
    } catch (error) {
      return this.fallback('the artifact catalog', error, () =>
        searchLocalCatalog(query, filters.body),
      );
    }
  }

  async getArtifacts(filters: ArtifactFilters = {}): Promise<Sourced<ArtifactListResult>> {
    try {
      return this.apiResult(await this.client.getArtifacts(filters));
    } catch (error) {
      return this.fallback('the artifact catalog', error, () => listLocalArtifacts(filters));
    }
  }

  async getArtifactBySlug(slug: string): Promise<Sourced<Artifact>> {
    try {
      return this.apiResult(await this.client.getArtifactBySlug(slug));
    } catch (error) {
      return this.fallback(`artifact "${slug}"`, error, () => {
        const artifact = getLocalArtifactBySlug(slug);
        if (!artifact) {
          throw new ApiRequestError(
            'NOT_FOUND',
            `The demo dataset has no verified artifact named "${slug}".`,
            { status: 404 },
          );
        }
        return artifact;
      });
    }
  }

  async getRoutes(): Promise<Sourced<GuidedRouteListResult>> {
    try {
      return this.apiResult(await this.client.getRoutes());
    } catch (error) {
      return this.fallback('guided routes', error, () => {
        const routes = getLocalRoutes();
        return { count: routes.length, routes };
      });
    }
  }

  async getRouteBySlug(slug: string): Promise<Sourced<GuidedRoute>> {
    try {
      return this.apiResult(await this.client.getRouteBySlug(slug));
    } catch (error) {
      return this.fallback(`guided route "${slug}"`, error, () => {
        const route = getLocalRouteBySlug(slug);
        if (!route) {
          throw new ApiRequestError(
            'NOT_FOUND',
            `The demo dataset has no guided route named "${slug}".`,
            { status: 404 },
          );
        }
        return route;
      });
    }
  }

  async getQuiz(artifactSlug: string): Promise<Sourced<Quiz>> {
    try {
      return this.apiResult(await this.client.getQuiz(artifactSlug));
    } catch (error) {
      return this.fallback(`the debrief for "${artifactSlug}"`, error, () => {
        const quiz = getLocalQuiz(artifactSlug);
        if (!quiz) {
          throw new ApiRequestError(
            'NOT_FOUND',
            `The demo dataset has no mission debrief for "${artifactSlug}".`,
            { status: 404 },
          );
        }
        return quiz;
      });
    }
  }

  async submitQuizAnswer(
    artifactSlug: string,
    optionId: string,
    questionId?: string,
  ): Promise<Sourced<QuizAnswerResult>> {
    try {
      return this.apiResult(
        await this.client.submitQuizAnswer(artifactSlug, optionId, questionId),
      );
    } catch (error) {
      try {
        return this.fallback(`answer evaluation for "${artifactSlug}"`, error, () =>
          evaluateLocalQuizAnswer(artifactSlug, optionId, questionId),
        );
      } catch (localError) {
        if (localError instanceof LocalQuizError) {
          throw new ApiRequestError(localError.code, localError.message, {
            status: localError.code === 'NOT_FOUND' ? 404 : 400,
          });
        }
        throw localError;
      }
    }
  }
}

export const artifactService = new ArtifactService();
