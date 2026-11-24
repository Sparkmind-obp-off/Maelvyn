# Clerk Core 3 Upgrade — MAELVYN

**Historical verification note:** The 2026-11-17 Genspark sandbox details are historical execution evidence. The source change and recorded test results remain useful, but current dependency and deployment state must be verified from the repository and dated Production report.


**Date:** 2026-11-17  
**Scope:** Development web client only  
**Reason:** Clerk Development rejected browser authentication because the deployed client used Clerk Core 2 / ClerkJS 5, below the instance's configured minimum version.

## Root cause confirmed

The deployed source declared `@clerk/clerk-react@^5.61.12`. The lockfile resolved it to `5.61.12`, and npm marked that package deprecated in favor of `@clerk/react`. Clerk's current protection defaults to a minimum ClerkJS version of `6.42.3` for newer instances; Core 2 uses ClerkJS 5 and is blocked. This exactly matches the reported sign-in error.

Official references:
- https://clerk.com/docs/guides/protect/protections/require-minimum-clerkjs-version
- https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-3
- https://www.npmjs.com/package/@clerk/react

## Source changes committed

1. Replace `@clerk/clerk-react` with `@clerk/react`.
2. Pin the compatible current Core 3 release range `^6.18.9` (npm latest observed at the time of the fix).
3. Declare Node.js `>=20.9.0`, required by Core 3.
4. Replace `SignedIn` and `SignedOut` with `Show when="signed-in"` and `Show when="signed-out"` in App and Landing.
5. Keep `ClerkProvider`, `SignInButton`, and `UserButton` behavior; server-side session JWT verification is unchanged.

## Lockfile regeneration

The existing npm lockfile encoded the deprecated package and Core 2 dependency graph. It was removed rather than hand-editing an incomplete transitive dependency graph. The next clean install must run:

```bash
npm install
npm run check
```

This regenerates `package-lock.json` from the new dependency graph. Commit the generated lockfile after a clean test run. Do not run `npm ci` until that generated lockfile is committed.

## Additional fix found during verification

The GitHub source commits migrated only `web/src/App.tsx` and `web/src/pages/Landing.tsx`. Two files still imported the removed package and would have broken the build:
- `web/src/main.tsx` (`ClerkProvider`)
- `web/src/lib/hooks.ts` (`useAuth`)

Both now import from `@clerk/react`. `grep -rn "@clerk/clerk-react" web/src` returns nothing.

## Verification results (2026-11-17, Genspark sandbox)

| Check | Result |
|---|---|
| Node / npm | v22.23.4 / 10.9.9 (meets `>=20.9.0`) |
| `npm install` (fresh `node_modules`) | OK, 0 vulnerabilities; `package-lock.json` regenerated |
| `npm ls` | `@clerk/react@6.18.9` → `@clerk/shared@4.46.0`; no `@clerk/clerk-react` |
| SDK runtime selection | `versionSelector` default `6.44.0` → loads `@clerk/clerk-js@6` and `@clerk/ui@1` from the instance FAPI |
| `npm run typecheck` / `lint` / `test` / `build` | all pass (38/38 tests) |
| Built bundle | 0 references to `clerk-react`; 0 secret patterns |
| Dev deployment | `https://b308f69d.maelvyn-dev.pages.dev` (alias `https://maelvyn-dev.pages.dev`) |
| Browser `window.Clerk.version` (live, headless Chromium) | **6.43.0** (≥ minimum 6.42.3) — outdated-SDK error gone |
| Sign-in (Clerk sign-in ticket for synthetic test user) | `status: complete`; `UserButton` rendered |
| API with browser session JWT | `/api/v1/session` 200; tampered JWT 401; no token 401 |
| Sign-out | `Clerk.user` null afterwards |
| Console errors | only the two intentional 401s from the tampered/no-token probes; no CSP violations |
| Clerk dashboard protections | not changed; minimum ClerkJS version left as configured |

Note: npm `latest` for `@clerk/clerk-js` is 6.44.0 while the instance FAPI served 6.43.0 for the `@6` tag at test time; both satisfy the minimum.

## Required verification

- [x] Fresh install with Node >=20.9.0.
- [x] `npm ls @clerk/react @clerk/clerk-react @clerk/clerk-js` shows the new package and no deprecated React SDK.
- [x] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` pass.
- [x] Deployed bundle contains ClerkJS >=6.42.3; verify in browser console with `window.Clerk.version`.
- [x] Sign in and sign out using the existing Clerk Development instance.
- [x] API accepts valid new session token and rejects tampered/expired token.
- [x] Cross-venture authorization and all existing security tests still pass.
- [x] Confirm no Clerk dashboard protection was weakened or disabled to mask the stale SDK.

## Deployment note

A GitHub source commit alone does not prove Cloudflare Pages has rebuilt or the live site is fixed. Verify the newest Pages deployment is successful, then perform the browser sign-in test. Keep production blocked; this patch is for the existing development app only.
