/**
 * Mission Timeline & Afterlife feature registration.
 *
 * AfterlifeFeature addresses sources and chapters by id; the adapter resolves
 * those ids against the shared artifact so the parent keeps owning the
 * evidence drawer and the chapter focus.
 */
import AfterlifeFeature from './AfterlifeFeature';
import { defineFeature } from '../integration/featureTypes';
import type { AfterlifeFeatureProps } from '../integration/featureTypes';
import { openSharedSource, toLegacyArtifact } from '../integration/legacyAdapters';

function TimelineAfterlifeFeature({
  artifact,
  onOpenSource,
  onSelectChapter,
}: AfterlifeFeatureProps) {
  return (
    <AfterlifeFeature
      artifact={toLegacyArtifact(artifact)}
      onOpenSource={(sourceId) => openSharedSource(artifact, sourceId, onOpenSource)}
      onSelectChapter={(chapterId) => {
        const chapter = artifact.story.chapters.find(
          (candidate) => candidate.id === chapterId,
        );
        if (chapter) onSelectChapter(chapter);
      }}
    />
  );
}

export default defineFeature({ key: 'afterlife', component: TimelineAfterlifeFeature });
