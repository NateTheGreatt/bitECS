import { SPEED } from "../constants";

export function colorFromSpeed(speed: number) {
  let f = (speed / 8) * Math.sqrt(SPEED);
  f = Math.min(f, 1.0);

  let fRed = Math.max(0, f - 0.2) / 0.8;
  let fGreen = Math.max(0, f - 0.7) / 0.3;

  return {
    r: Math.floor(fRed * 255),
    g: Math.floor(fGreen * 255),
    b: Math.floor(f * 155 + 100),
    a: 255,
  };
}
