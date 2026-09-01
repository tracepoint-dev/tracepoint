import { afterEach, describe, expect, it } from "vitest";
import {
  _resetContributors,
  registerDescriptorContributor,
  runContributors,
} from "../src/capture/contributors.js";

afterEach(() => _resetContributors());

const el = () => document.createElement("div");

describe("descriptor contributors", () => {
  it("returns null when nothing is registered", () => {
    expect(runContributors(el())).toBeNull();
  });

  it("merges a contributor's partial output into the full shape", () => {
    registerDescriptorContributor(() => ({
      name: "CheckoutButton",
      stack: ["CheckoutButton", "Cart"],
    }));
    expect(runContributors(el())).toEqual({
      name: "CheckoutButton",
      stack: ["CheckoutButton", "Cart"],
      source: null,
    });
  });

  it("lets a later contributor override an earlier field", () => {
    registerDescriptorContributor(() => ({ name: "First" }));
    registerDescriptorContributor(() => ({ source: { file: "a.tsx", line: 4 } }));
    expect(runContributors(el())).toEqual({
      name: "First",
      stack: [],
      source: { file: "a.tsx", line: 4 },
    });
  });

  it("swallows a throwing contributor and still runs the others", () => {
    registerDescriptorContributor(() => {
      throw new Error("boom");
    });
    registerDescriptorContributor(() => ({ name: "Survivor" }));
    expect(runContributors(el())?.name).toBe("Survivor");
  });

  it("unregister removes the contributor", () => {
    const off = registerDescriptorContributor(() => ({ name: "Temp" }));
    expect(runContributors(el())?.name).toBe("Temp");
    off();
    expect(runContributors(el())).toBeNull();
  });

  it("returns null if every contributor produces nothing", () => {
    registerDescriptorContributor(() => null);
    expect(runContributors(el())).toBeNull();
  });
});
