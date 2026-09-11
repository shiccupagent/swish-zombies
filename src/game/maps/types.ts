/**
 * ============================================================================
 *  MAP TYPES — contract for all zombie maps (CoD WaW faithful)
 * ============================================================================
 *
 * Every map must provide positions for all CoD WaW Zombies entities:
 *   - Barricade windows (where zombies spawn through)
 *   - Purchasable doors (area progression)
 *   - Perk machine locations (only active after power)
 *   - Power switch location
 *   - Wall buy chalk outlines
 *   - Mystery Box location(s)
 *   - Pack-a-Punch location
 *   - Map obstacles (collision geometry)
 *   - Floor definitions for multi-level verticality
 *   - Stairs/ramps connecting floors
 *
 * Removed from previous version:
 *   - extractionActive / extractionTimeLeft (no extraction — infinite survival)
 *   - bossActive / bossHpRatio (no scripted boss — WaW has none)
 */

import * as THREE from 'three';
import type { WallBuyLocation } from '../wallBuys.ts';
import type { BarricadeLocation } from '../barricades.ts';
import type { DoorLocation } from '../doors.ts';
import type { PerkMachineLocation } from '../perks.ts';
import type { PowerSwitchLocation } from '../power.ts';

/** Live scoreboard data fed to jumbotron and map HUD elements. */
export interface JumbotronInfo {
  round: number;
  zombiesAlive: number;
  totalZombies: number;
  score: number;
  /** Currently active power-up names for display. */
  activePowerUps: string[];
  banner: string;
  isPowerOn: boolean;
}

export interface MapObstacle {
  x: number;
  z: number;
  radius: number;
  height: number;
  isCover?: boolean;
  /** Which floor this obstacle belongs to (default 0 = ground). */
  floor?: number;
}

// ── VERTICALITY ─────────────────────────────────────────────────────────────

/**
 * A FLOOR is a flat walkable surface at a specific Y height.
 *
 * In CoD WaW, Nacht der Untoten has a ground floor and an upstairs area
 * connected by stairs. The player's Y position snaps to whichever floor
 * they are standing on, based on XZ bounds + a ramp/stair connection.
 *
 * The ground floor (index 0) is always at y=0. Upper floors have y > 0.
 * Each floor defines its own walkable rectangular bounds — the player can
 * only be on a floor if their XZ position is within that floor's bounds.
 * This keeps the height system simple: no continuous Y-axis physics, just
 * discrete floor snapping with smooth stair interpolation.
 */
export interface FloorDef {
  /** Floor index (0 = ground, 1 = second floor, etc). */
  index: number;
  /** Display name (e.g. "Ground Floor", "Upper Balcony"). */
  name: string;
  /** The Y height of this floor's walking surface. */
  y: number;
  /** Walkable XZ bounds on this floor. */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /**
   * Optional area ID — if set, this floor is only accessible after
   * the corresponding door is purchased.
   */
  areaId?: string;
}

/**
 * A STAIRCASE connects two floors. It defines a ramp region where the
 * player's Y position interpolates linearly between the lower and upper
 * floor heights.
 *
 * The stair is an axis-aligned ramp: the player's progress along the
 * ramp axis (X or Z) determines their Y height. This is simple to
 * implement and handles the CoD WaW case well (straight staircases).
 *
 * Zombies use stairs too — their pathfinding considers stairs as
 * connections between floor nav regions.
 */
export interface StairDef {
  /** Unique id for this staircase. */
  id: string;
  /** The lower floor index. */
  fromFloor: number;
  /** The upper floor index. */
  toFloor: number;
  /** XZ bounds of the stair ramp region. */
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /**
   * Which axis the ramp runs along ('x' or 'z').
   * The player's position along this axis within bounds determines
   * their height interpolation between the two connected floors.
   */
  rampAxis: 'x' | 'z';
  /**
   * Direction of the ramp along the axis.
   * 'positive' = moving in +axis direction goes UP.
   * 'negative' = moving in -axis direction goes UP.
   */
  rampDirection: 'positive' | 'negative';
  /** 3D geometry group for the stair mesh (optional — map builds it). */
  group?: THREE.Group;
}

/**
 * A RAILING or LEDGE WALL is a collision barrier on a floor edge that
 * prevents the player from walking off the upper floor into the void.
 * It's a simple line segment with a collision radius.
 */
export interface RailingDef {
  /** Start point (XZ). */
  x1: number; z1: number;
  /** End point (XZ). */
  x2: number; z2: number;
  /** Which floor this railing is on. */
  floor: number;
  /** Collision thickness (default 0.3). */
  thickness?: number;
}

export interface ZombieMap {
  id: string;
  name: string;
  desc?: string;

  /** Outer playable area bounds (encompasses all floors). */
  courtBounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  /** Map obstacles for collision (hoop stanchions, pillars, etc). */
  obstacles: MapObstacle[];

  // ── Verticality ───────────────────────────────────────────────────────────

  /**
   * All walkable floor definitions. Must include at least one floor (index 0
   * at y=0). Single-floor maps just have one entry here.
   */
  floors: FloorDef[];

  /** Staircases connecting floors. Empty for single-floor maps. */
  stairs: StairDef[];

