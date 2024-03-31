type PairType = string | number | object;
export type Pair = { relation: PairType; target: PairType };
const pairsMap = new Map<PairType, Map<PairType, Pair>>();
export const Pair = (relation: PairType, target: PairType) => {
  // If a is not in the Map, add it.
  if (!pairsMap.has(relation)) {
    pairsMap.set(relation, new Map<PairType, Pair>());
  }

  const innerMap = pairsMap.get(relation) as Map<PairType, Pair>;

  // If b is not in the inner Map, add it with a new value.
  if (!innerMap.has(target)) {
    innerMap.set(target, { relation, target });
  }

  return innerMap.get(target);
};