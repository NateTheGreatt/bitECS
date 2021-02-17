export const Config = ({
  maxEntities = 10000,
  maxComponentTypes = 128,
  tickRate = 30,
  devtools = false
}) => ({
  maxEntities,
  maxComponentTypes,
  maxGenerations: Math.ceil(maxComponentTypes / 32),
  tickRate,
  devtools
})
