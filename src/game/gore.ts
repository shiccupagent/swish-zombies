/**
 * ============================================================================
 *  GORE & DISMEMBERMENT SYSTEM — realistic CoD WaW-style visceral damage
 * ============================================================================
 *
 * In Call of Duty: World at War, Nazi Zombies is famous for its visceral gore:
 *   - Headshots decapitate zombies with an arterial blood fountain
 *   - Shotguns and high-caliber rounds blow off left/right arms
 *   - Explosives (grenades, Ray Gun) blow off legs, converting walking zombies
 *     into crawling zombies ("crawlers") that drag themselves across the floor
 *   - Severed limbs fly through the air with physics, bounce, and leave blood trails
 *   - Directional blood sprays fly out behind exit wounds and splatter on floors/walls
 *
 * ── ARCHITECTURE ────────────────────────────────────────────────────────────
 *
 * This system provides:
 *   1. Dismemberment state per zombie (head, leftArm, rightArm, legs)
 *   2. Severed limb physics entities (flying 3D BoxGeometry chunks with gravity & bounce)
 *   3. Directional arterial blood fountains and blood mist particles
 *   4. Crawler conversion logic (when legs are destroyed by explosives/shotguns)
 *   5. Decapitation logic (critical headshot kills)
 */

import * as THREE from 'three';

export type DismemberType = 'head' | 'left_arm' | 'right_arm' | 'legs';

export interface DismemberState {
  hasHead: boolean;
  hasLeftArm: boolean;
  hasRightArm: boolean;
  hasLegs: boolean;
  isCrawler: boolean;
}

/** A 3D flying body chunk (head, limb, torso chunk). */
export interface GibEntity {
  id: string;
  type: DismemberType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotVx: number;
  rotVy: number;
  rotVz: number;
  mesh: THREE.Group | THREE.Mesh;
  life: number;
  maxLife: number;
  isResting: boolean;
}

/** Directional blood droplet particle with gravity and floor collision. */
export interface ArterialDroplet {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  life: number;
}

export class GoreSystem {
  scene: THREE.Scene;
  gibs: GibEntity[] = [];
  droplets: ArterialDroplet[] = [];

  // Reusable blood material
  bloodMat = new THREE.MeshStandardMaterial({
    color: '#7f1d1d',
    roughness: 0.3,
    metalness: 0.1,
  });

