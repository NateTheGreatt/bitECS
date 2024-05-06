const NBODIES = 3000; // Number of entities
const BASE_MASS = 0.1; // Base mass
const VAR_MASS = 0.8; // Amount of randomness added to mass
const INITIAL_C = 12000; // Mass used in calculation of orbital speed
const MAX_RADIUS = 70; // Circle radius. Will be multiplied by ZOOM
const SPEED = 2; // Speed of simulation
const STICKY = 10000; // Reduce acceleration in close encounters
const CENTRAL_MASS = 12000; // Mass of the central mass

export const CONSTANTS = {
  NBODIES,
  BASE_MASS,
  VAR_MASS,
  INITIAL_C,
  MAX_RADIUS,
  SPEED,
  STICKY,
  CENTRAL_MASS,
};
