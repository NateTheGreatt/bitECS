import { QueryNode } from "../query/types";

export interface Component extends Object {}

export interface ComponentNode {
  generationId: number;
  bitflag: number;
  ref: Component;
  queries: Set<QueryNode>;
}
