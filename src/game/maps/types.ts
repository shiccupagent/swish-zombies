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
}

export interface ZombieMap {
  id: string;
  name: string;
  desc?: string;

  /** Playable area bounds. */
  courtBounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  /** Map obstacles for collision (hoop stanchions, pillars, etc). */
  obstacles: MapObstacle[];

  // ── CoD WaW Map Entities ──────────────────────────────────────────────────

  /** Window barricade positions where zombies tear through. */
  barricades: BarricadeLocation[];

  /** Purchasable doors/debris for area progression. */
  doors: DoorLocation[];

  /** Wall-buy chalk outline positions. */
  wallBuys: WallBuyLocation[];

  /** Mystery Box spawn position. */
  mysteryBoxPos: { x: number; z: number; yaw?: number };

  /** Pack-a-Punch machine position. */
  packAPunchPos: { x: number; z: number; yaw?: number };

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
