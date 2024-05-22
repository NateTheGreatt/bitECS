# bitECS

`bitECS` is a functional and minimal ECS written in TypeScript with low-opinionation.

-   [**bitECS Classic**](./packages/classic/README.md) - A classic flavor of bitECS.
-   [**Utils**](/packages/utils/README.md) - Useful ECS utilities.

## What is an ECS?

ECS is data-oriented design pattern for apps. In brief, it lets you treat your app as a live database where components are composable stores of data, entities point to collections of components and systems are functions that update data in components based on queries. Importantly, data is separated from behavior (described by systems), such that behavior becomes fully modular and composable.

For in-depth resources check out:

-   [What Is ECS? by Sanders Marten](https://github.com/SanderMertens/ecs-faq?tab=readme-ov-file#what-is-ecs)
-   [Data-Oriented Design by Richard Fabian](https://www.dataorienteddesign.com/dodmain/)
-   [Overwatch Gameplay Architecture and Netcode by Tim Ford](https://www.youtube.com/watch?v=W3aieHjyNvw)

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
