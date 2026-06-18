import type { SensorSource } from "@/entities/sensor";

const STORAGE_KEY = "crowdnav.custom-sources.v1";

export type CustomSourceOverrides = Record<
  string,
  { name?: string; connected?: boolean; feedLabel?: string }
>;

export function loadCustomSources(): SensorSource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SensorSource[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomSources(sources: SensorSource[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
}

export function addCustomSource(source: Omit<SensorSource, "id">): SensorSource {
  const next: SensorSource = {
    ...source,
    id: `custom-${Date.now()}`,
  };
  const existing = loadCustomSources();
  saveCustomSources([...existing, next]);
  return next;
}

export function updateCustomSource(id: string, patch: Partial<SensorSource>): SensorSource | null {
  const existing = loadCustomSources();
  const index = existing.findIndex((s) => s.id === id);
  if (index < 0) return null;
  const updated = { ...existing[index], ...patch, id };
  existing[index] = updated;
  saveCustomSources(existing);
  return updated;
}

export function clearCustomSources(): void {
  localStorage.removeItem(STORAGE_KEY);
}
