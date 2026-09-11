/**
 * ============================================================================
 *  POWER SWITCH — activates electricity for the map
 * ============================================================================
 *
 * In CoD WaW Zombies, the power switch is a lever/panel on the wall that
 * the player must find and activate (press [E]). Until the power is on:
 *   - Perk machines are dark and non-functional
 *   - Pack-a-Punch is inaccessible (in maps where it's behind power)
 *   - Certain doors/areas may require power
 *   - Electric traps are offline
 *
 * The power switch is FREE to activate — it just requires reaching it.
 *
 * ── 3D REPRESENTATION ───────────────────────────────────────────────────────
 *
 * A wall-mounted industrial breaker panel:
 *   - Metal box frame on the wall
 *   - Large red lever handle (rotates on activation)
 *   - Status light: red (off) → green (on)
 *   - Sparks particle burst on activation
 *   - All map lights brighten on activation
 */

import * as THREE from 'three';

export interface PowerSwitchLocation {
  x: number;
  z: number;
  rotationY?: number;
}

export class PowerSwitch {
  x: number;
  z: number;
  group = new THREE.Group();
  isActivated = false;
  statusLight: THREE.PointLight;

  constructor(location: PowerSwitchLocation) {
    this.x = location.x;
    this.z = location.z;
    this.group.position.set(location.x, 0, location.z);
    if (location.rotationY) this.group.rotation.y = location.rotationY;

    // TODO: Build 3D breaker panel mesh:
    //   - Wall-mounted metal box (BoxGeometry ~0.6w x 0.8h x 0.15d)
    //   - Red lever handle (BoxGeometry, pivots on activation)
    //   - Status indicator light

    // Placeholder box
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.8, 0.15),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.6 }),
    );
    panel.position.y = 1.2;
    this.group.add(panel);

    // Status light (red = off)
    this.statusLight = new THREE.PointLight('#ef4444', 1.0, 4);
    this.statusLight.position.set(0, 1.8, 0.1);
    this.group.add(this.statusLight);
  }

  /** Check if player is within interact range. */
  isNearby(px: number, pz: number, maxDist = 2.0): boolean {
    return Math.hypot(px - this.x, pz - this.z) < maxDist;
  }

  /** Activate the power. Returns true if it was off and is now on. */
  activate(): boolean {
    if (this.isActivated) return false;
    this.isActivated = true;

    // Switch status light to green
    this.statusLight.color.set('#22c55e');
    this.statusLight.intensity = 2.0;

    // TODO: Animate lever rotation from down to up
    // TODO: Spawn sparks particle burst
    // TODO: Brighten all map ambient lights

    return true;
  }

  /** Returns interact prompt text, or null if not in range or already on. */
  getPrompt(px: number, pz: number): string | null {
    if (this.isActivated) return null;
    if (!this.isNearby(px, pz)) return null;
    return '[E] ACTIVATE POWER';
  }

  dispose(): void {
    // TODO: dispose geometries and materials
  }
}
