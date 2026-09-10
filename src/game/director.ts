import * as THREE from 'three';
import { createZombieMesh, type ZombieCharacter, type ZombieType } from '../render/characters.ts';
import type { AudioSynth } from '../audio/synth.ts';
import type { CombatSystem } from './combat.ts';
import type { ZombieMap } from './maps/types.ts';

export interface ZombieInstance {
  id: string;
  type: ZombieType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
  health: number;
  maxHealth: number;
  radius: number;
  height: number;
  damage: number;
  biteCooldown: number;
  shriekCooldown: number;
  slamCooldown: number;
  knockbackX: number;
  knockbackZ: number;
  char: ZombieCharacter;
  takeDamage: (dmg: number, isCrit?: boolean) => void;
}

export class HordeDirector {
  scene: THREE.Scene;
  map: ZombieMap;
  audio: AudioSynth;
  combat: CombatSystem;

  zombies: ZombieInstance[] = [];
  round: number = 1;
  zombiesToSpawn: number = 0;
  totalRoundZombies: number = 0;
  spawnTimer: number = 0;
  intermissionTimer: number = 0;
  inIntermission: boolean = false;

  bossActive: boolean = false;
  bossInstance: ZombieInstance | null = null;

  extractionActive: boolean = false;
  extractionTimer: number = 90;
  helicopterMesh: THREE.Group | null = null;
  rotorAudioTimer: number = 0;

  constructor(scene: THREE.Scene, map: ZombieMap, audio: AudioSynth, combat: CombatSystem) {
    this.scene = scene;
    this.map = map;
    this.audio = audio;
    this.combat = combat;

    this.startRound(1);
  }

  startRound(roundNum: number): void {
    this.round = roundNum;
    this.inIntermission = false;

    // CoD Zombies formula
    this.totalRoundZombies = Math.floor(8 + roundNum * 4.2 * (1 + roundNum * 0.05));
    this.zombiesToSpawn = this.totalRoundZombies;
    this.spawnTimer = 1.0;

    this.audio.playRoundStart();

    // Round 5: Apex Goliath Boss
    if (roundNum === 5) {
      this.bossActive = true;
      this.spawnBoss();
    } else {
      this.bossActive = false;
      this.bossInstance = null;
    }

    // Round 10: Extraction Event
    if (roundNum === 10) {
      this.triggerExtraction();
    }
  }

  private spawnBoss(): void {
    const sp = this.map.spawnPoints[4] || this.map.spawnPoints[0]!;
    const char = createZombieMesh(`boss_${Date.now()}`, 'boss');
    char.group.position.set(sp.x, 0, sp.z);
    this.scene.add(char.group);

    const maxHp = 1200;
    const boss: ZombieInstance = {
      id: char.id,
      type: 'boss',
      x: sp.x,
      y: 0,
      z: sp.z,
      vx: 0,
      vz: 0,
      speed: 2.6,
      health: maxHp,
      maxHealth: maxHp,
      radius: 0.85,
      height: 2.4,
      damage: 40,
      biteCooldown: 0,
      shriekCooldown: 0,
      slamCooldown: 4.0,
      knockbackX: 0,
      knockbackZ: 0,
      char,
      takeDamage: (dmg) => {
        boss.health -= dmg;
      },
    };

    this.zombies.push(boss);
    this.bossInstance = boss;
    this.audio.playBossRoar();
  }

