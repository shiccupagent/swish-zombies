/**
 * ============================================================================
 *  POWER-UP DROPS — collectible pickups that drop from killed zombies
 * ============================================================================
 *
 * In CoD WaW Zombies, killed zombies have a chance to drop a glowing,
 * rotating power-up that any player can pick up by walking over it.
 * Each power-up has a timed duration or instant effect.
 *
 * WaW Power-ups:
 *   - Max Ammo (green)       → refills all reserve ammo for all weapons
 *   - Nuke (gold)            → kills all zombies currently alive, +400 points
 *   - Insta-Kill (skull)     → all damage = instant kill for 30 seconds
 *   - Double Points (x2)     → all points earned are doubled for 30 seconds
 *   - Carpenter (hammer)     → repairs all barricades, +200 points
 *
 * Drop chance: ~2-3% per zombie kill. Only one power-up can be on the ground
 * at a time (WaW rule). Power-up despawns after 30 seconds if not picked up.
 *
 * ── 3D REPRESENTATION ───────────────────────────────────────────────────────
 *
 * A floating, slowly rotating glowing icon at y=0.8 with:
 *   - A colored PointLight matching the power-up
 *   - Gentle bobbing animation (sine wave on y)
 *   - Pickup flash effect on collection
 */

import * as THREE from 'three';

export type PowerUpId = 'max_ammo' | 'nuke' | 'insta_kill' | 'double_points' | 'carpenter';

export interface PowerUpDef {
  id: PowerUpId;
  name: string;
  color: string;
  icon: string;
  /** Duration in seconds. 0 = instant effect. */
  duration: number;
}

export const POWERUP_DEFS: Record<PowerUpId, PowerUpDef> = {
  max_ammo: {
    id: 'max_ammo',
    name: 'MAX AMMO',
    color: '#22c55e',
    icon: '🔋',
    duration: 0,
  },
  nuke: {
    id: 'nuke',
    name: 'NUKE',
    color: '#facc15',
    icon: '☢️',
    duration: 0,
  },
  insta_kill: {
    id: 'insta_kill',
    name: 'INSTA-KILL',
    color: '#f8fafc',
    icon: '💀',
    duration: 30,
  },
  double_points: {
    id: 'double_points',
    name: 'DOUBLE POINTS',
    color: '#facc15',
    icon: '×2',
    duration: 30,
  },
  carpenter: {
    id: 'carpenter',
    name: 'CARPENTER',
    color: '#a78bfa',
    icon: '🔨',
    duration: 0,
  },
};

export interface PowerUpInstance {
  id: string;
  def: PowerUpDef;
  x: number;
  z: number;
  group: THREE.Group;
  light: THREE.PointLight;
  /** Time remaining before this drop despawns. */
  despawnTimer: number;
  collected: boolean;
}

/** State of currently active timed power-ups. */
export interface ActivePowerUps {
  instaKillTimer: number;
  doublePointsTimer: number;
}

export class PowerUpManager {
  drops: PowerUpInstance[] = [];
  scene: THREE.Scene;
  active: ActivePowerUps = {
    instaKillTimer: 0,
    doublePointsTimer: 0,
  };

  /** Drop chance per zombie kill (WaW ~2-3%). */
  static readonly DROP_CHANCE = 0.025;
  /** Only one drop on the ground at a time (WaW rule). */
  static readonly MAX_DROPS = 1;
  /** Seconds before an uncollected drop despawns. */
  static readonly DESPAWN_TIME = 30;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Roll for a power-up drop at a killed zombie's position. */
  trySpawnDrop(x: number, z: number): void {
    if (this.drops.length >= PowerUpManager.MAX_DROPS) return;
    if (Math.random() > PowerUpManager.DROP_CHANCE) return;

    // Random power-up selection
    const ids = Object.keys(POWERUP_DEFS) as PowerUpId[];
    const id = ids[Math.floor(Math.random() * ids.length)]!;
    const def = POWERUP_DEFS[id];

    const group = new THREE.Group();
    group.position.set(x, 0.8, z);

    // TODO: Build 3D power-up icon mesh:
    //   - Floating colored box or shaped icon
    //   - Slowly rotating (y-axis spin)
    //   - Bobbing up and down (sine wave)
    //   - Colored emissive material matching def.color

    // Placeholder glowing box
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.6,
      }),
    );
    group.add(mesh);

    const light = new THREE.PointLight(def.color, 2.0, 8);
    light.position.y = 0.3;
    group.add(light);

    this.scene.add(group);

    this.drops.push({
      id: `powerup_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      def,
      x,
      z,
      group,
      light,
      despawnTimer: PowerUpManager.DESPAWN_TIME,
      collected: false,
    });
  }

  /** Check if player is touching any drop and collect it. */
  checkPickup(px: number, pz: number): PowerUpDef | null {
    for (const drop of this.drops) {
      if (drop.collected) continue;
      const dist = Math.hypot(px - drop.x, pz - drop.z);
      if (dist < 1.2) {
        drop.collected = true;
        return drop.def;
      }
    }
    return null;
  }

  /** Apply a collected power-up's effect. Called by main.ts after checkPickup. */
  activateEffect(id: PowerUpId): void {
    switch (id) {
      case 'insta_kill':
        this.active.instaKillTimer = POWERUP_DEFS.insta_kill.duration;
        break;
      case 'double_points':
        this.active.doublePointsTimer = POWERUP_DEFS.double_points.duration;
        break;
      // max_ammo, nuke, carpenter are handled directly by main.ts
    }
  }

  /** Is Insta-Kill currently active? */
  isInstaKill(): boolean {
    return this.active.instaKillTimer > 0;
  }

  /** Is Double Points currently active? */
  isDoublePoints(): boolean {
    return this.active.doublePointsTimer > 0;
  }

  /** Get the points multiplier (1 normally, 2 during double points). */
  getPointsMultiplier(): number {
    return this.active.doublePointsTimer > 0 ? 2 : 1;
  }

  update(dt: number): void {
    // Tick active timed power-ups
    this.active.instaKillTimer = Math.max(0, this.active.instaKillTimer - dt);
    this.active.doublePointsTimer = Math.max(0, this.active.doublePointsTimer - dt);

    // Update drops: despawn timer, bobbing, rotation, cleanup
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i]!;

      if (drop.collected) {
        // TODO: flash pickup effect then remove
        this.scene.remove(drop.group);
        this.drops.splice(i, 1);
        continue;
      }

      drop.despawnTimer -= dt;
      if (drop.despawnTimer <= 0) {
        this.scene.remove(drop.group);
        this.drops.splice(i, 1);
        continue;
      }

      // Bobbing and rotation animation
      drop.group.position.y = 0.8 + Math.sin(Date.now() * 0.003) * 0.15;
      drop.group.rotation.y += dt * 2.0;

      // Blink when about to despawn (last 5 seconds)
      if (drop.despawnTimer < 5) {
        drop.group.visible = Math.sin(drop.despawnTimer * 10) > 0;
      }
    }
  }

  dispose(): void {
    for (const drop of this.drops) {
      this.scene.remove(drop.group);
    }
    this.drops = [];
  }
}
