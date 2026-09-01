import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFiberComponent } from "../src/fiber-source.js";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

function Inner() {
  return (
    <button type="button" data-testid="b">
      Go
    </button>
  );
}
function Outer() {
  return (
    <div>
      <Inner />
    </div>
  );
}

const Named = () => <span data-testid="named" />;
Named.displayName = "FancyPanel";

// arrow assigned to a one-letter const → `.name` is "m", simulating a mangled build
const m = () => <i data-testid="mangled" />;

describe("readFiberComponent", () => {
  it("reads the nearest component name and the ancestor stack", async () => {
    await act(async () => root.render(<Outer />));
    const info = readFiberComponent(container.querySelector('[data-testid="b"]') as Element);
    expect(info?.name).toBe("Inner");
    expect(info?.stack).toContain("Inner");
    expect(info?.stack).toContain("Outer");
  });

  it("prefers displayName", async () => {
    await act(async () => root.render(<Named />));
    const info = readFiberComponent(container.querySelector('[data-testid="named"]') as Element);
    expect(info?.name).toBe("FancyPanel");
  });

  it("returns null when the only component name looks minifier-mangled", async () => {
    const M = m;
    await act(async () => root.render(<M />));
    const info = readFiberComponent(container.querySelector('[data-testid="mangled"]') as Element);
    expect(info).toBeNull();
  });

  it("returns null for a DOM node React never rendered", () => {
    expect(readFiberComponent(document.createElement("div"))).toBeNull();
  });
});
