/**
 * ============================================================================
 *  3D HOLOGRAPHIC SIGHT — floating world-space tactical targeting reticle
 * ============================================================================
 *
 * Replaces flat 2D screen crosshairs with a hovering 3D holographic pointer
 * in the game world:
 *   - Floating glowing reticle (ring + inward chevron ticks + center pip)
 *   - Emissive cyan/amber hologram material with subtle pulse animation
 *   - Subtle laser projection beam connecting the weapon muzzle to the reticle
 *   - Target Acquisition feedback: when hovering over or near a zombie,
 *     the reticle shifts from tactical cyan (`#38bdf8`) to target-lock crimson (`#ef4444`)
 *   - Height-aware: projects onto upper floors or elevated obstacles so you
 *     always know your exact 3D point of impact
 */

import * as THREE from 'three';

export interface ReticleTargetInfo {
  isTargetLocked: boolean;
  targetDistance: number;
  targetHeadshotWindow: boolean;
}

export class Reticle3D {
  group = new THREE.Group();
  ringMesh: THREE.Mesh;
  centerPip: THREE.Mesh;
  chevrons: THREE.Mesh[] = [];
  laserLine: THREE.Line;
  light: THREE.PointLight;

  private matCyan = new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true });
  private matRed = new THREE.MeshBasicMaterial({ color: '#ef4444', wireframe: true });
  private lineMat = new THREE.LineBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.35 });

  private animT = 0;

  constructor(scene: THREE.Scene) {
    // 1. Outer holographic ring
    const ringGeo = new THREE.RingGeometry(0.32, 0.36, 24);
    this.ringMesh = new THREE.Mesh(ringGeo, this.matCyan);
    this.ringMesh.rotation.x = -Math.PI / 2; // Lie flat on XZ plane
    this.group.add(this.ringMesh);

    // 2. Center dot / pip
    const pipGeo = new THREE.CircleGeometry(0.04, 12);
    this.centerPip = new THREE.Mesh(pipGeo, this.matCyan);
    this.centerPip.rotation.x = -Math.PI / 2;
    this.group.add(this.centerPip);

    // 3. Three inward chevron indicator ticks
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const tickGeo = new THREE.ConeGeometry(0.06, 0.14, 3);
      const tick = new THREE.Mesh(tickGeo, this.matCyan);
      tick.rotation.x = Math.PI / 2;
      tick.rotation.z = angle + Math.PI;
      tick.position.set(Math.sin(angle) * 0.48, 0, Math.cos(angle) * 0.48);
      this.group.add(tick);
      this.chevrons.push(tick);
    }

    // 4. Subtle soft holographic illumination
    this.light = new THREE.PointLight('#38bdf8', 1.2, 3.5);
    this.light.position.y = 0.2;
    this.group.add(this.light);

    // 5. Weapon muzzle laser line
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    this.laserLine = new THREE.Line(laserGeo, this.lineMat);
    scene.add(this.laserLine);

    scene.add(this.group);
  }

  /**
   * Update the 3D sight position and animation.
   *
   * @param aimPos World coordinates where the player is aiming
   * @param muzzlePos World coordinates of the weapon muzzle
   * @param targetInfo Target lock status (near or on a zombie)
   * @param dt Frame delta time
   */
  update(
    aimPos: THREE.Vector3,
    muzzlePos: THREE.Vector3,
    targetInfo: ReticleTargetInfo,
    dt: number,
  ): void {
    this.animT += dt;

    // Hover slightly above the floor/surface
    this.group.position.set(aimPos.x, aimPos.y + 0.12, aimPos.z);

    // Slow tactical holographic rotation
    this.ringMesh.rotation.z += dt * 1.5;

    // Pulse scale based on target lock
    const pulseSpeed = targetInfo.isTargetLocked ? 14 : 4;
    const pulseMag = targetInfo.isTargetLocked ? 0.08 : 0.03;
    const scale = 1.0 + Math.sin(this.animT * pulseSpeed) * pulseMag;
    this.ringMesh.scale.set(scale, scale, 1);

    // Target lock color shift
    const activeMat = targetInfo.isTargetLocked ? this.matRed : this.matCyan;
    this.ringMesh.material = activeMat;
    this.centerPip.material = activeMat;
    for (const c of this.chevrons) {
      c.material = activeMat;
    }
    this.light.color.set(targetInfo.isTargetLocked ? '#ef4444' : '#38bdf8');
    this.lineMat.color.set(targetInfo.isTargetLocked ? '#ef4444' : '#38bdf8');
    this.lineMat.opacity = targetInfo.isTargetLocked ? 0.6 : 0.25;

    // Update laser line endpoints
    const positions = this.laserLine.geometry.attributes.position;
    if (positions) {
      positions.setXYZ(0, muzzlePos.x, muzzlePos.y, muzzlePos.z);
      positions.setXYZ(1, aimPos.x, aimPos.y + 0.1, aimPos.z);
      positions.needsUpdate = true;
    }
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
    this.laserLine.visible = visible;
  }

  dispose(): void {
    // TODO: dispose geometries and materials
  }
}
