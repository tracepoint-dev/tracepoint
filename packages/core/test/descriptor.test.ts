import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildDescriptor } from "../src/capture/descriptor.js";
import { generateSelector } from "../src/capture/selector.js";

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement("div");
  document.body.appendChild(root);
});
afterEach(() => {
  root.remove();
});

function mount(html: string): HTMLElement {
  root.innerHTML = html;
  return root;
}

describe("generateSelector", () => {
  it("builds a resolving, unique selector for a plain element", () => {
    mount('<button class="btn primary">Save</button>');
    const btn = root.querySelector("button") as Element;
    const r = generateSelector(btn);
    expect(r.resolves).toBe(true);
    expect(r.matchCount).toBe(1);
    expect(r.confidence).toBe("semantic");
    expect(document.querySelector(r.generated)).toBe(btn);
  });

  it("falls back to a positional selector when only volatile classes exist", () => {
    mount(
      '<div><i class="css-1a2b3c"></i><i class="css-1a2b3c"></i><i class="css-1a2b3c"></i></div>',
    );
    const target = root.querySelectorAll("i")[2] as Element;
    const r = generateSelector(target);
    expect(r.confidence).toBe("positional");
    expect(document.querySelector(r.generated)).toBe(target);
  });
});

describe("buildDescriptor", () => {
  it("prefers a data-testid for the primary selector and keeps an authored id", () => {
    mount('<button id="save-btn" data-testid="save" class="btn css-9z9z9z">Save now</button>');
    const d = buildDescriptor(root.querySelector("button") as Element);

    expect(d.testId).toBe("save");
    expect(d.primarySelector).toBe('[data-testid="save"]');
    expect(d.id).toBe("save-btn");
    expect(d.tag).toBe("button");
    expect(d.text).toBe("Save now");
    expect(d.value).toBeNull();
    expect(d.accessibleName).toBe("Save now");
  });

  it("narrows attributes to the allow-list + data-test* + aria-*", () => {
    mount(
      '<div id="d" data-testid="t" data-internal="secret" aria-hidden="true" class="x">z</div>',
    );
    const d = buildDescriptor(root.querySelector("#d") as Element);
    expect(Object.keys(d.attributes).sort()).toEqual(["aria-hidden", "class", "data-testid", "id"]);
    expect(d.attributes["data-internal"]).toBeUndefined();
  });

  it("captures a field value but never a sensitive one", () => {
    mount('<input id="a" value="hello">');
    expect(buildDescriptor(root.querySelector("#a") as Element).value).toBe("hello");

    mount('<input id="b" type="password" value="secret">');
    expect(buildDescriptor(root.querySelector("#b") as Element).value).toBeNull();

    mount('<input id="c" autocomplete="cc-number" value="4111111111111111">');
    expect(buildDescriptor(root.querySelector("#c") as Element).value).toBeNull();
  });

  it("finds the nearest interactive ancestor when the picked node is a wrapper", () => {
    mount('<button class="wrap"><span id="lbl">Go</span></button>');
    const span = root.querySelector("#lbl") as Element;
    const d = buildDescriptor(span);
    expect(d.interactiveAncestor?.tag).toBe("button");

    const button = root.querySelector("button") as Element;
    expect(buildDescriptor(button).interactiveAncestor).toBeNull();
  });

  it("emits a collapsed outerHTML snippet and an ancestor chain", () => {
    mount(
      '<section class="panel"><div class="row"><button class="cta">Hi</button></div></section>',
    );
    const d = buildDescriptor(root.querySelector("button") as Element);
    expect(d.outerHtml).toBe('<button class="cta">…</button>');
    expect(d.ancestors).toEqual(["div.row", "section.panel", "div"]);
  });

  it("resolves aria-label as the accessible name over text", () => {
    mount('<button aria-label="Close dialog">×</button>');
    expect(buildDescriptor(root.querySelector("button") as Element).accessibleName).toBe(
      "Close dialog",
    );
  });

  it("leaves component null when no framework contributor is registered", () => {
    mount("<button>Plain</button>");
    expect(buildDescriptor(root.querySelector("button") as Element).component).toBeNull();
  });
});
