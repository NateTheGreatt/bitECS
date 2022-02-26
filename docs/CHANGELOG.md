## 0.0.35
02-26-2022

### Added

  - `entityExists` - checks the existence of entities
  - `getWorldComponents` - returns all components registered to a world
  - `createWorld` now takes a `size` argument
  - `defineComponent` now takes a `size` argument

### Fixed

  - entity IDs are now recycled after 1% of max entities have been removed to prevent false-positive returns from `entityExists`
