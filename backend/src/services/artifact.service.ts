import {
  filterArtifacts,
  toArtifactSummary,
  type Artifact,
  type ArtifactFilters,
  type ArtifactListResult,
} from '@echoes/shared';
import type { Dataset } from '../data';

export class ArtifactService {
  constructor(private readonly dataset: Dataset) {}

  list(filters: ArtifactFilters): ArtifactListResult {
    const matches = filterArtifacts(this.dataset.artifacts, filters);
    return {
      count: matches.length,
      filters: {
        ...(filters.body ? { body: filters.body } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        status: filters.status ?? 'verified',
        q: filters.q ?? '',
      },
      artifacts: matches.map(toArtifactSummary),
    };
  }

  getBySlug(slug: string): Artifact | undefined {
    return this.dataset.artifactsBySlug.get(slug);
  }

  /** Public detail endpoint: needs_review records are not returned by slug. */
  getPublicBySlug(slug: string): Artifact | undefined {
    const artifact = this.getBySlug(slug);
    return artifact?.verificationStatus === 'verified' ? artifact : undefined;
  }
}
