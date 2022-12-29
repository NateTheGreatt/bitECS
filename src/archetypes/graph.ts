export type NodeId = string | number

export type Edge = {
  add?: Node
  remove?: Node
}
export const createEdge = (add?: Node, remove?: Node): Edge => ({ add, remove })

export type Node = {
  id: NodeId
  edges: Map<NodeId, Edge>
}
export const createNode = (id: NodeId): Node => ({
  id,
  edges: new Map(),
})
const addNodeEdge = (a: Node, b: Node) => {
  let abEdge = a.edges.get(b.id)
  if (!abEdge) abEdge = createEdge()
  abEdge.add = b

  let baEdge = b.edges.get(a.id)
  if (!baEdge) baEdge = createEdge()
  baEdge.remove = a

  a.edges.set(b.id, abEdge)
  b.edges.set(a.id, baEdge)
}
const removeNodeEdge = (a: Node, b: Node) => {
  a.edges.delete(b.id)
  b.edges.delete(a.id)
}

export const isAdjacentAdd = (a: Node, b: Node) => a.edges.get(b.id)?.add
export const isAdjacentRemove = (a: Node, b: Node) => a.edges.get(b.id)?.remove

export type Graph = {
  nodes: Map<any, Node>
}
export const createGraph = (nodes: Map<any, Node> = new Map()) => ({ nodes })

// export const addGraphNode = <T>(graph: Graph, value: T): Node<T> => {
//   if(graph.nodes.has(value)) {
//     return graph.nodes.get(value);
//   }
//   const node = createNode<T>(value);
//   graph.nodes.set(value, node);
//   return node;
// }

const removeGraphNode = (graph: Graph, id: NodeId) => {
  const current = graph.nodes.get(id);
  if(current) {
    for (const node of graph.nodes.values()) {
      removeNodeEdge(current, node)
    }
  }
  return graph.nodes.delete(id);
}

export const addGraphEdge = (graph: Graph, source: Node, destination: Node) => {
  addNodeEdge(source, destination)
  graph.nodes.set(source.id, source)
  graph.nodes.set(destination.id, destination)
}

// const removeGraphEdge = <A, B extends A>(graph: Graph, source: Node, destination: Node) => {
//   const sourceNode = graph.nodes.get(source);
//   const destinationNode = graph.nodes.get(destination);

//   if(sourceNode && destinationNode) {
//     removeNodeEdge(source, destination)
//   }

//   return [sourceNode, destinationNode];
// }
