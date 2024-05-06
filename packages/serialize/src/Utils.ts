import { Component, TypedArray } from "./types";

/**
 * Creates an internal cache of inputs to outputs for idemponent functions
 *
 * @param fn function to memoize inputs for
 * @returns {function}
 */
const memoize = <TInput, TOutput>(fn: (input: TInput) => TOutput) => {
  const cache = new Map();
  return (input: TInput): TOutput => {
    if (cache.has(input)) return cache.get(input);
    else {
      const output = fn(input);
      cache.set(input, output);
      return output;
    }
  };
};

/**
 * Recursively flattens all of a component's SoA leaf properties into a linear array
 * Function is idemponent, thus safely memoized
 *
 * @param  {object} component
 */
export const flatten: (input: Component) => TypedArray[] = memoize(
  (component: Component) =>
    // get all props on component
    Object.keys(component)
      .sort()
      // flatMap props to
      .flatMap((p) => {
        if (!ArrayBuffer.isView(component[p])) {
          return flatten(component[p]);
        }
        return component[p];
      })
      .flat()
);
