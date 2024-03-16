# bitecs

To install dependencies:

```bash
bun install
bun run build
```

To benchmark apps, there are two flavors. `sim` will run just the simulation with no view while `app` will run the simulation + web DOM renderer.

```bash
bun run sim n-body # `--bun` to run with Bun instead of Node
# or
bun run app n-body
```
