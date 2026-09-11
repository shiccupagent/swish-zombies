/**
 * ============================================================================
 *  GRENADES — throwable Stielhandgranate (stick grenades)
 * ============================================================================
 *
 * In CoD WaW Zombies, the player starts with 2 stick grenades (Stielhandgranate).
 * Grenades are thrown with [G], have a cook/fuse mechanic, arc through the air,
 * and explode dealing heavy AoE damage to all zombies in the blast radius.
 *
 * Max grenades: 4 (can be refilled by Max Ammo power-up)
 * Damage: 500 (enough to kill most zombies in early rounds)
 * Blast radius: 4m
 * Fuse time: ~2.5s from throw
 *
 * ── 3D REPRESENTATION ───────────────────────────────────────────────────────
 *
 * The grenade in flight:
 *   - Small cylinder body + handle (stick grenade shape)
 *   - Arcing projectile trajectory (affected by gravity)
 *   - Spinning rotation during flight
 *   - Explosion: expanding orange sphere + shockwave ring + PointLight flash
 */

import * as THREE from 'three';

export interface GrenadeInstance {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuseTimer: number;
  group: THREE.Group;
  exploded: boolean;
}

export class GrenadeManager {
  grenades: GrenadeInstance[] = [];
  scene: THREE.Scene;

  static readonly MAX_GRENADES = 4;
  static readonly START_GRENADES = 2;
  static readonly DAMAGE = 500;
  static readonly BLAST_RADIUS = 4.0;
  static readonly FUSE_TIME = 2.5;
  static readonly THROW_SPEED = 12.0;
  static readonly THROW_ARC = 6.0;
  static readonly GRAVITY = -15.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Throw a grenade from the player's position toward the aim direction. */
  throw(px: number, pz: number, aimX: number, aimZ: number): void {
    const dx = aimX - px;
    const dz = aimZ - pz;
    const dist = Math.hypot(dx, dz) || 1;
    const dirX = dx / dist;
    const dirZ = dz / dist;

    const group = new THREE.Group();
    group.position.set(px, 1.0, pz);

    // TODO: Build stick grenade mesh:
    //   - Cylinder body (0.04 radius x 0.12 height) + handle (0.025 radius x 0.15)
    //   - Dark metal + wood material
    // Placeholder
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.7, metalness: 0.5 }),
    );
    group.add(body);

    this.scene.add(group);

    this.grenades.push({
      id: `gren_${Date.now()}`,
      x: px, y: 1.0, z: pz,
      vx: dirX * GrenadeManager.THROW_SPEED,
      vy: GrenadeManager.THROW_ARC,
      vz: dirZ * GrenadeManager.THROW_SPEED,
      fuseTimer: GrenadeManager.FUSE_TIME,
      group,
      exploded: false,
    });
  }

  /**
   * Update all grenades in flight. Returns explosion events for main.ts
   * to apply AoE damage to zombies.
   */
  update(dt: number): Array<{ x: number; z: number; radius: number; damage: number }> {
    const explosions: Array<{ x: number; z: number; radius: number; damage: number }> = [];

    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i]!;

      if (g.exploded) {
        this.scene.remove(g.group);
        this.grenades.splice(i, 1);
        continue;
      }

      // Physics: gravity arc
      g.vy += GrenadeManager.GRAVITY * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;

      // Ground collision
      if (g.y <= 0.05) {
        g.y = 0.05;
        g.vy = Math.abs(g.vy) * 0.3; // small bounce
        g.vx *= 0.6;
        g.vz *= 0.6;
      }

      g.group.position.set(g.x, g.y, g.z);
      g.group.rotation.x += dt * 8; // spin
      g.group.rotation.z += dt * 5;

      // Fuse countdown
      g.fuseTimer -= dt;
      if (g.fuseTimer <= 0) {
        g.exploded = true;
        explosions.push({
          x: g.x,
          z: g.z,
          radius: GrenadeManager.BLAST_RADIUS,
          damage: GrenadeManager.DAMAGE,
        });

        // TODO: Spawn explosion visual (expanding orange sphere, shockwave ring,
        //       PointLight flash, debris particles)
      }
    }

    return explosions;
  }

  dispose(): void {
    for (const g of this.grenades) {
      this.scene.remove(g.group);
    }
    this.grenades = [];
  }
}
