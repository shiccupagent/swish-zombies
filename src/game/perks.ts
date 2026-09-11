/**
 * ============================================================================
 *  PERK MACHINES — CoD WaW-style purchasable vending machines
 * ============================================================================
 *
 * Each perk is a 3D vending machine placed in the map. The player walks up,
 * presses [E], pays points, and drinks a bottle that grants a persistent buff
 * for the rest of the game (lost on down/death).
 *
 * Perks are ONLY available after the power switch is activated (see power.ts).
 *
 * WaW Perks:
 *   - Juggernog (2500)      → max health 100 → 250
 *   - Speed Cola (3000)     → 50% faster reload
 *   - Double Tap (2000)     → 33% faster fire rate
 *   - Quick Revive (1500)   → solo: self-revive once (consumed on use)
 *
 * ── IMPLEMENTATION NOTES ────────────────────────────────────────────────────
 *
 * Each PerkMachine has a 3D group with:
 *   - A tall rectangular vending machine body (BoxGeometry)
 *   - Colored front panel with the perk's signature color
 *   - A glowing light on top (PointLight) that matches the perk color
 *   - The machine is dark/unlit when power is off
 *
 * The PerkManager holds all machines for the current map and handles:
 *   - Proximity detection for interact prompts
 *   - Purchase validation (points, power, already owned)
 *   - Applying perk effects to player state
 *   - Tracking which perks the player currently holds (max 4)
 *   - Resetting perks on player death/down
 */

import * as THREE from 'three';

export type PerkId = 'juggernog' | 'speed_cola' | 'double_tap' | 'quick_revive';

export interface PerkDef {
  id: PerkId;
  name: string;
  cost: number;
  color: string;        // Signature color for the machine glow and HUD icon
  icon: string;         // Emoji or short symbol for HUD display
  desc: string;         // One-line description shown on interact prompt
}

export const PERK_DEFS: Record<PerkId, PerkDef> = {
  juggernog: {
    id: 'juggernog',
    name: 'Juggernog',
    cost: 2500,
    color: '#ef4444',
    icon: '🥤',
    desc: 'Increases maximum health to 250.',
  },
  speed_cola: {
    id: 'speed_cola',
    name: 'Speed Cola',
    cost: 3000,
    color: '#22c55e',
    icon: '⚡',
    desc: 'Reload 50% faster.',
  },
  double_tap: {
    id: 'double_tap',
    name: 'Double Tap Root Beer',
    cost: 2000,
    color: '#f59e0b',
    icon: '🔫',
    desc: 'Increases fire rate by 33%.',
  },
  quick_revive: {
    id: 'quick_revive',
    name: 'Quick Revive',
    cost: 1500,
    color: '#38bdf8',
    icon: '💙',
    desc: 'Self-revive when downed (one use).',
  },
};

export interface PerkMachineLocation {
  perkId: PerkId;
  x: number;
  z: number;
  rotationY?: number;
}

export interface PerkMachine {
  perkId: PerkId;
  def: PerkDef;
  x: number;
  z: number;
  group: THREE.Group;
  light: THREE.PointLight;
  isPowered: boolean;
}

export class PerkManager {
  machines: PerkMachine[] = [];
  group = new THREE.Group();

  /** Which perks the player currently holds (max 4 in WaW). */
  ownedPerks: Set<PerkId> = new Set();

  /** Quick Revive consumed flag (solo: one use per game). */
  quickReviveUsed = false;

  static readonly MAX_PERKS = 4;

  constructor(locations: PerkMachineLocation[]) {
    // TODO: For each location, build a 3D vending machine mesh:
    //   - Tall box body (~0.8w x 2.0h x 0.6d)
    //   - Colored front panel matching perk color
    //   - Point light on top (off until power is activated)
    //   - Add to this.group
    for (const loc of locations) {
      const def = PERK_DEFS[loc.perkId];
      if (!def) continue;

      const machineGroup = new THREE.Group();
      machineGroup.position.set(loc.x, 0, loc.z);
      if (loc.rotationY) machineGroup.rotation.y = loc.rotationY;

      // Placeholder body — Claude implements the full chunky vending machine
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 2.0, 0.6),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6, metalness: 0.3 }),
      );
      body.position.y = 1.0;
      machineGroup.add(body);

      // Perk-colored front panel
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 1.2, 0.02),
        new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.0 }),
      );
      panel.position.set(0, 1.1, 0.31);
      machineGroup.add(panel);

      // Top light (starts off — activated by power switch)
      const light = new THREE.PointLight(def.color, 0, 6);
      light.position.set(0, 2.2, 0);
      machineGroup.add(light);

      const machine: PerkMachine = {
        perkId: loc.perkId,
        def,
        x: loc.x,
        z: loc.z,
        group: machineGroup,
        light,
        isPowered: false,
      };

      this.machines.push(machine);
      this.group.add(machineGroup);
    }
  }

  /** Called when the power switch is activated. Lights up all machines. */
  activatePower(): void {
    for (const m of this.machines) {
      m.isPowered = true;
      m.light.intensity = 2.0;
      // TODO: Set emissiveIntensity on front panel to ~0.4
    }
  }

  /** Returns the nearest powered, un-owned perk machine within range, or null. */
  getNearby(px: number, pz: number, maxDist = 2.3): PerkMachine | null {
    let best: PerkMachine | null = null;
    let bestDist = maxDist;
    for (const m of this.machines) {
      if (!m.isPowered) continue;
      if (this.ownedPerks.has(m.perkId)) continue;
      const d = Math.hypot(px - m.x, pz - m.z);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    return best;
  }

  /** Purchase a perk. Returns true on success. */
  buy(perkId: PerkId, playerPoints: number): boolean {
    if (this.ownedPerks.size >= PerkManager.MAX_PERKS) return false;
    if (this.ownedPerks.has(perkId)) return false;
    const def = PERK_DEFS[perkId];
    if (!def || playerPoints < def.cost) return false;
    this.ownedPerks.add(perkId);
    return true;
  }

  /** Check if player has a specific perk. */
  has(perkId: PerkId): boolean {
    return this.ownedPerks.has(perkId);
  }

  /** Use Quick Revive self-revive. Returns true if available and consumed. */
  useQuickRevive(): boolean {
    if (!this.ownedPerks.has('quick_revive') || this.quickReviveUsed) return false;
    this.ownedPerks.delete('quick_revive');
    this.quickReviveUsed = true;
    return true;
  }

  /** Reset all owned perks (called on player down). */
  loseAllPerks(): void {
    this.ownedPerks.clear();
  }

  dispose(): void {
    // TODO: dispose geometries and materials
  }
}