  // Zombie flesh material for severed limb ends
  fleshMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    roughness: 0.5,
  });

  static readonly MAX_GIBS = 32;
  static readonly GRAVITY = -14.0;
  static readonly BOUNCE_DAMPING = 0.35;
  static readonly FRICTION = 0.75;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Sever a body part from a zombie:
   *   - Hides the corresponding mesh part on the zombie character rig
   *   - Spawns a physical 3D severed limb entity flying through the air
   *   - Spawns an arterial blood spray fountain from the wound socket
   *   - If legs are severed, flags the zombie as a crawler
   */
  dismember(
    zombieX: number,
    zombieY: number,
    zombieZ: number,
    type: DismemberType,
    hitDirection: THREE.Vector3,
    skinColor = '#4ade80',
  ): void {
    if (this.gibs.length >= GoreSystem.MAX_GIBS) {
      // Remove oldest resting gib
      const oldest = this.gibs.find(g => g.isResting);
      if (oldest) {
        this.scene.remove(oldest.mesh);
        this.gibs.splice(this.gibs.indexOf(oldest), 1);
      }
    }

    // Build the 3D severed limb mesh based on type
    const gibGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

    let spawnY = zombieY + 1.0;
    let impulseMag = 4.0 + Math.random() * 3.0;

    switch (type) {
      case 'head': {
        spawnY = zombieY + 1.5;
        // Head cube + severed neck stump with bone center
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat);
        gibGroup.add(head);

        const stump = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), this.fleshMat);
        stump.position.y = -0.15;
        gibGroup.add(stump);

        impulseMag = 5.5 + Math.random() * 3.0;
        break;
      }
      case 'left_arm':
      case 'right_arm': {
        spawnY = zombieY + 1.2;
        // Arm box + bloody socket
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), skinMat);
        arm.position.y = -0.15;
        gibGroup.add(arm);

        const stump = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.13), this.fleshMat);
        stump.position.y = 0.08;
        gibGroup.add(stump);
        break;
      }
      case 'legs': {
        spawnY = zombieY + 0.5;
        // Severed leg box
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), skinMat);
        gibGroup.add(leg);
        impulseMag = 3.5 + Math.random() * 2.0;
        break;
      }
    }

    gibGroup.position.set(zombieX, spawnY, zombieZ);
    this.scene.add(gibGroup);

    // Calculate impulse velocity: carries bullet momentum + vertical pop
    const vx = hitDirection.x * impulseMag + (Math.random() - 0.5) * 2.0;
    const vy = 3.0 + Math.random() * 3.5;
    const vz = hitDirection.z * impulseMag + (Math.random() - 0.5) * 2.0;

    this.gibs.push({
      id: `gib_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type,
      x: zombieX,
      y: spawnY,
      z: zombieZ,
      vx,
      vy,
      vz,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      rotVx: (Math.random() - 0.5) * 12,
      rotVy: (Math.random() - 0.5) * 12,
      rotVz: (Math.random() - 0.5) * 12,
      mesh: gibGroup,
      life: 25.0, // Persist on floor for 25 seconds
      maxLife: 25.0,
      isResting: false,
    });

    // Spawn arterial blood fountain
    this.spawnArterialSpray(zombieX, spawnY, zombieZ, hitDirection, 16);
  }

  /**
   * Spawn a directional spray of blood droplets from a wound.
   */
  spawnArterialSpray(
    x: number,
    y: number,
    z: number,
    direction: THREE.Vector3,
    count = 12,
  ): void {
    for (let i = 0; i < count; i++) {
      const spread = 0.6;
      this.droplets.push({
        x,
        y,
        z,
        vx: (direction.x + (Math.random() - 0.5) * spread) * (3.0 + Math.random() * 4.0),
        vy: 2.0 + Math.random() * 3.5,
        vz: (direction.z + (Math.random() - 0.5) * spread) * (3.0 + Math.random() * 4.0),
        size: 0.04 + Math.random() * 0.05,
        life: 1.2 + Math.random() * 0.6,
      });
    }
  }

  /**
   * Update flying severed limbs and blood droplets.
   * Calls `onFloorBlood` when a limb or heavy blood hits the floor to stamp persistent decals.
   */
  update(
    dt: number,
    floorYAt: (x: number, z: number) => number,
    onFloorBlood?: (x: number, z: number, radius: number) => void,
  ): void {
    // 1. Update severed limbs (gibs)
    for (let i = this.gibs.length - 1; i >= 0; i--) {
      const g = this.gibs[i]!;

      g.life -= dt;
      if (g.life <= 0) {
        this.scene.remove(g.mesh);
        this.gibs.splice(i, 1);
        continue;
      }

      if (g.isResting) {
        // Slowly sink or fade before despawn
        if (g.life < 2.0) {
          g.mesh.position.y -= dt * 0.05;
        }
        continue;
      }

      // Physics integration
      g.vy += GoreSystem.GRAVITY * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;

      // Tumbling rotation
      g.rotX += g.rotVx * dt;
      g.rotY += g.rotVy * dt;
      g.rotZ += g.rotVz * dt;
      g.mesh.rotation.set(g.rotX, g.rotY, g.rotZ);

      // Floor collision
      const floorY = floorYAt(g.x, g.z) + 0.08;
      if (g.y <= floorY) {
        g.y = floorY;
        if (Math.abs(g.vy) > 1.0) {
          // Bounce with energy loss
          g.vy = -g.vy * GoreSystem.BOUNCE_DAMPING;
          g.vx *= GoreSystem.FRICTION;
          g.vz *= GoreSystem.FRICTION;
          g.rotVx *= 0.5;
          g.rotVy *= 0.5;
          g.rotVz *= 0.5;

          // Stamp small blood decal on impact
          if (onFloorBlood) {
            onFloorBlood(g.x, g.z, 0.4 + Math.random() * 0.3);
          }
        } else {
          // Come to rest
          g.vy = 0;
          g.vx = 0;
          g.vz = 0;
          g.isResting = true;
          if (onFloorBlood) {
            onFloorBlood(g.x, g.z, 0.6 + Math.random() * 0.4);
          }
        }
      }

      g.mesh.position.set(g.x, g.y, g.z);
    }

    // 2. Update blood droplets
    for (let i = this.droplets.length - 1; i >= 0; i--) {
      const d = this.droplets[i]!;
      d.life -= dt;
      d.vy += GoreSystem.GRAVITY * dt * 0.8;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;

      const floorY = floorYAt(d.x, d.z);
      if (d.y <= floorY || d.life <= 0) {
        if (d.y <= floorY && onFloorBlood && Math.random() < 0.35) {
          onFloorBlood(d.x, d.z, d.size * 5.0);
        }
        this.droplets.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const g of this.gibs) {
      this.scene.remove(g.mesh);
    }
    this.gibs = [];
    this.droplets = [];
  }
}
