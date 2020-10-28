export const Registry = ({ maxEntities, maxComponentTypes }) => ({
  entities: Array(Math.ceil(maxComponentTypes / 32)).fill(null).map(() => new Uint32Array(maxEntities)),
  components: {},
  systems: {}
})
