import * as THREE from 'three';
import type { AudioSynth } from '../audio/synth.ts';

export interface DeployableEntity {
  id: string;
  type: 'sentry' | 'claymore' | 'wire';
  x: number;
  z: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  group: THREE.Group;
  update: (
    dt: number,
    zombies: Array<{ id: string; x: number; z: number; health: number; takeDamage: (dmg: number, isCrit?: boolean) => void }>,
    audio: AudioSynth,
    onExplode?: (x: number, z: number, radius: number, damage: number) => void
  ) => void;
  dispose: () => void;
}

export function createSentryTurret(x: number, z: number, yaw: number): DeployableEntity {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const metalMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5, metalness: 0.8 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3, metalness: 0.9 });
  const sensorMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });

  // Tripod Base Legs
  for (let i = 0; i < 3; i++) {
    const legGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.6, 6);
    const leg = new THREE.Mesh(legGeo, metalMat);
    const legAngle = (i * Math.PI * 2) / 3;
    leg.position.set(Math.sin(legAngle) * 0.25, 0.25, Math.cos(legAngle) * 0.25);
    leg.rotation.z = Math.sin(legAngle) * 0.35;
    leg.rotation.x = Math.cos(legAngle) * -0.35;
    group.add(leg);
  }

  // Central Hub
  const hubGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.15, 12);
  const hub = new THREE.Mesh(hubGeo, metalMat);
  hub.position.y = 0.5;
  group.add(hub);

  // Rotating Turret Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.58;
  headGroup.rotation.y = yaw;
  group.add(headGroup);

  // Turret Body Housing
  const bodyGeo = new THREE.BoxGeometry(0.24, 0.22, 0.36);
  const body = new THREE.Mesh(bodyGeo, metalMat);
  headGroup.add(body);

  // Dual Barrels
  for (const bx of [-0.07, 0.07]) {
    const bGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.38, 8);
    const barrel = new THREE.Mesh(bGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(bx, 0.02, 0.3);
    headGroup.add(barrel);
  }

  // Sensor Eye
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), sensorMat);
  sensor.position.set(0, 0.08, 0.18);
  headGroup.add(sensor);

  let fireCooldown = 0;
  let ammo = 36;
  let health = 150;
  let isDead = false;

  return {
    id: `sentry_${Math.random().toString(36).slice(2, 8)}`,
    type: 'sentry',
    x,
    z,
    health,
    maxHealth: 150,
    get isDead() { return isDead || health <= 0; },
    group,
    update: (dt, zombies, audio) => {
      if (isDead) return;
      fireCooldown -= dt;

      // Find closest alive zombie within 12m
      let closestZ: { id: string; x: number; z: number; health: number; takeDamage: (dmg: number) => void } | null = null;
      let minDistSq = 12 * 12;

      for (const zmb of zombies) {
        if (zmb.health <= 0) continue;
        const dSq = (zmb.x - x) ** 2 + (zmb.z - z) ** 2;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closestZ = zmb;
        }
      }

      if (closestZ) {
        const targetYaw = Math.atan2(closestZ.x - x, closestZ.z - z);
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetYaw, dt * 10);

        if (fireCooldown <= 0 && ammo > 0) {
          fireCooldown = 0.55;
          ammo -= 2;
          audio.playTurretFire();

          // Sentry buckshot burst
          closestZ.takeDamage(45);

          if (ammo <= 0) {
            isDead = true;
          }
        }
      }
    },
    dispose: () => {
      // Clean disposal
    },
  };
}

export function createClaymore(x: number, z: number, yaw: number): DeployableEntity {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = yaw;

  const boxMat = new THREE.MeshStandardMaterial({ color: '#3f4f24', roughness: 0.8 });
  const laserMat = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.85 });

  // Main Curved Box
  const bodyGeo = new THREE.BoxGeometry(0.3, 0.18, 0.08);
  const body = new THREE.Mesh(bodyGeo, boxMat);
  body.position.y = 0.12;
  group.add(body);

  // Scissor Stand Legs
  const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6);
  const l1 = new THREE.Mesh(legGeo, boxMat);
  l1.position.set(-0.12, 0.06, -0.04);
  l1.rotation.x = -0.3;
  group.add(l1);

  const l2 = new THREE.Mesh(legGeo, boxMat);
  l2.position.set(0.12, 0.06, -0.04);
  l2.rotation.x = -0.3;
  group.add(l2);

  // Red Tripwire Laser Line
  const laserGeo = new THREE.CylinderGeometry(0.006, 0.006, 3.5, 6);
  const laser = new THREE.Mesh(laserGeo, laserMat);
  laser.rotation.x = Math.PI / 2;
  laser.position.set(0, 0.12, 1.8);
  group.add(laser);

  let isDead = false;

  return {
    id: `claymore_${Math.random().toString(36).slice(2, 8)}`,
    type: 'claymore',
    x,
    z,
    health: 50,
    maxHealth: 50,
    get isDead() { return isDead; },
    group,
    update: (_dt, zombies, audio, onExplode) => {
      if (isDead) return;

      // Check if any zombie walks into front laser arc
      for (const zmb of zombies) {
        if (zmb.health <= 0) continue;
        const dx = zmb.x - x;
        const dz = zmb.z - z;
        const dist = Math.hypot(dx, dz);

        if (dist < 2.8) {
          // Angle check
          const ang = Math.atan2(dx, dz);
          const diff = Math.abs(ang - yaw);
          if (diff < 0.65 || dist < 1.0) {
            // DETONATE!
            isDead = true;
            audio.playExplosion();
            if (onExplode) onExplode(x, z, 3.8, 180);
            break;
          }
        }
      }
    },
    dispose: () => {},
  };
}

export function createBarbedWire(x: number, z: number): DeployableEntity {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const wireMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.4, metalness: 0.8 });

  // Coiled wire mesh
  for (let i = 0; i < 3; i++) {
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 6, 16), wireMat);
    torus.position.set((i - 1) * 0.45, 0.25, 0);
    torus.rotation.y = Math.PI / 2;
    group.add(torus);
  }

  let health = 250;
  let isDead = false;

  return {
    id: `wire_${Math.random().toString(36).slice(2, 8)}`,
    type: 'wire',
    x,
    z,
    health,
    maxHealth: 250,
    get isDead() { return isDead || health <= 0; },
    group,
    update: (dt, zombies) => {
      if (isDead) return;

      for (const zmb of zombies) {
        if (zmb.health <= 0) continue;
        const dist = Math.hypot(zmb.x - x, zmb.z - z);
        if (dist < 1.2) {
          // Laceration bleed damage + slow down
          zmb.takeDamage(18 * dt);
          health -= 12 * dt;
          if (health <= 0) {
            isDead = true;
            break;
          }
        }
      }
    },
    dispose: () => {},
  };
}
