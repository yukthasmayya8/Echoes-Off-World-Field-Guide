/**
 * Constants shared by the backend, the API client and every frontend feature.
 *
 * Keeping enums and limits here means a feature author never has to guess what
 * the API accepts, and the data validator and the UI can never drift apart.
 */

export const API_VERSION = '1.0.0';
export const API_PREFIX = '/api/v1';

export const DEFAULT_BACKEND_PORT = 4000;
export const DEFAULT_FRONTEND_DEV_ORIGIN = 'http://localhost:5173';
export const DEFAULT_API_BASE_URL = `http://localhost:${DEFAULT_BACKEND_PORT}${API_PREFIX}`;
export const DEFAULT_API_TIMEOUT_MS = 8000;

export const STORY_CHAPTER_COUNT = 5;
export const QUIZ_MIN_OPTIONS = 2;
export const MAX_SEARCH_QUERY_LENGTH = 120;
export const MAX_SLUG_LENGTH = 80;

export const BODY_VALUES = ['moon', 'mars'] as const;

export const VERIFICATION_STATUS_VALUES = ['verified', 'needs_review'] as const;

export const ARTIFACT_STATUS_FILTER_VALUES = ['verified', 'needs_review', 'all'] as const;

export const ARTIFACT_TYPE_VALUES = [
  'lander',
  'rover',
  'lunar-module',
  'robotic-lander',
  'experiment-package',
  'orbiter',
  'other',
] as const;

export const LOCATION_CONFIDENCE_VALUES = ['exact', 'approximate', 'unknown'] as const;

export const TIMELINE_EVENT_TYPE_VALUES = [
  'launch',
  'arrival',
  'landing',
  'deployment',
  'surface-operations',
  'science',
  'departure',
  'end-of-mission',
  'afterlife',
  'other',
] as const;

export const ROUTE_BODY_VALUES = ['moon', 'mars', 'mixed'] as const;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * NSSDCA spacecraft records are the only archive URL shape accepted by the
 * validator. This prevents a hand-typed or stale URL being presented as a
 * verified archive citation.
 */
export const NSSDCA_RECORD_URL_PATTERN =
  /^https:\/\/nssdc\.gsfc\.nasa\.gov\/nmc\/spacecraft\/display\.action\?id=[A-Za-z0-9-]+$/;

export const NSSDCA_RECORD_ID_PATTERN = /^[A-Za-z0-9-]+$/;

export const QUIZ_EVALUATION_SOURCES = ['server', 'local'] as const;

export const DATA_FILES = {
  artifacts: 'artifacts.json',
  routes: 'guided-routes.json',
  quizzes: 'quizzes.json',
} as const;

export const ARCHIVE_DATA_LABEL = 'Archive data';
