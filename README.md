# bitECS

`bitECS` is a functional and minimal ECS written in TypeScript with low-opinionation.

## Working with the monorepo

This is a pnpm monorepo, so you know the drill.

```bash
pnpm install
```

### Benches

To benchmark apps, there are two flavors. `sim` will run just the simulation in node with no view while `app` will run the simulation + web view. They are also a good way to test for performance regressions, but also double as code examples.

```bash
pnpm sim n-body #name of the folder
# or
pnpm app n-body
```

### Testing

All packages include tests to catch code regressions.

```bash
pnpm test --filter classic #name of folder
```
