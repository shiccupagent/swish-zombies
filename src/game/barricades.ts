/**
 * ============================================================================
 *  BARRICADES — window/door barricades that zombies tear down
 * ============================================================================
 *
 * In CoD WaW Zombies, zombies don't just spawn in the open. They claw through
 * boarded-up windows. Each barricade has 1-6 wooden boards. Zombies arrive at
 * a barricade, tear boards off one by one (with audio cues), then climb through.
 *
 * The player can walk up to a damaged barricade and press [E] to rebuild boards
 * one at a time, earning 10 points per board repaired.
 *
 * The "Carpenter" power-up instantly repairs ALL barricades.
 *
 * ── 3D REPRESENTATION ───────────────────────────────────────────────────────
 *
 * Each barricade is a window frame (tall rectangular opening in a wall) with
 * horizontal wooden planks across it. Boards are individual BoxGeometry meshes
 * that can be individually removed (hidden) and restored.
 *
 * Zombies assigned to a barricade:
 *   1. Path to the barricade position
 *   2. Stand at the barricade and "tear" boards (remove one every ~2s)
 *   3. Once all boards are removed, climb through and path to player
 *
 * ── SPAWN FLOW ──────────────────────────────────────────────────────────────
 *
 * Instead of spawning zombies in the open, the HordeDirector assigns each
 * new zombie to a random barricade. The zombie spawns behind the barricade
 * (outside the playable area) and must tear through to reach the player.
 */

import * as THREE from 'three';

export interface BarricadeLocation {
  /** World position of the barricade center. */
  x: number;
  z: number;
  /** Rotation of the barricade (faces inward toward the playable area). */
  rotationY: number;
  /** How many boards this barricade starts with (default 6). */
  maxBoards?: number;
  /** Spawn point offset: where zombies appear BEHIND this barricade. */
  spawnOffsetX?: number;
  spawnOffsetZ?: number;
}

export interface Barricade {
  id: string;
  x: number;
  z: number;
  rotationY: number;
  /** Current number of intact boards (0 = fully open). */
  boards: number;
  maxBoards: number;
  /** The 3D group containing the window frame and board meshes. */
  group: THREE.Group;
  /** Individual board meshes for show/hide. */
  boardMeshes: THREE.Mesh[];
  /** World-space position where zombies spawn behind this barricade. */
  spawnPoint: THREE.Vector3;
  /** World-space position where zombies stand to tear boards. */
  tearPoint: THREE.Vector3;
  /** World-space position where zombies enter the playable area after breaking through. */
  entryPoint: THREE.Vector3;
}

export class BarricadeManager {
  barricades: Barricade[] = [];
  group = new THREE.Group();

  constructor(locations: BarricadeLocation[]) {
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i]!;
      const maxBoards = loc.maxBoards ?? 6;

      const barricadeGroup = new THREE.Group();
      barricadeGroup.position.set(loc.x, 0, loc.z);
      barricadeGroup.rotation.y = loc.rotationY;

      // TODO: Build window frame mesh (dark wood or concrete frame)
      // TODO: Build individual horizontal board meshes stacked vertically
      //   - Each board: BoxGeometry(1.2, 0.15, 0.06), wooden material
      //   - Spaced evenly across the window opening
      //   - Visible when boards > 0, hidden from top down as boards decrease

      const boardMeshes: THREE.Mesh[] = [];
      const boardMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.85 });

      for (let b = 0; b < maxBoards; b++) {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.15, 0.06),
          boardMat,
        );
        board.position.y = 0.4 + b * 0.22;
        barricadeGroup.add(board);
        boardMeshes.push(board);
      }

      // Calculate spawn/tear/entry points based on rotation
      const sin = Math.sin(loc.rotationY);
      const cos = Math.cos(loc.rotationY);
      const offsetX = loc.spawnOffsetX ?? sin * 3.0;
      const offsetZ = loc.spawnOffsetZ ?? cos * 3.0;

      const barricade: Barricade = {
        id: `barricade_${i}`,
        x: loc.x,
        z: loc.z,
        rotationY: loc.rotationY,
        boards: maxBoards,
        maxBoards,
        group: barricadeGroup,
        boardMeshes,
        spawnPoint: new THREE.Vector3(loc.x + offsetX, 0, loc.z + offsetZ),
        tearPoint: new THREE.Vector3(loc.x + sin * 0.8, 0, loc.z + cos * 0.8),
        entryPoint: new THREE.Vector3(loc.x - sin * 0.8, 0, loc.z - cos * 0.8),
      };

      this.barricades.push(barricade);
      this.group.add(barricadeGroup);
    }
  }

  /** Remove one board from a barricade. Returns true if a board was removed. */
  tearBoard(barricadeId: string): boolean {
    const b = this.barricades.find(x => x.id === barricadeId);
    if (!b || b.boards <= 0) return false;
    b.boards--;
    // Hide the top-most visible board
    if (b.boardMeshes[b.boards]) {
      b.boardMeshes[b.boards]!.visible = false;
    }
    return true;
  }

  /** Repair one board on a barricade. Returns true if a board was added. */
  repairBoard(barricadeId: string): boolean {
    const b = this.barricades.find(x => x.id === barricadeId);
    if (!b || b.boards >= b.maxBoards) return false;
    // Show the next board
    if (b.boardMeshes[b.boards]) {
      b.boardMeshes[b.boards]!.visible = true;
    }
    b.boards++;
    return true;
  }

  /** Repair ALL barricades fully (Carpenter power-up). */
  repairAll(): void {
    for (const b of this.barricades) {
      while (b.boards < b.maxBoards) {
        this.repairBoard(b.id);
      }
    }
  }

  /** Is a barricade fully broken through (all boards removed)? */
  isOpen(barricadeId: string): boolean {
    const b = this.barricades.find(x => x.id === barricadeId);
    return !!b && b.boards <= 0;
  }

  /** Find the nearest repairable barricade within range. */
  getNearbyRepairable(px: number, pz: number, maxDist = 2.0): Barricade | null {
    let best: Barricade | null = null;
    let bestDist = maxDist;
    for (const b of this.barricades) {
      if (b.boards >= b.maxBoards) continue;
      const d = Math.hypot(px - b.x, pz - b.z);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }
    return best;
  }

  /** Get a random barricade for zombie spawn assignment. */
  getRandomBarricade(): Barricade | null {
    if (this.barricades.length === 0) return null;
    return this.barricades[Math.floor(Math.random() * this.barricades.length)]!;
  }

  dispose(): void {
    // TODO: dispose geometries and materials
  }
}
