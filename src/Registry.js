export const Registry = ({ maxEntities, maxGenerations }) => ({
  entities: Array.from(
    { length: maxGenerations },
    () => new Uint32Array(maxEntities)
  ),
  components: {},
  systems: {}
})
