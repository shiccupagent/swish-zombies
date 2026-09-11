/**
 * ============================================================================
 *  DOORS — point-cost debris/doors that open new areas
 * ============================================================================
 *
 * In CoD WaW Zombies, the map starts small. Players spend points to clear
 * debris or open doors, revealing new rooms with more wall buys, perks,
 * mystery box locations, and the power switch.
 *
 * Each door has:
 *   - A cost (750-1250 points typically)
 *   - A 3D mesh blocking a passage (debris pile, metal door, rubble)
 *   - A collision obstacle that is removed when purchased
 *   - An interact prompt showing the cost
 *
 * When purchased, the door mesh animates away (slides, fades, or breaks apart)
 * and the collision is removed, opening the passage.
 *
 * ── MAP INTEGRATION ─────────────────────────────────────────────────────────
 *
 * Maps define door locations with:
 *   - Position and dimensions of the blocking geometry
 *   - Which area it connects to (for the HordeDirector to know which
 *     barricades/spawns become active)
 *   - Cost to open
 *   - Optional: requires power to be on
 */

import * as THREE from 'three';

export interface DoorLocation {
  id: string;
  x: number;
  z: number;
  rotationY?: number;
  /** Width of the door/debris blocking the passage. */
  width: number;
  /** Cost in points to clear this door. */
  cost: number;
  /** If true, this door can only be opened after power is activated. */
  requiresPower?: boolean;
  /** Display name for the interact prompt (e.g. "CLEAR DEBRIS", "OPEN DOOR"). */
  label?: string;
  /** Area ID that becomes accessible when this door opens. */
  opensArea?: string;
}

export interface Door {
  id: string;
  x: number;
  z: number;
  cost: number;
  isOpen: boolean;
  requiresPower: boolean;
  label: string;
  opensArea?: string;
  group: THREE.Group;
  /** Collision radius used while the door is closed. */
  collisionRadius: number;
}

export class DoorManager {
  doors: Door[] = [];
  group = new THREE.Group();

  /** Set of area IDs that have been unlocked. Starts with 'start'. */
  unlockedAreas: Set<string> = new Set(['start']);

  constructor(locations: DoorLocation[]) {
    for (const loc of locations) {
      const doorGroup = new THREE.Group();
      doorGroup.position.set(loc.x, 0, loc.z);
      if (loc.rotationY) doorGroup.rotation.y = loc.rotationY;

      // TODO: Build 3D door/debris mesh:
      //   - For "CLEAR DEBRIS": pile of concrete chunks and rebar
      //   - For "OPEN DOOR": metal/wooden door with frame
      //   - Use chunky BoxGeometry style consistent with Swish Buckets

      // Placeholder blocking geometry
      const blockMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.9 });
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(loc.width, 2.5, 0.5),
        blockMat,
      );
      block.position.y = 1.25;
      doorGroup.add(block);

      // Cost text would be rendered by HUD prompt, not 3D text

      const door: Door = {
        id: loc.id,
        x: loc.x,
        z: loc.z,
        cost: loc.cost,
        isOpen: false,
        requiresPower: loc.requiresPower ?? false,
        label: loc.label ?? 'OPEN DOOR',
        opensArea: loc.opensArea,
        group: doorGroup,
        collisionRadius: loc.width / 2 + 0.3,
      };

      this.doors.push(door);
      this.group.add(doorGroup);
    }
  }

  /** Find nearest closed door within interact range. */
  getNearby(px: number, pz: number, isPowerOn: boolean, maxDist = 2.5): Door | null {
    let best: Door | null = null;
    let bestDist = maxDist;
    for (const d of this.doors) {
      if (d.isOpen) continue;
      if (d.requiresPower && !isPowerOn) continue;
      const dist = Math.hypot(px - d.x, pz - d.z);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  }

  /** Purchase and open a door. Returns true on success. */
  open(doorId: string, playerPoints: number): boolean {
    const d = this.doors.find(x => x.id === doorId);
    if (!d || d.isOpen || playerPoints < d.cost) return false;

    d.isOpen = true;
    d.group.visible = false; // TODO: animate away instead of instant hide
    if (d.opensArea) {
      this.unlockedAreas.add(d.opensArea);
    }
    return true;
  }

  /** Check if a specific area is unlocked. */
  isAreaUnlocked(areaId: string): boolean {
    return this.unlockedAreas.has(areaId);
  }

  /** Get collision obstacles for all closed doors (for player/zombie pathing). */
  getActiveColliders(): Array<{ x: number; z: number; radius: number }> {
    return this.doors
      .filter(d => !d.isOpen)
      .map(d => ({ x: d.x, z: d.z, radius: d.collisionRadius }));
  }

  dispose(): void {
    // TODO: dispose geometries and materials
  }
}
