import { beforeEach, describe, expect, it } from "vitest";
import {
  addCustomSource,
  clearCustomSources,
  loadCustomSources,
  updateCustomSource,
} from "./customSourcesStorage";

describe("customSourcesStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds and loads custom sources", () => {
    addCustomSource({
      name: "North Cam",
      ip: "10.0.0.2",
      feedLabel: "CAM_01",
      connected: true,
    });

    const sources = loadCustomSources();
    expect(sources).toHaveLength(1);
    expect(sources[0]?.name).toBe("North Cam");
  });

  it("updates an existing custom source", () => {
    const created = addCustomSource({
      name: "Lobby",
      ip: "10.0.0.3",
      feedLabel: "CAM_02",
      connected: true,
    });

    updateCustomSource(created.id, { name: "Lobby Updated" });
    expect(loadCustomSources()[0]?.name).toBe("Lobby Updated");
  });

  it("clears stored custom sources", () => {
    addCustomSource({
      name: "Lobby",
      ip: "10.0.0.3",
      feedLabel: "CAM_02",
      connected: true,
    });
    clearCustomSources();
    expect(loadCustomSources()).toEqual([]);
  });
});
