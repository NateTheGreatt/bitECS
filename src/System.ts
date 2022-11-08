import { SystemUpdate, World } from "./Types";

/**
 * Defines a new system function.
 */
export const defineSystem = <TWorld extends World>(update: SystemUpdate<TWorld>) => {
  return (...args: Parameters<typeof update>) => {
    update.apply(null, args);
    return args[0];
  };
};
