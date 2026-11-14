import {
  availableBodies,
  searchArtifacts,
  type Body,
  type CatalogSearchResult,
} from '@echoes/shared';
import type { Dataset } from '../data';

export class CatalogService {
  constructor(private readonly dataset: Dataset) {}

  search(query: string, body?: Body): CatalogSearchResult {
    const results = searchArtifacts(this.dataset.artifacts, query, body);
    return {
      query,
      ...(body ? { body } : {}),
      count: results.length,
      results,
      availableBodies: availableBodies(),
    };
  }
}
