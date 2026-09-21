# gemini-enhancer-pro — Repository Agent Contract

Public Chrome Manifest V3 extension that enhances the Gemini web UI. This contract is self-contained; do not depend on private yamamon-lab paths or private instructions.

- Preserve existing Vite/TypeScript/Manifest V3 architecture and read `docs/features.md` only when the change affects feature behavior.
- `gemini.google.com` DOM and routes are external contracts. Verify relevant selectors/navigation before changing UI injection; do not assume old markup remains valid.
- Do not capture or transmit Gemini conversation content, cookies, tokens, browser profile data, or other private state unless a feature explicitly requires and documents it.
- Permission/host-match/storage changes require a focused security/privacy review before implementation is considered complete.
- Code changes: run `pnpm build` and the smallest relevant manual/automated extension check. Do not require a full repo tour for a docs typo.
- Keep `dist/`, browser profiles, secrets, local state, and generated artifacts out of Git.
- Publication to an extension store is a separate explicitly authorized operation.
