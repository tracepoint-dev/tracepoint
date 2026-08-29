/**
 * Heuristics for telling stable, author-written class names / ids apart from the
 * hashed noise that CSS-in-JS and scoped-style systems emit. A selector built on
 * the noise is garbage on the next deploy (Phase 0 findings, ADR 0001).
 */

/** True if a class name is safe to build a selector on. */
export function isStableClass(name: string): boolean {
  if (!name || name.length > 60) return false;
  if (/^(css|sc|emotion|jsx|ng-tns|ng-star)-/.test(name)) return false;
  if (/^_/.test(name) && /\d/.test(name)) return false; // CSS-modules: _root_1a2b3
  if (/-[0-9a-f]{5,}$/i.test(name)) return false; // trailing hash: box-9f8e7d6c
  if (/^[0-9a-f]{6,}$/i.test(name)) return false; // pure hash
  if (/^[a-z]{2}-[A-Za-z0-9]{6}$/.test(name)) return false; // styled-components: sc-bdfBwQ

  // CSS-modules `Name__hash`: a `__` suffix that looks random (has upper/digit).
  // Plain BEM (`block__element`) is kept.
  if (/__[A-Za-z0-9]{5,}$/.test(name)) {
    const suffix = name.slice(name.lastIndexOf("__") + 2);
    if (/[A-Z0-9]/.test(suffix)) return false;
  }
  return true;
}

/** True if an id looks hand-written rather than framework-generated. */
export function looksAuthoredId(id: string): boolean {
  if (!id) return false;
  if (/[0-9a-f]{6}/i.test(id)) return false;
  if (/^(radix-|headlessui-|mui-|rc_|:r|__)/i.test(id)) return false;
  if (/\d{3,}/.test(id)) return false;
  return true;
}
