import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { withRedaction } from "../src/privacy/redact.js";

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement("div");
  document.body.appendChild(root);
});
afterEach(() => root.remove());

describe("withRedaction", () => {
  it("blanks password values during fn and restores them after", async () => {
    root.innerHTML = '<input id="p" type="password" value="hunter2">';
    const input = root.querySelector<HTMLInputElement>("#p")!;

    let seenDuring = "unset";
    const out = await withRedaction([], async () => {
      seenDuring = input.value;
      return 42;
    });

    expect(seenDuring).toBe("");
    expect(input.value).toBe("hunter2");
    expect(out).toBe(42);
  });

  it("hides nodes matched by a user selector, then restores visibility", async () => {
    root.innerHTML = '<div class="secret" style="visibility:visible">x</div>';
    const el = root.querySelector<HTMLElement>(".secret")!;

    let visDuring = "unset";
    await withRedaction([".secret"], async () => {
      visDuring = el.style.visibility;
    });

    expect(visDuring).toBe("hidden");
    expect(el.style.visibility).toBe("visible");
  });

  it("restores everything even if fn throws", async () => {
    root.innerHTML = '<input id="p" type="password" value="pw"><div class="r">y</div>';
    const input = root.querySelector<HTMLInputElement>("#p")!;
    const div = root.querySelector<HTMLElement>(".r")!;

    await expect(
      withRedaction([".r"], async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(input.value).toBe("pw");
    expect(div.style.visibility).toBe("");
  });

  it("ignores an invalid user selector", async () => {
    await expect(withRedaction(["::::"], async () => "ok")).resolves.toBe("ok");
  });
});
