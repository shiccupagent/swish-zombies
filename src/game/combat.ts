import * as THREE from 'three';
import type { WeaponDef } from './weapons.ts';

export interface Pellet {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  life: number;
  maxLife: number;
  penetration: number;
  hitZombieIds: Set<string>;
  isExplosive?: boolean;
  explosionRadius?: number;
  mesh: THREE.Mesh;
}

export interface SpentShell {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  vRotX: number;
  vRotY: number;
  life: number;
  bounces: number;
  mesh: THREE.Mesh;
}

export interface BloodParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  mesh: THREE.Mesh;
}

export interface LightningArc {
  line: THREE.Line;
  life: number;
}

export interface FirePool {
  x: number;
  z: number;
  radius: number;
  life: number;
  mesh: THREE.Mesh;
  light: THREE.PointLight;
}

export interface Shockwave {
  x: number;
  z: number;
  radius: number;
  maxRadius: number;
  mesh: THREE.Mesh;
  life: number;
}

export class CombatSystem {
  scene: THREE.Scene;
  pellets: Pellet[] = [];
  shells: SpentShell[] = [];
  blood: BloodParticle[] = [];
  lightningArcs: LightningArc[] = [];
  firePools: FirePool[] = [];
  shockwaves: Shockwave[] = [];

  muzzleFlashLight: THREE.PointLight;
  muzzleFlashT: number = 0;

