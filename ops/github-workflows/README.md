# CI workflow template

This file is NOT active yet. The Genspark GitHub App used to push this repository does not have
the `workflows` permission, so it cannot create files under `.github/workflows/`.

To activate CI, a repository owner should copy it manually:

```bash
mkdir -p .github/workflows
cp ops/github-workflows/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml && git commit -m "ci: enable typecheck/lint/test/build workflow" && git push
```

Or grant the GitHub App the **Workflows: Read and write** permission and ask the agent to add it.
