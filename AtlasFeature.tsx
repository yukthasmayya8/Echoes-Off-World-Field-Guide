
import { useMemo, useState } from "react";
import "./AtlasFeature.css";

export interface ArtifactSummary {
  id: string;
  name: string;
  body: "Moon" | "Mars";
  type: string;
  mission: {
    name: string;
  };
  description?: string;
  status?: {
    operational?: string;
  };
  nssdc?: {
    recordId?: string;
    url?: string;
  };
  imageUrl?: string;
  aliases?: string[];
}

interface AtlasFeatureProps {
  records: ArtifactSummary[];
  selectedArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
}

export default function AtlasFeature({
  records,
  selectedArtifactId,
  onSelectArtifact,
}: AtlasFeatureProps) {
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("All");
  const [type, setType] = useState("All");

  const types = useMemo(
    () => [...new Set(records.map((item) => item.type))],
    [records]
  );

  const filteredRecords = records.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.mission.name.toLowerCase().includes(query) ||
      item.nssdc?.recordId?.toLowerCase().includes(query) ||
      item.aliases?.some((alias) =>
        alias.toLowerCase().includes(query)
      );

    const matchesDestination =
      destination === "All" || item.body === destination;

    const matchesType = type === "All" || item.type === type;

    return matchesSearch && matchesDestination && matchesType;
  });

  const selected = records.find(
    (item) => item.id === selectedArtifactId
  );

  return (
    <main className="atlas">
      <header className="atlas-header">
        <p className="atlas-label">ECHOES • OFF-WORLD ARCHIVE</p>
        <h1>Archive Atlas</h1>
        <p>
          Explore the human-made equipment left behind on the Moon
          and Mars. Every artifact has a story.
        </p>
      </header>

      <section className="atlas-controls">
        <input
          type="search"
          placeholder="Search artifacts, missions or NASA IDs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search artifacts"
        />

        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          aria-label="Filter by destination"
        >
          <option value="All">All destinations</option>
          <option value="Moon">Moon</option>
          <option value="Mars">Mars</option>
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by equipment type"
        >
          <option value="All">All equipment types</option>
          {types.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setDestination("All");
            setType("All");
          }}
        >
          Reset
        </button>
      </section>

      <section className="atlas-results">
        <h2>Artifact Collection</h2>
        <p>{filteredRecords.length} artifacts found</p>

        <div className="atlas-grid">
          {filteredRecords.map((item) => (
            <button
              key={item.id}
              className={`atlas-card ${
                selectedArtifactId === item.id ? "active" : ""
              }`}
              onClick={() => onSelectArtifact(item.id)}
              type="button"
            >
              <div className="atlas-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <span>{item.body === "Moon" ? "☾" : "♂"}</span>
                )}
              </div>

              <div className="atlas-card-content">
                <span className="atlas-tag">{item.body}</span>
                <h3>{item.name}</h3>
                <p>{item.mission.name}</p>
                <small>{item.type}</small>
              </div>
            </button>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <p className="atlas-empty">
            No artifacts found. Try another search.
          </p>
        )}
      </section>

      {selected && (
        <section className="atlas-detail">
          <p className="atlas-label">SELECTED ARTIFACT</p>
          <h2>{selected.name}</h2>
          <p>
            {selected.description || "Description not available."}
          </p>

          <div className="atlas-detail-grid">
            <div>
              <strong>Destination</strong>
              <p>{selected.body}</p>
            </div>
            <div>
              <strong>Mission</strong>
              <p>{selected.mission.name}</p>
            </div>
            <div>
              <strong>Equipment</strong>
              <p>{selected.type}</p>
            </div>
            <div>
              <strong>Status</strong>
              <p>{selected.status?.operational || "Unknown"}</p>
            </div>
            <div>
              <strong>NASA Record ID</strong>
              <p>{selected.nssdc?.recordId || "Not listed"}</p>
            </div>
          </div>

          {selected.nssdc?.url && (
            <a href={selected.nssdc.url} target="_blank" rel="noreferrer">
              View NASA archive record ↗
            </a>
          )}
        </section>
      )}
    </main>
  );
}
