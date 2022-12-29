import { test, assert } from "vitest"
import { createGraph, createNode, addGraphEdge, isAdjacentAdd, isAdjacentRemove } from "../../src/archetypes/graph"

test('#createGraph', () => {
  const graph = createGraph()

  const rootNode = createNode("")

  const nodeA = createNode("A")
  const nodeB = createNode("B")
  const nodeC = createNode("C")
  const nodeAB = createNode("AB")
  const nodeBC = createNode("BC")
  const nodeABC = createNode("ABC")

  addGraphEdge(graph, rootNode, nodeA)
  addGraphEdge(graph, rootNode, nodeB)
  addGraphEdge(graph, rootNode, nodeC)

  addGraphEdge(graph, nodeA, nodeAB)
  addGraphEdge(graph, nodeB, nodeAB)
  addGraphEdge(graph, nodeB, nodeBC)
  addGraphEdge(graph, nodeC, nodeBC)

  addGraphEdge(graph, nodeAB, nodeABC)
  addGraphEdge(graph, nodeBC, nodeABC)

  // left to right
  assert(isAdjacentAdd(rootNode, nodeA))
  assert(isAdjacentAdd(rootNode, nodeB))
  assert(isAdjacentAdd(rootNode, nodeC))
  
  assert(isAdjacentAdd(nodeA, nodeAB))
  assert(isAdjacentAdd(nodeB, nodeAB))
  assert(isAdjacentAdd(nodeB, nodeBC))
  assert(isAdjacentAdd(nodeC, nodeBC))

  assert(isAdjacentAdd(nodeAB, nodeABC))
  assert(isAdjacentAdd(nodeBC, nodeABC))

  // right to left
  assert(isAdjacentRemove(nodeABC, nodeAB))
  assert(isAdjacentRemove(nodeABC, nodeBC))
  
  assert(isAdjacentRemove(nodeAB, nodeA))
  assert(isAdjacentRemove(nodeAB, nodeB))
  assert(isAdjacentRemove(nodeBC, nodeB))
  assert(isAdjacentRemove(nodeBC, nodeC))
  
  assert(isAdjacentRemove(nodeA, rootNode))
  assert(isAdjacentRemove(nodeB, rootNode))
  assert(isAdjacentRemove(nodeC, rootNode))
})