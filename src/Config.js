export const Config = ({
  maxEntities = 10000,
  maxComponentTypes = 128,
  tickRate = 30,
  devtools = false
}) => ({
  maxEntities,
  maxComponentTypes,
  tickRate,
  devtools
})
