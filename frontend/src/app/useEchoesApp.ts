import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Artifact,
  Body,
  CatalogEntry,
  DataSource,
  GuidedRoute,
  Quiz,
  Source,
  StoryChapter,
} from '@echoes/shared';
import { ApiRequestError } from '../services/api';
import { artifactService } from '../services/artifactService';

export type DestinationFilter = Body | 'all';

interface SourcedLike {
  source: DataSource;
  notice?: string;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while loading the field guide.';
}

/**
 * The parent application's single source of truth.
 *
 * Owns the catalog, selected artifact, destination, route selection, loading,
 * errors and source navigation. Feature components only receive derived props.
 */
export function useEchoesApp() {
  const [records, setRecords] = useState<CatalogEntry[]>([]);
  const [routes, setRoutes] = useState<GuidedRoute[]>([]);
  const [artifactsBySlug, setArtifactsBySlug] = useState<Record<string, Artifact>>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<DestinationFilter>('all');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedRouteSlug, setSelectedRouteSlug] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<DataSource>('api');
  const [demoNotice, setDemoNotice] = useState<string | undefined>(undefined);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [activeChapter, setActiveChapter] = useState<StoryChapter | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const artifactPromises = useRef(new Map<string, Promise<Artifact>>());
  const quizPromises = useRef(new Map<string, Promise<Quiz | null>>());

  const applySource = useCallback((result: SourcedLike) => {
    setSourceMode(result.source);
    setDemoNotice(result.notice);
  }, []);

  /**
   * Cache by slug so Atlas selection, route navigation and storybook rendering
   * never duplicate a detail request for the same artifact.
   */
  const loadArtifactCached = useCallback(
    async (slug: string): Promise<Artifact> => {
      const cached = artifactPromises.current.get(slug);
      if (cached) return cached;

      const promise = artifactService
        .getArtifactBySlug(slug)
        .then((result) => {
          applySource(result);
          setArtifactsBySlug((previous) =>
            previous[slug] ? previous : { ...previous, [slug]: result.data },
          );
          return result.data;
        })
        .catch((loadError: unknown) => {
          artifactPromises.current.delete(slug);
          throw loadError;
        });

      artifactPromises.current.set(slug, promise);
      return promise;
    },
    [applySource],
  );

  const loadQuizCached = useCallback(
    async (slug: string): Promise<Quiz | null> => {
      const cached = quizPromises.current.get(slug);
      if (cached) return cached;

      const promise = artifactService
        .getQuiz(slug)
        .then((result) => {
          applySource(result);
          return result.data;
        })
        .catch((loadError: unknown) => {
          quizPromises.current.delete(slug);
          if (loadError instanceof ApiRequestError && loadError.status === 404) {
            return null;
          }
          throw loadError;
        });

      quizPromises.current.set(slug, promise);
      return promise;
    },
    [applySource],
  );

  // Catalog: uses the dedicated search endpoint when a query is applied,
  // otherwise the filterable artifact listing.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body = selectedDestination === 'all' ? undefined : selectedDestination;
    const operation = appliedQuery.trim()
      ? artifactService.searchCatalog(appliedQuery.trim(), { body })
      : artifactService.getArtifacts({ body });

    void operation
      .then((result) => {
        if (cancelled) return;
        applySource(result);

        const entries: CatalogEntry[] =
          'results' in result.data
            ? result.data.results
            : result.data.artifacts.map((summary) => ({ ...summary, matchedOn: [] }));

        setRecords(entries);

        // Hydrate records for the Atlas-to-Storybook handoff. Failures are
        // non-fatal: the Atlas remains usable and selection can retry.
        void Promise.allSettled(entries.map((entry) => loadArtifactCached(entry.slug)));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(toMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedQuery, selectedDestination, refreshToken, applySource, loadArtifactCached]);

  // Guided routes load once and hydrate the artifacts their steps reference.
  useEffect(() => {
    let cancelled = false;

    void artifactService
      .getRoutes()
      .then((result) => {
        if (cancelled) return;
        applySource(result);
        setRoutes(result.data.routes);

        const slugs = [
          ...new Set(result.data.routes.flatMap((route) => route.steps.map((step) => step.artifactSlug))),
        ];
        void Promise.allSettled(slugs.map((slug) => loadArtifactCached(slug)));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(toMessage(loadError));
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken, applySource, loadArtifactCached]);

  const selectArtifact = useCallback(
    async (slug: string) => {
      if (slug === selectedSlug && artifactsBySlug[slug]) return;

      setSelectedSlug(slug);
      setActiveChapter(null);
      setDetailLoading(true);
      setError(null);

      try {
        const artifact = await loadArtifactCached(slug);
        const loadedQuiz = await loadQuizCached(slug);
        setQuiz(loadedQuiz);

        // Keep the destination toggle in sync with the storybook that will
        // render, without changing the search filter the visitor chose.
        if (artifact.body !== selectedDestination && selectedDestination !== 'all') {
          setSelectedDestination(artifact.body);
        }
      } catch (loadError) {
        setError(toMessage(loadError));
      } finally {
        setDetailLoading(false);
      }
    },
    [
      selectedSlug,
      artifactsBySlug,
      loadArtifactCached,
      loadQuizCached,
      selectedDestination,
    ],
  );

  const submitSearch = useCallback(
    (value?: string) => {
      setAppliedQuery((value ?? query).trim());
    },
    [query],
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setAppliedQuery('');
  }, []);

  const selectDestination = useCallback((destination: DestinationFilter) => {
    setSelectedDestination(destination);
  }, []);

  const selectRoute = useCallback((routeSlug: string | null) => {
    setSelectedRouteSlug(routeSlug);
  }, []);

  const openSource = useCallback((source: Source) => {
    setActiveSource(source);
  }, []);

  const closeSource = useCallback(() => {
    setActiveSource(null);
  }, []);

  const selectChapter = useCallback((chapter: StoryChapter) => {
    setActiveChapter(chapter);
  }, []);

  const retry = useCallback(() => {
    artifactPromises.current.clear();
    quizPromises.current.clear();
    setArtifactsBySlug({});
    setQuiz(null);
    setRefreshToken((token) => token + 1);
  }, []);

  const selectedArtifact = selectedSlug ? artifactsBySlug[selectedSlug] ?? null : null;
  const visibleRoutes = selectedRouteSlug
    ? routes.filter((route) => route.slug === selectedRouteSlug)
    : routes;

  return {
    records,
    routes,
    visibleRoutes,
    artifacts: Object.values(artifactsBySlug),
    selectedArtifact,
    selectedSlug,
    selectedDestination,
    selectedRouteSlug,
    quiz,
    loading,
    detailLoading,
    error,
    sourceMode,
    demoNotice,
    activeSource,
    activeChapter,
    query,
    setQuery,
    submitSearch,
    clearSearch,
    selectDestination,
    selectRoute,
    selectArtifact,
    openSource,
    closeSource,
    selectChapter,
    retry,
  };
}
