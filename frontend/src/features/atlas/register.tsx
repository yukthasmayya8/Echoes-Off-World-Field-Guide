/**
 * Atlas feature registration.
 *
 * Adapts the typed shared contract (CatalogEntry records plus an optional
 * location index) to the AtlasFeature component's established prop shape.
 * Records are keyed by slug so selection flows through the parent unchanged.
 */
import AtlasFeature, { type ArtifactSummary as AtlasRecord } from './AtlasFeature';
import { defineFeature } from '../integration/featureTypes';
import type { AtlasFeatureProps } from '../integration/featureTypes';
import { toAtlasRecord } from '../integration/legacyAdapters';

function AtlasArchiveFeature({
  records,
  selectedArtifactId,
  onSelectArtifact,
  locations,
  onOpenView,
}: AtlasFeatureProps) {
  const adaptedRecords: AtlasRecord[] = records.map((entry) =>
    toAtlasRecord(entry, locations?.[entry.slug]),
  );

  return (
    <AtlasFeature
      records={adaptedRecords}
      selectedArtifactId={selectedArtifactId}
      onSelectArtifact={onSelectArtifact}
      onOpenView={onOpenView}
    />
  );
}

export default defineFeature({ key: 'atlas', component: AtlasArchiveFeature });