  private triggerExtraction(): void {
    this.extractionActive = true;
    this.extractionTimer = 90;

    // Create 3D Extraction Helicopter at midcourt
    const heli = new THREE.Group();
    heli.position.set(0, 0, 0);

    const bodyMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.8 });
    const greenFlareMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });

    // Fuselage
    const fuseGeo = new THREE.BoxGeometry(2.4, 2.0, 5.5);
    const fuse = new THREE.Mesh(fuseGeo, bodyMat);
    fuse.position.y = 1.4;
    heli.add(fuse);

    // Tail Boom
    const tailGeo = new THREE.CylinderGeometry(0.2, 0.4, 4.2, 8);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 1.6, -4.5);
    heli.add(tail);

    // Main Rotor Blades
    const rotorGeo = new THREE.BoxGeometry(8.5, 0.08, 0.45);
    const rotor = new THREE.Mesh(rotorGeo, bodyMat);
    rotor.position.set(0, 2.6, 0);
    heli.add(rotor);

    // Green LZ Flares in 4 corners of center circle
    for (const fx of [-2.2, 2.2]) {
      for (const fz of [-2.2, 2.2]) {
        const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8), greenFlareMat);
        flare.position.set(fx, 0.17, fz);
        heli.add(flare);

        const flLight = new THREE.PointLight('#22c55e', 2.5, 7);
        flLight.position.set(fx, 0.6, fz);
        heli.add(flLight);
      }
    }

    this.scene.add(heli);
    this.helicopterMesh = heli;
  }

  update(
    dt: number,
    playerPos: { x: number; y: number; z: number },
    onPlayerDamage: (dmg: number) => void,
    onZombieKilled: (z: ZombieInstance, isCrit: boolean) => void,
    onRoundCompleted: (round: number) => void
  ): void {
    // Intermission countdown
    if (this.inIntermission) {
      this.intermissionTimer -= dt;
      if (this.intermissionTimer <= 0) {
        this.startRound(this.round + 1);
      }
      return;
    }

    // Extraction timer
    if (this.extractionActive) {
      this.extractionTimer -= dt;
      this.rotorAudioTimer += dt;
      if (this.rotorAudioTimer >= 0.18) {
        this.rotorAudioTimer = 0;
        this.audio.playRotorThump();
      }

      // Spin helicopter rotor
      if (this.helicopterMesh && this.helicopterMesh.children[2]) {
        this.helicopterMesh.children[2].rotation.y += dt * 25;
      }
    }

    // Spawn director
    this.spawnTimer -= dt;
    const maxAliveAtOnce = 24;
    if (this.spawnTimer <= 0 && this.zombiesToSpawn > 0 && this.zombies.length < maxAliveAtOnce) {
      this.spawnTimer = Math.max(0.4, 2.2 - this.round * 0.12);
      this.spawnZombie();
      this.zombiesToSpawn--;
    }

    // Update active zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i]!;

      // Death check
      if (z.health <= 0) {
        this.scene.remove(z.char.group);
        z.char.dispose();
        this.zombies.splice(i, 1);
        onZombieKilled(z, false);
        continue;
      }

      // Cooldowns
      z.biteCooldown = Math.max(0, z.biteCooldown - dt);
      z.shriekCooldown = Math.max(0, z.shriekCooldown - dt);
      z.slamCooldown = Math.max(0, z.slamCooldown - dt);

      // AI Navigation towards player
      const dx = playerPos.x - z.x;
      const dz = playerPos.z - z.z;
      const dist = Math.hypot(dx, dz);

      // Boss Ground Slam Special
      if (z.type === 'boss' && z.slamCooldown <= 0 && dist < 6.5) {
        z.slamCooldown = 5.0;
        this.audio.playBossSlam();
        this.combat.spawnShockwave(z.x, z.z, 6.0);

        // If player is caught in shockwave
        if (dist < 5.0) {
          onPlayerDamage(35);
        }
      }

      // Screamer Shriek Special
      if (z.type === 'screamer' && z.shriekCooldown <= 0 && dist < 12) {
        z.shriekCooldown = 8.0;
        this.audio.playScreamerShriek();
        this.combat.spawnShockwave(z.x, z.z, 3.5);

        // Spawn 2 frenzied runners
        for (let s = 0; s < 2; s++) {
          this.spawnSpecificZombie('runner', z.x + (Math.random() - 0.5) * 2, z.z + (Math.random() - 0.5) * 2);
        }
      }

      // Movement vector
      let moveX = 0;
      let moveZ = 0;
      if (dist > 0.8) {
        moveX = (dx / dist) * z.speed;
        moveZ = (dz / dist) * z.speed;
      }

      // Apply knockback decay
      z.x += (moveX + z.knockbackX) * dt;
      z.z += (moveZ + z.knockbackZ) * dt;
      z.knockbackX = THREE.MathUtils.lerp(z.knockbackX, 0, dt * 8);
      z.knockbackZ = THREE.MathUtils.lerp(z.knockbackZ, 0, dt * 8);

      // Obstacle avoidance (Hoop stanchions)
      for (const obs of this.map.obstacles) {
        const odx = z.x - obs.x;
        const odz = z.z - obs.z;
        const odist = Math.hypot(odx, odz);
        const minDist = z.radius + obs.radius;
        if (odist < minDist && odist > 0.001) {
          z.x = obs.x + (odx / odist) * minDist;
          z.z = obs.z + (odz / odist) * minDist;
        }
      }

      // Clamp to court boundary
      z.x = Math.max(this.map.courtBounds.minX, Math.min(this.map.courtBounds.maxX, z.x));
      z.z = Math.max(this.map.courtBounds.minZ, Math.min(this.map.courtBounds.maxZ, z.z));

      // Mesh position & rotation
      z.char.group.position.set(z.x, 0, z.z);
      if (dist > 0.1) {
        const targetAngle = Math.atan2(dx, dz);
        z.char.group.rotation.y = THREE.MathUtils.lerp(z.char.group.rotation.y, targetAngle, dt * 8);
      }

      // Attack player
      const attackRange = z.type === 'boss' ? 2.2 : z.type === 'brute' ? 1.5 : 1.1;
      const isAttacking = dist <= attackRange;
      if (isAttacking && z.biteCooldown <= 0) {
        z.biteCooldown = 0.85;
        this.audio.playZombieBite();
        onPlayerDamage(z.damage);
      }

      // Animation
      z.char.updateAnimation(dt, z.speed, isAttacking);
    }

    // Check round completion
    if (this.zombiesToSpawn === 0 && this.zombies.length === 0 && !this.inIntermission) {
      this.inIntermission = true;
      this.intermissionTimer = 4.0;
      this.audio.playRoundClear();
      onRoundCompleted(this.round);
    }
  }

  private spawnZombie(): void {
    const sp = this.map.spawnPoints[Math.floor(Math.random() * this.map.spawnPoints.length)]!;

    // Select zombie type based on round
    let type: ZombieType = 'walker';
    const roll = Math.random();

    if (this.round === 1) {
      type = 'walker';
    } else if (this.round === 2) {
      type = roll < 0.35 ? 'runner' : 'walker';
    } else if (this.round === 3) {
      type = roll < 0.3 ? 'crawler' : roll < 0.65 ? 'runner' : 'walker';
    } else if (this.round === 4) {
      type = roll < 0.15 ? 'screamer' : roll < 0.45 ? 'runner' : roll < 0.7 ? 'crawler' : 'walker';
    } else {
      // Round 5+
      if (roll < 0.15) type = 'brute';
      else if (roll < 0.3) type = 'screamer';
      else if (roll < 0.55) type = 'runner';
      else if (roll < 0.75) type = 'crawler';
      else type = 'walker';
    }

    this.spawnSpecificZombie(type, sp.x + (Math.random() - 0.5) * 1.5, sp.z + (Math.random() - 0.5) * 1.5);
  }

  private spawnSpecificZombie(type: ZombieType, x: number, z: number): void {
    const char = createZombieMesh(`z_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type);
    char.group.position.set(x, 0, z);
    this.scene.add(char.group);

    let hp = 60 + this.round * 12;
    let spd = 1.8 + Math.random() * 0.4;
    let rad = 0.35;
    let h = 1.7;
    let dmg = 15;

    switch (type) {
      case 'runner':
        hp = Math.floor(hp * 0.75);
        spd = 3.8 + Math.random() * 0.5;
        dmg = 12;
        break;
      case 'crawler':
        hp = Math.floor(hp * 0.6);
        spd = 1.4;
        h = 0.7;
        dmg = 14;
        break;
      case 'brute':
        hp = Math.floor(hp * 3.2);
        spd = 1.3;
        rad = 0.55;
        h = 2.1;
        dmg = 28;
        break;
      case 'screamer':
        hp = Math.floor(hp * 0.8);
        spd = 2.4;
        dmg = 10;
        break;
    }

    const instance: ZombieInstance = {
      id: char.id,
      type,
      x,
      y: 0,
      z,
      vx: 0,
      vz: 0,
      speed: spd,
      health: hp,
      maxHealth: hp,
      radius: rad,
      height: h,
      damage: dmg,
      biteCooldown: 0,
      shriekCooldown: 0,
      slamCooldown: 0,
      knockbackX: 0,
      knockbackZ: 0,
      char,
      takeDamage: (amount, _isCrit) => {
        instance.health -= amount;
        // Knockback unless brute/boss
        const kbMult = type === 'brute' ? 0.3 : type === 'boss' ? 0 : 1.0;
        instance.knockbackX += (Math.random() - 0.5) * 4 * kbMult;
        instance.knockbackZ += (Math.random() - 0.5) * 4 * kbMult;
      },
    };

    this.zombies.push(instance);
  }

  dispose(): void {
    this.zombies.forEach(z => {
      this.scene.remove(z.char.group);
      z.char.dispose();
    });
    this.zombies = [];
    if (this.helicopterMesh) {
      this.scene.remove(this.helicopterMesh);
    }
  }
}
