import * as THREE from 'three';
import type { AudioSynth } from '../audio/synth.ts';

export class PackAPunchManager {
  group: THREE.Group = new THREE.Group();
  x: number;
  z: number;
  isUpgrading: boolean = false;
  upgradeTimer: number = 0;

  private gears: THREE.Mesh[] = [];
  private glowLight: THREE.PointLight;

  constructor(x: number, z: number, yaw: number = 0) {
    this.x = x;
    this.z = z;
    this.group.position.set(x, 0, z);
    this.group.rotation.y = yaw;

    const brassMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.35, metalness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.7 });
    const glowMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });

    // Base Machine Pedestal
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 1.2), steelMat);
    base.position.y = 0.55;
    this.group.add(base);

    // Archway & Weapon Chute
    const chute = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.8), brassMat);
    chute.position.set(0, 1.15, 0);
    this.group.add(chute);

    // Rotating Steampunk Gears
    for (const gx of [-0.65, 0.65]) {
      const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12), brassMat);
      gear.rotation.x = Math.PI / 2;
      gear.position.set(gx, 0.9, 0.61);
      this.group.add(gear);
      this.gears.push(gear);
    }

    // Glowing Vacuum Tubes
    for (let i = 0; i < 3; i++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), glowMat);
      tube.position.set((i - 1) * 0.3, 1.45, 0);
      this.group.add(tube);
    }

    // Top Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.1), brassMat);
    sign.position.set(0, 1.75, 0);
    this.group.add(sign);

    // Glow Light
    this.glowLight = new THREE.PointLight('#38bdf8', 1.8, 6);
    this.glowLight.position.set(0, 1.4, 0.6);
    this.group.add(this.glowLight);
  }

  canUpgrade(points: number, isAlreadyPap: boolean): boolean {
    return !this.isUpgrading && !isAlreadyPap && points >= 5000;
  }

  startUpgrade(audio: AudioSynth): void {
    this.isUpgrading = true;
    this.upgradeTimer = 3.0;
    audio.playPackAPunch();
  }

  update(dt: number, onUpgradeComplete: () => void): void {
    // Rotate gears
    const speed = this.isUpgrading ? 12 : 2.5;
    this.gears.forEach((g, idx) => {
      g.rotation.z += dt * speed * (idx % 2 === 0 ? 1 : -1);
    });

    if (this.isUpgrading) {
      this.upgradeTimer -= dt;
      this.glowLight.intensity = 2.5 + Math.sin(this.upgradeTimer * 25) * 1.5;

      if (this.upgradeTimer <= 0) {
        this.isUpgrading = false;
        this.glowLight.intensity = 1.8;
        onUpgradeComplete();
      }
    }
  }
}
