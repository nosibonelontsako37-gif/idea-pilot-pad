<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- AI calls go through `src/lib/ai.server.ts` (`callAi`) via the Lovable AI Gateway Responses API, wrapped by `createServerFn` in `src/lib/ai.functions.ts`; the key stays server-side and every feature has a labeled local-rule fallback in `src/lib/fallbacks.ts` when the server reports AI unavailable.
- App data (tasks, drafts, notes, plans) persists in browser localStorage under `smartwork:` keys via `src/lib/store.ts` — no database by design.
- Design tokens live in `src/styles.css` (oklch, warm paper + deep green, Fraunces display / Instrument Sans body); components use semantic tokens and `@utility` classes, never hardcoded colors.
