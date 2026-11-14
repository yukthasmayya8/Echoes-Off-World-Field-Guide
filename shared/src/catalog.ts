/**
 * Pure catalog helpers shared by the Express services and the offline demo
 * fallback so both paths rank, filter and search records identically.
 */
import { BODY_VALUES } from './constants';
import type {
  Artifact,
  ArtifactFilters,
  ArtifactSummary,
  Body,
  CatalogEntry,
} from './types';

const BODY_LABELS: Record<Body, string> = {
  moon: 'Moon',
  mars: 'Mars',
};

export function normalizeQuery(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function bodyLabel(body: Body): string {
  return BODY_LABELS[body];
}

export function toArtifactSummary(artifact: Artifact): ArtifactSummary {
  return {
    id: artifact.id,
    slug: artifact.slug,
    name: artifact.name,
    aliases: [...artifact.aliases],
    body: artifact.body,
    missionName: artifact.missionName,
    artifactType: artifact.artifactType,
    nssdcaRecordId: artifact.nssdca.recordId,
    nssdcaRecordUrl: artifact.nssdca.recordUrl,
    locationConfidence: artifact.location.confidence,
    verificationStatus: artifact.verificationStatus,
    summary: artifact.summary,
  };
}

/**
 * Returns the list of fields that matched, or null when nothing matched.
 * An empty query matches everything and reports no specific field.
 */
export function matchArtifact(artifact: Artifact, rawQuery: string): string[] | null {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];

  const matchedOn: string[] = [];

  if (artifact.name.toLowerCase().includes(query)) matchedOn.push('name');
  if (artifact.aliases.some((alias) => alias.toLowerCase().includes(query))) {
    matchedOn.push('alias');
  }
  if (artifact.nssdca.recordId.toLowerCase().includes(query)) {
    matchedOn.push('nssdcaRecordId');
  }
  if (artifact.nssdca.recordTitle.toLowerCase().includes(query)) {
    matchedOn.push('nssdcaRecordTitle');
  }
  if (artifact.missionName.toLowerCase().includes(query)) matchedOn.push('missionName');
  if (artifact.body === query || BODY_LABELS[artifact.body].toLowerCase() === query) {
    matchedOn.push('body');
  }

  return matchedOn.length > 0 ? matchedOn : null;
}

export function toCatalogEntry(artifact: Artifact, matchedOn: string[] = []): CatalogEntry {
  return { ...toArtifactSummary(artifact), matchedOn: [...matchedOn] };
}

function matchRank(matchedOn: string[]): number {
  const order = ['name', 'alias', 'nssdcaRecordId', 'missionName', 'nssdcaRecordTitle', 'body'];
  for (const [index, field] of order.entries()) {
    if (matchedOn.includes(field)) return index;
  }
  return order.length;
}

/** Stable relevance sort: field priority first, then artifact name. */
export function sortCatalogEntries(entries: CatalogEntry[]): CatalogEntry[] {
  return [...entries].sort((a, b) => {
    const rank = matchRank(a.matchedOn) - matchRank(b.matchedOn);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
}

export function filterArtifacts(artifacts: Artifact[], filters: ArtifactFilters): Artifact[] {
  const status = filters.status ?? 'verified';
  const query = normalizeQuery(filters.q);

  return artifacts.filter((artifact) => {
    if (status !== 'all' && artifact.verificationStatus !== status) return false;
    if (filters.body && artifact.body !== filters.body) return false;
    if (filters.type && artifact.artifactType !== filters.type) return false;
    if (query && matchArtifact(artifact, query) === null) return false;
    return true;
  });
}

/** Search is verified-only by contract; the listing endpoint owns status filters. */
export function searchArtifacts(
  artifacts: Artifact[],
  query: string,
  body?: Body,
): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  for (const artifact of artifacts) {
    if (artifact.verificationStatus !== 'verified') continue;
    if (body && artifact.body !== body) continue;

    const matchedOn = matchArtifact(artifact, query);
    if (matchedOn === null) continue;

    entries.push(toCatalogEntry(artifact, matchedOn));
  }

  return sortCatalogEntries(entries);
}

export function availableBodies(): Body[] {
  return [...BODY_VALUES];
}