  private pelletGeo = new THREE.SphereGeometry(0.045, 6, 6);
  private shellGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6);
  private bloodGeo = new THREE.SphereGeometry(0.04, 4, 4);
  private bloodMat = new THREE.MeshBasicMaterial({ color: '#880808' });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.muzzleFlashLight = new THREE.PointLight('#fef08a', 0, 8);
    this.scene.add(this.muzzleFlashLight);
  }

  fireWeapon(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    weapon: WeaponDef,
    isPap: boolean = false,
    damageMult: number = 1.0,
    pelletBonus: number = 0
  ): void {
    const projColor = isPap ? weapon.papProjectileColor : weapon.projectileColor;
    const dmg = (isPap ? weapon.papDamage : weapon.damage) * damageMult;
    const pelletCount = weapon.pellets + (weapon.type === 'shotgun' ? pelletBonus : 0);

    // Muzzle Flash
    this.muzzleFlashLight.color.set(projColor);
    this.muzzleFlashLight.position.copy(origin);
    this.muzzleFlashLight.intensity = weapon.type === 'wonder' ? 6.0 : 4.5;
    this.muzzleFlashT = 0.06;

    const baseSpeed = weapon.projectileSpeed;
    const projMat = new THREE.MeshBasicMaterial({ color: projColor });

    for (let i = 0; i < pelletCount; i++) {
      const u = (Math.random() - 0.5) * weapon.spread;
      const v = (Math.random() - 0.5) * weapon.spread * 0.5;

      const pDir = dir.clone();
      pDir.x += u;
      pDir.y += v;
      pDir.z += u;
      pDir.normalize();

      const mesh = new THREE.Mesh(this.pelletGeo, projMat);
      mesh.position.copy(origin);
      if (weapon.type === 'wonder') mesh.scale.set(1.8, 1.8, 1.8);
      this.scene.add(mesh);

      this.pellets.push({
        x: origin.x,
        y: origin.y,
        z: origin.z,
        vx: pDir.x * baseSpeed,
        vy: pDir.y * baseSpeed,
        vz: pDir.z * baseSpeed,
        damage: dmg,
        life: 0.55,
        maxLife: 0.55,
        penetration: weapon.penetration,
        hitZombieIds: new Set<string>(),
        isExplosive: weapon.isExplosive,
        explosionRadius: weapon.explosionRadius,
        mesh,
      });
    }

    // Eject Spent Brass Shell sideways
    const shellColor = weapon.type === 'shotgun' ? '#dc2626' : '#f59e0b';
    const shellMat = new THREE.MeshStandardMaterial({ color: shellColor, roughness: 0.3, metalness: 0.9 });
    const shellMesh = new THREE.Mesh(this.shellGeo, shellMat);
    shellMesh.position.copy(origin);
    this.scene.add(shellMesh);

    const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    this.shells.push({
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx: right.x * (2.2 + Math.random() * 1.5),
      vy: 2.0 + Math.random() * 0.8,
      vz: right.z * (2.2 + Math.random() * 1.5),
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      vRotX: 15 + Math.random() * 10,
      vRotY: 10 + Math.random() * 10,
      life: 4.0,
      bounces: 0,
      mesh: shellMesh,
    });
  }

  spawnBloodBurst(x: number, y: number, z: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.bloodGeo, this.bloodMat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      this.blood.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 6,
        vy: 1.5 + Math.random() * 3.5,
        vz: (Math.random() - 0.5) * 6,
        life: 0.8,
        mesh,
      });
    }
  }

  spawnLightningArc(p1: THREE.Vector3, p2: THREE.Vector3): void {
    const points = [p1];
    const segments = 4;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const mid = new THREE.Vector3().lerpVectors(p1, p2, t);
      mid.x += (Math.random() - 0.5) * 0.4;
      mid.y += (Math.random() - 0.5) * 0.4;
      mid.z += (Math.random() - 0.5) * 0.4;
      points.push(mid);
    }
    points.push(p2);

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.lightningArcs.push({ line, life: 0.18 });
  }

  spawnFirePool(x: number, z: number): void {
    const geo = new THREE.CircleGeometry(1.8, 16);
    const mat = new THREE.MeshBasicMaterial({ color: '#ea580c', transparent: true, opacity: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.005, z);
    this.scene.add(mesh);

    const light = new THREE.PointLight('#f97316', 2.0, 5);
    light.position.set(x, 0.5, z);
    this.scene.add(light);

    this.firePools.push({ x, z, radius: 1.8, life: 4.5, mesh, light });
  }

  spawnShockwave(x: number, z: number, maxRadius: number = 5.0, color: string = '#ef4444'): void {
    const geo = new THREE.RingGeometry(0.1, 0.4, 32);
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, z);
    this.scene.add(mesh);

    this.shockwaves.push({ x, z, radius: 0.2, maxRadius, mesh, life: 0.5 });
  }

  update(
    dt: number,
    zombies: Array<{
      id: string;
      x: number;
      y: number;
      z: number;
      height: number;
      radius: number;
      health: number;
      takeDamage: (dmg: number, isCrit?: boolean) => void;
    }>,
    onBloodDecal: (x: number, z: number, r: number) => void
  ): void {
    // 1. Muzzle Flash Decay
    if (this.muzzleFlashT > 0) {
      this.muzzleFlashT -= dt;
      if (this.muzzleFlashT <= 0) {
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // 2. Projectile simulation with penetration & explosive splash
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const p = this.pellets[i]!;
      p.life -= dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt - 2.5 * dt * dt;
      p.z += p.vz * dt;
      p.mesh.position.set(p.x, p.y, p.z);

      let destroy = false;

      if (p.y <= 0) {
        destroy = true;
        if (p.isExplosive && p.explosionRadius) {
          this.spawnShockwave(p.x, p.z, p.explosionRadius, '#22c55e');
          for (const zmb of zombies) {
            const dist = Math.hypot(zmb.x - p.x, zmb.z - p.z);
            if (dist <= p.explosionRadius) {
              zmb.takeDamage(p.damage * 0.85);
            }
          }
        }
      } else {
        // Hit detection against zombies
        for (const zmb of zombies) {
          if (zmb.health <= 0 || p.hitZombieIds.has(zmb.id)) continue;
          const dx = p.x - zmb.x;
          const dz = p.z - zmb.z;
          const distSq = dx * dx + dz * dz;

          if (distSq < (zmb.radius + 0.18) ** 2 && p.y >= 0 && p.y <= zmb.height + 0.3) {
            p.hitZombieIds.add(zmb.id);
            const isHeadshot = p.y >= zmb.height * 0.72;
            const dmg = isHeadshot ? p.damage * 2.2 : p.damage;
            zmb.takeDamage(dmg, isHeadshot);

            this.spawnBloodBurst(p.x, p.y, p.z, isHeadshot ? 12 : 6);
            if (zmb.health <= 0) {
              onBloodDecal(zmb.x, zmb.z, 0.8 + Math.random() * 0.6);
            }

            // Explosive splash
            if (p.isExplosive && p.explosionRadius) {
              this.spawnShockwave(p.x, p.z, p.explosionRadius, '#22c55e');
              for (const other of zombies) {
                if (other.id === zmb.id || other.health <= 0) continue;
                const d = Math.hypot(other.x - p.x, other.z - p.z);
                if (d <= p.explosionRadius) {
                  other.takeDamage(p.damage * 0.8);
                }
              }
            }

            p.penetration--;
            if (p.penetration <= 0) {
              destroy = true;
              break;
            }
          }
        }
      }

      if (destroy || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.pellets.splice(i, 1);
      }
    }

    // 3. Shell Casings
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i]!;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.vy -= 9.8 * dt;

      if (s.y <= 0.02) {
        s.y = 0.02;
        if (s.bounces < 3) {
          s.vy = -s.vy * 0.45;
          s.vx *= 0.7;
          s.vz *= 0.7;
          s.bounces++;
        } else {
          s.vy = 0; s.vx = 0; s.vz = 0;
        }
      }

      if (s.bounces < 3) {
        s.rotX += s.vRotX * dt;
        s.rotY += s.vRotY * dt;
        s.mesh.rotation.set(s.rotX, s.rotY, 0);
      }
      s.mesh.position.set(s.x, s.y, s.z);

      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        this.shells.splice(i, 1);
      }
    }

    // 4. Blood
    for (let i = this.blood.length - 1; i >= 0; i--) {
      const b = this.blood[i]!;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.vy -= 12 * dt;

      if (b.y <= 0.01) { b.y = 0.01; b.vx = 0; b.vz = 0; }
      b.mesh.position.set(b.x, b.y, b.z);

      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.blood.splice(i, 1);
      }
    }

    // 5. Lightning Arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i]!;
      arc.life -= dt;
      if (arc.life <= 0) {
        this.scene.remove(arc.line);
        arc.line.geometry.dispose();
        this.lightningArcs.splice(i, 1);
      }
    }

    // 6. Fire Pools
    for (let i = this.firePools.length - 1; i >= 0; i--) {
      const f = this.firePools[i]!;
      f.life -= dt;
      f.light.intensity = 1.5 + Math.sin(f.life * 20) * 0.5;

      for (const zmb of zombies) {
        if (zmb.health <= 0) continue;
        const dist = Math.hypot(zmb.x - f.x, zmb.z - f.z);
        if (dist <= f.radius) {
          zmb.takeDamage(24 * dt);
        }
      }

      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        this.scene.remove(f.light);
        f.mesh.geometry.dispose();
        this.firePools.splice(i, 1);
      }
    }

    // 7. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]!;
      sw.life -= dt;
      sw.radius += (sw.maxRadius / 0.5) * dt;

      const scale = sw.radius / 0.2;
      sw.mesh.scale.set(scale, scale, 1);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, sw.life / 0.5);

      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  dispose(): void {
    this.pellets.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); });
    this.shells.forEach(s => { this.scene.remove(s.mesh); s.mesh.geometry.dispose(); });
    this.blood.forEach(b => { this.scene.remove(b.mesh); b.mesh.geometry.dispose(); });
    this.lightningArcs.forEach(a => { this.scene.remove(a.line); a.line.geometry.dispose(); });
    this.firePools.forEach(f => { this.scene.remove(f.mesh); this.scene.remove(f.light); f.mesh.geometry.dispose(); });
    this.shockwaves.forEach(w => { this.scene.remove(w.mesh); w.mesh.geometry.dispose(); });
  }
}
