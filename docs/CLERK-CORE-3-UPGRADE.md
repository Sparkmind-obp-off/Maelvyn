# Clerk Core 3 Upgrade — MAELVYN

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

## Required verification

- [ ] Fresh install with Node >=20.9.0.
- [ ] `npm ls @clerk/react @clerk/clerk-react @clerk/clerk-js` shows the new package and no deprecated React SDK.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` pass.
- [ ] Deployed bundle contains ClerkJS >=6.42.3; verify in browser console with `window.Clerk.version`.
- [ ] Sign in and sign out using the existing Clerk Development instance.
- [ ] API accepts valid new session token and rejects tampered/expired token.
- [ ] Cross-venture authorization and all existing security tests still pass.
- [ ] Confirm no Clerk dashboard protection was weakened or disabled to mask the stale SDK.

## Deployment note

A GitHub source commit alone does not prove Cloudflare Pages has rebuilt or the live site is fixed. Verify the newest Pages deployment is successful, then perform the browser sign-in test. Keep production blocked; this patch is for the existing development app only.