  /** Railings preventing falls on upper floors. */
  railings: RailingDef[];

  // ── CoD WaW Map Entities ──────────────────────────────────────────────────

  /** Window barricade positions where zombies tear through. */
  barricades: BarricadeLocation[];

  /** Purchasable doors/debris for area progression. */
  doors: DoorLocation[];

  /** Wall-buy chalk outline positions. */
  wallBuys: WallBuyLocation[];

  /** Mystery Box spawn position. */
  mysteryBoxPos: { x: number; z: number; yaw?: number; floor?: number };

  /** Pack-a-Punch machine position. */
  packAPunchPos: { x: number; z: number; yaw?: number; floor?: number };

  /** Perk machine locations (dark until power is on). */
  perkLocations: PerkMachineLocation[];

  /** Power switch location. null = power is always on (e.g. Nacht). */
  powerSwitchPos: PowerSwitchLocation | null;

  // ── Visual ────────────────────────────────────────────────────────────────

  ambientColor?: string;
  fogColor?: string;

  /** Root Three.js group containing all map geometry. */
  group: THREE.Group;

  /** Stamp a blood decal onto the floor at world coordinates. */
  addBloodDecal(worldX: number, worldZ: number, radius: number): void;

  /** Per-frame update (jumbotron rotation, light animations, etc). */
  update(dt: number, info: JumbotronInfo): void;

  /** Clean up all GPU resources. */
  dispose(): void;
}

// ── FLOOR RESOLUTION HELPERS ────────────────────────────────────────────────

/**
 * Determine what Y height an entity should be at, given their XZ position
 * and the map's floor/stair definitions.
 *
 * Priority:
 *   1. If standing on a staircase → interpolate between connected floors
 *   2. If within an upper floor's bounds → that floor's Y
 *   3. Otherwise → ground floor (y=0)
 *
 * This is the ONE function that resolves Y for both the player and zombies.
 */
export function resolveFloorY(
  x: number,
  z: number,
  map: ZombieMap,
  /** Set of area IDs the entity can access (for locked floors). */
  unlockedAreas?: Set<string>,
): number {
  // Check stairs first (they overlap floor bounds at the edges)
  for (const stair of map.stairs) {
    if (
      x >= stair.bounds.minX && x <= stair.bounds.maxX &&
      z >= stair.bounds.minZ && z <= stair.bounds.maxZ
    ) {
      const fromFloor = map.floors.find(f => f.index === stair.fromFloor);
      const toFloor = map.floors.find(f => f.index === stair.toFloor);
      if (!fromFloor || !toFloor) continue;

      // Check area access for the upper floor
      if (toFloor.areaId && unlockedAreas && !unlockedAreas.has(toFloor.areaId)) continue;

      // Interpolate Y based on position along ramp axis
      let t: number;
      if (stair.rampAxis === 'x') {
        t = (x - stair.bounds.minX) / (stair.bounds.maxX - stair.bounds.minX);
      } else {
        t = (z - stair.bounds.minZ) / (stair.bounds.maxZ - stair.bounds.minZ);
      }
      if (stair.rampDirection === 'negative') t = 1 - t;

      return fromFloor.y + t * (toFloor.y - fromFloor.y);
    }
  }

  // Check upper floors (highest first so upper floors take priority)
  const sortedFloors = [...map.floors].sort((a, b) => b.y - a.y);
  for (const floor of sortedFloors) {
    if (floor.index === 0) continue; // ground is fallback
    if (floor.areaId && unlockedAreas && !unlockedAreas.has(floor.areaId)) continue;
    if (
      x >= floor.bounds.minX && x <= floor.bounds.maxX &&
      z >= floor.bounds.minZ && z <= floor.bounds.maxZ
    ) {
      return floor.y;
    }
  }

  // Default: ground floor
  return 0;
}

/**
 * Check collision against railings on the entity's current floor.
 * Returns adjusted (x, z) after pushing the entity away from any railing.
 */
export function collideRailings(
  x: number,
  z: number,
  currentFloorY: number,
  map: ZombieMap,
): { x: number; z: number } {
  for (const rail of map.railings) {
    const railFloor = map.floors.find(f => f.index === rail.floor);
    if (!railFloor || Math.abs(railFloor.y - currentFloorY) > 0.5) continue;

    const thickness = rail.thickness ?? 0.3;

    // Line segment collision: project point onto segment, push away if too close
    const dx = rail.x2 - rail.x1;
    const dz = rail.z2 - rail.z1;
    const len2 = dx * dx + dz * dz;
    if (len2 < 0.001) continue;

    let t = ((x - rail.x1) * dx + (z - rail.z1) * dz) / len2;
    t = Math.max(0, Math.min(1, t));

    const closestX = rail.x1 + t * dx;
    const closestZ = rail.z1 + t * dz;
    const distX = x - closestX;
    const distZ = z - closestZ;
    const dist = Math.hypot(distX, distZ);

    if (dist < thickness && dist > 0.001) {
      x = closestX + (distX / dist) * thickness;
      z = closestZ + (distZ / dist) * thickness;
    }
  }

  return { x, z };
}
