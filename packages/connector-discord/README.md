# @tracepoint-dev/connector-discord

Formats a [Tracepoint](../../README.md) report payload as a Discord webhook message.
Runs inside your receiver (serverless function / server), never in the browser.

**Status:** M0 scaffold — `toDiscordMessage()` is a stub. Real formatting (embed +
screenshot attachment via multipart) lands in milestone M3, alongside the receiver
templates in `examples/`.

Discord is the reference connector because its webhooks accept file attachments, so
the screenshot can be shown inline. Slack / GitHub / Linear connectors follow in Phase 3.
