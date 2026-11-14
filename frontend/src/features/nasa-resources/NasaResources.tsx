/**
 * NASA Resources and data provenance.
 *
 * This page separates three things that are easy to confuse:
 *   1. Data actually ingested into ECHOES (NSSDCA records).
 *   2. NASA data cited by those records (LRO-derived coordinates).
 *   3. Resources linked for further exploration but not ingested.
 */

export type ResourceUse = 'ingested' | 'cited' | 'linked';

interface NasaResource {
  id: string;
  name: string;
  provider: string;
  instrument: string;
  description: string;
  tellsUs: string;
  use: ResourceUse;
  useNote: string;
  url: string;
  limitations: string;
}

const RESOURCES: NasaResource[] = [
  {
    id: 'nssdca',
    name: 'NASA Space Science Data Coordinated Archive (NSSDCA) Master Catalog',
    provider: 'NASA Goddard Space Flight Center',
    instrument: 'Mission and spacecraft records',
    description:
      'A long-running archive of mission and spacecraft records, including lunar and planetary landing sites, mission objectives and final dispositions.',
    tellsUs:
      'Mission identity, launch and arrival dates, hardware summaries, recorded locations and archive wording.',
    use: 'ingested',
    useNote:
      'This is the dataset actually ingested by ECHOES. Every artifact record in data/artifacts.json is transcribed from an NSSDCA record and carries its record ID and URL.',
    url: 'https://nssdc.gsfc.nasa.gov/',
    limitations:
      'Records are mission summaries, not engineering parts lists. Some fields are absent or explicitly uncertain, and ECHOES preserves that uncertainty.',
  },
  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter (LRO)',
    provider: 'NASA Goddard Space Flight Center',
    instrument: 'Orbiter — multiple instruments',
    description:
      'A lunar orbiter that has mapped the Moon in detail since 2009, including high-resolution imaging and topography.',
    tellsUs:
      'Surface context, terrain and orbital observations that can be used to locate and study landing sites.',
    use: 'cited',
    useNote:
      'ECHOES does not ingest LRO products directly. The NSSDCA records used here state that some lunar landing coordinates were determined from LRO images; that provenance is quoted in the artifact explanations.',
    url: 'https://science.nasa.gov/mission/lro/',
    limitations:
      'A coordinate determined from orbital images is not a complete condition assessment of the hardware on the surface.',
  },
  {
    id: 'lroc',
    name: 'Lunar Reconnaissance Orbiter Camera (LROC)',
    provider: 'NASA / Arizona State University',
    instrument: 'LROC Narrow Angle and Wide Angle Cameras',
    description:
      'High-resolution lunar surface imaging used for mapping, landing-site studies and change detection.',
    tellsUs:
      'Detailed views of terrain and, at suitable resolutions, hardware and surface disturbances.',
    use: 'linked',
    useNote:
      'Linked for further exploration. No LROC image product is bundled with ECHOES in this build.',
    url: 'https://lroc.im-ldi.com/',
    limitations:
      'Image resolution, lighting and viewing geometry affect what can be concluded. An image alone does not prove an object is operational or intact.',
  },
  {
    id: 'lola',
    name: 'Lunar Orbiter Laser Altimeter (LOLA)',
    provider: 'NASA Goddard Space Flight Center',
    instrument: 'Laser altimeter on LRO',
    description:
      'Measures lunar surface elevation to build topographic models of the Moon.',
    tellsUs:
      'Elevation, slope and terrain shape around landing sites.',
    use: 'linked',
    useNote:
      'Linked for further exploration. ECHOES does not bundle LOLA elevation products in this build.',
    url: 'https://lola.gsfc.nasa.gov/',
    limitations:
      'Topography describes terrain, not the condition or identity of hardware.',
  },
  {
    id: 'pds',
    name: 'NASA Planetary Data System (PDS)',
    provider: 'NASA Science Mission Directorate',
    instrument: 'Distributed planetary data archive',
    description:
      'The official archive for planetary mission data products, organized by discipline nodes.',
    tellsUs:
      'Where to find calibrated images, spectra, altimetry and other scientific products for further study.',
    use: 'linked',
    useNote:
      'Linked as the authoritative next step for raw and calibrated data. ECHOES does not claim to have ingested PDS products beyond the NSSDCA summaries.',
    url: 'https://pds.nasa.gov/',
    limitations:
      'PDS products require instrument-specific documentation and calibration knowledge to interpret correctly.',
  },
  {
    id: 'moon-trek',
    name: 'NASA Moon Trek',
    provider: 'NASA Solar System Exploration Research Virtual Institute',
    instrument: 'Web mapping and analysis portal',
    description:
      'A browser-based lunar mapping portal combining imagery, topography and other layers.',
    tellsUs:
      'Interactive context for lunar terrain and landing sites.',
    use: 'linked',
    useNote:
      'Linked for further exploration. ECHOES uses its own schematic equirectangular coordinate chart rather than embedding Trek tiles.',
    url: 'https://trek.nasa.gov/moon/',
    limitations:
      'A web map layer is a visualization, not a measurement. Layer dates and sources must be checked before drawing conclusions.',
  },
  {
    id: 'mars-trek',
    name: 'NASA Mars Trek',
    provider: 'NASA Solar System Exploration Research Virtual Institute',
    instrument: 'Web mapping and analysis portal',
    description:
      'A browser-based Mars mapping portal with imagery and terrain layers.',
    tellsUs:
      'Interactive context for Martian terrain and landing sites.',
    use: 'linked',
    useNote:
      'Linked for further exploration. ECHOES plots Mars records on its own coordinate chart using archived coordinates.',
    url: 'https://trek.nasa.gov/mars/',
    limitations:
      'Mars longitude conventions and coordinate frames must be checked against each source record.',
  },
  {
    id: 'hirise',
    name: 'High Resolution Imaging Science Experiment (HiRISE)',
    provider: 'NASA / University of Arizona',
    instrument: 'Camera on Mars Reconnaissance Orbiter',
    description:
      'Very high-resolution imaging of the Martian surface.',
    tellsUs:
      'Detailed views of terrain and, at suitable resolutions, landed hardware.',
    use: 'linked',
    useNote:
      'Linked for further exploration. No HiRISE product is bundled with ECHOES in this build.',
    url: 'https://hirise.lpl.arizona.edu/',
    limitations:
      'Image interpretation requires care: resolution, lighting and processing affect what can be seen.',
  },
  {
    id: 'human-artifacts',
    name: 'NASA — Human Artifacts on the Moon',
    provider: 'NASA History Office',
    instrument: 'Historical reference',
    description:
      'A NASA reference page on human-made artifacts associated with lunar exploration.',
    tellsUs:
      'Why lunar hardware has historical and cultural significance.',
    use: 'linked',
    useNote:
      'Linked from the Space Heritage module as reference material. ECHOES is not an official preservation authority.',
    url: 'https://www.nasa.gov/wp-content/uploads/static/history/humanartifacts.html',
    limitations:
      'Historical significance is an interpretive judgement; it should be attributed and not presented as a regulatory designation.',
  },
];

