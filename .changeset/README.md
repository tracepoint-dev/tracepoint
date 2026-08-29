# Changesets

This folder holds [changesets](https://github.com/changesets/changesets) — one Markdown
file per pending change, describing which packages bump and why.

Add one with `pnpm changeset`, commit it with your PR, and the release workflow turns
accumulated changesets into version bumps + `CHANGELOG.md` entries.

`@tracepoint-dev/demo-app` is ignored (never published).
