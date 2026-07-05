"use client";
import { useGarden } from "./useGarden";
import { GratitudeItem } from "./GratitudeItem";
import { PlantForm } from "./PlantForm";

export function Scene() {
  const { entries, phase, planted, plant, react, report } = useGarden();
  return (
    <main className={`gg-scene gg-scene-${phase}`}>
      <div className="gg-field">
        {entries.map((e) => (
          <GratitudeItem key={e.id} entry={e} phase={phase} onReact={react} onReport={report} />
        ))}
      </div>
      <PlantForm planted={planted} onPlant={plant} />
    </main>
  );
}