const USE_LABELS: Record<ResourceUse, string> = {
  ingested: 'Ingested dataset',
  cited: 'Cited by ingested records',
  linked: 'Linked for further exploration',
};

export function NasaResources() {
  return (
    <section className="resources" aria-label="NASA Resources">
      <header className="module-header">
        <p className="eyebrow">DATA PROVENANCE</p>
        <h2>NASA Resources</h2>
        <p>
          What ECHOES actually uses, what the records cite, and what is linked
          only for further exploration. These categories are kept separate on
          purpose.
        </p>
      </header>

      <div className="provenance-banner">
        <div>
          <span className="provenance-banner__label">Primary ingested source</span>
          <strong>NASA NSSDCA Master Catalog</strong>
          <p>
            Five artifact records were transcribed from NSSDCA, source-checked on
            2026-11-14, and stored locally. The backend serves those records and
            the frontend falls back to the same JSON when the API is offline.
          </p>
        </div>
        <div className="provenance-banner__meta">
          <span className="badge">NASA data</span>
          <span className="badge">Source-checked 2026-11-14</span>
          <span className="badge">No live NASA API at runtime</span>
        </div>
      </div>

      <div className="resource-grid">
        {RESOURCES.map((resource) => (
          <article key={resource.id} className={`resource-card resource-card--${resource.use}`}>
            <div className="resource-card__top">
              <span className={`resource-use resource-use--${resource.use}`}>
                {USE_LABELS[resource.use]}
              </span>
              <span className="resource-card__provider">{resource.provider}</span>
            </div>
            <h3>{resource.name}</h3>
            <p className="resource-card__instrument">{resource.instrument}</p>
            <p>{resource.description}</p>
            <dl className="resource-facts">
              <div>
                <dt>What it tells us</dt>
                <dd>{resource.tellsUs}</dd>
              </div>
              <div>
                <dt>Use in ECHOES</dt>
                <dd>{resource.useNote}</dd>
              </div>
              <div>
                <dt>Limitations</dt>
                <dd>{resource.limitations}</dd>
              </div>
            </dl>
            <a href={resource.url} target="_blank" rel="noreferrer noopener" className="button button--ghost">
              Open official resource ↗
            </a>
          </article>
        ))}
      </div>

      <div className="provenance-note">
        <h3>Compliance note</h3>
        <p>
          The 2026 challenge Resources tab could not be retrieved in this offline
          development environment, so ECHOES does not claim that a specific 2026
          challenge-listed dataset has been used. What is verifiable here is the
          NSSDCA dataset actually ingested and the LRO-derived coordinate
          provenance quoted in the records. Live NASA services are not called at
          runtime, and no live-database access is simulated.
        </p>
        <p>
          Images are linked from the NSSDCA records that carry them and are
          credited in each artifact. No NASA logo, mission insignia or generated
          NASA branding is used. AI assistance is disclosed in the project
          README and in the narration panel.
        </p>
      </div>
    </section>
  );
}
