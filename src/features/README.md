# Feature modules

Domain-specific UI, hooks, and utilities live here. Pages in `src/pages/` should stay thin and compose feature exports.

```
features/
  tournaments/
    hooks/       # reducers and data hooks
    utils/       # pure tournament helpers
  rankings/      # (components colocated in pages for now)
```

Shared cross-feature code belongs in `src/lib/` or `src/components/shared/`.
