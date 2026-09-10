import * as THREE from 'three';
import { WEAPON_REGISTRY, type WeaponDef } from './weapons.ts';
import type { AudioSynth } from '../audio/synth.ts';

export class MysteryBoxManager {
  group: THREE.Group = new THREE.Group();
  x: number;
  z: number;
  isOpen: boolean = false;
  isSpinning: boolean = false;
  readyToTake: boolean = false;
  selectedWeapon: WeaponDef | null = null;

  private lid: THREE.Group;
  private beamLight: THREE.PointLight;
  private weaponHoverGroup: THREE.Group;
  private spinTimer: number = 0;
  private takeTimer: number = 0;
  private currentPreviewMesh: THREE.Group | null = null;
  private weaponPool: WeaponDef[] = Object.values(WEAPON_REGISTRY);

  constructor(x: number, z: number, yaw: number = 0) {
    this.x = x;
    this.z = z;
    this.group.position.set(x, 0, z);
    this.group.rotation.y = yaw;

    const woodMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.8 });
    const qMat = new THREE.MeshBasicMaterial({ color: '#facc15' });

    // Lower Box Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.85), woodMat);
    base.position.y = 0.375;
    this.group.add(base);

    // Metal Corner Straps
    for (const sx of [-0.75, 0.75]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.86), metalMat);
      strap.position.set(sx, 0.375, 0);
      this.group.add(strap);
    }

    // Hinged Lid Group
    this.lid = new THREE.Group();
    this.lid.position.set(0, 0.75, -0.425); // hinge at rear top
    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.25, 0.9), woodMat);
    lidMesh.position.set(0, 0.125, 0.425);
    this.lid.add(lidMesh);

    // Glowing Question Marks on Lid
    for (const qx of [-0.4, 0, 0.4]) {
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), qMat);
      q.position.set(qx, 0.26, 0.425);
      this.lid.add(q);
    }
    this.group.add(this.lid);

    // Interior Beam Light
    this.beamLight = new THREE.PointLight('#fef08a', 0, 8);
    this.beamLight.position.set(0, 1.2, 0);
    this.group.add(this.beamLight);

    // Floating Weapon Display Anchor
    this.weaponHoverGroup = new THREE.Group();
    this.weaponHoverGroup.position.set(0, 1.35, 0);
    this.group.add(this.weaponHoverGroup);
  }

  canOpen(playerPoints: number): boolean {
    return !this.isSpinning && !this.readyToTake && playerPoints >= 950;
  }

  startSpin(audio: AudioSynth): void {
    this.isSpinning = true;
    this.readyToTake = false;
    this.spinTimer = 3.5;
    this.beamLight.intensity = 3.5;
    audio.playMysteryBoxJingle();
  }

  takeWeapon(): WeaponDef | null {
    if (!this.readyToTake || !this.selectedWeapon) return null;
    const w = this.selectedWeapon;
    this.closeBox();
    return w;
  }

  private closeBox(): void {
    this.isSpinning = false;
    this.readyToTake = false;
    this.selectedWeapon = null;
    this.beamLight.intensity = 0;
    if (this.currentPreviewMesh) {
      this.weaponHoverGroup.remove(this.currentPreviewMesh);
      this.currentPreviewMesh = null;
    }
  }

  update(dt: number): void {
    if (this.isSpinning) {
      this.spinTimer -= dt;
      // Open lid
      this.lid.rotation.x = THREE.MathUtils.lerp(this.lid.rotation.x, -Math.PI / 2.2, dt * 8);

      // Spin floating weapon preview rapidly
      this.weaponHoverGroup.rotation.y += dt * 15;

      // Cycle weapons periodically
      if (Math.random() < 0.3 || !this.currentPreviewMesh) {
        if (this.currentPreviewMesh) this.weaponHoverGroup.remove(this.currentPreviewMesh);
        const randWeapon = this.weaponPool[Math.floor(Math.random() * this.weaponPool.length)]!;
        this.currentPreviewMesh = randWeapon.createMesh(false);
        this.weaponHoverGroup.add(this.currentPreviewMesh);
      }

      if (this.spinTimer <= 0) {
        // Spin finishes! Select final weapon
        this.isSpinning = false;
        this.readyToTake = true;
        this.takeTimer = 10.0;

        // Weighted roll: 15% Ray Gun, 85% normal weapons
        if (Math.random() < 0.18) {
          this.selectedWeapon = WEAPON_REGISTRY['ray_gun']!;
        } else {
          const nonWonder = this.weaponPool.filter(w => w.type !== 'wonder');
          this.selectedWeapon = nonWonder[Math.floor(Math.random() * nonWonder.length)]!;
        }

        if (this.currentPreviewMesh) this.weaponHoverGroup.remove(this.currentPreviewMesh);
        this.currentPreviewMesh = this.selectedWeapon.createMesh(false);
        this.weaponHoverGroup.add(this.currentPreviewMesh);
      }
    } else if (this.readyToTake) {
      this.takeTimer -= dt;
      this.weaponHoverGroup.rotation.y += dt * 2.5;

      if (this.takeTimer <= 0) {
        this.closeBox();
      }
    } else {
      // Close lid
      this.lid.rotation.x = THREE.MathUtils.lerp(this.lid.rotation.x, 0, dt * 6);
    }
  }
}
