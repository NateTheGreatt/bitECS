import { resetGlobals, getDefaultSize } from "../../src/index.js";
import { describe, it, afterEach } from "bun:test";

const defaultSize = getDefaultSize();

const growAmount = defaultSize + defaultSize / 2;

describe("World Integration Tests", () => {
  afterEach(() => {
    resetGlobals();
  });
  it("is not tested", () => {});
});
