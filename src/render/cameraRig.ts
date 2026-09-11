/**
 * ============================================================================
 *  CAMERA RIG — rotatable tactical chase camera with verticality tracking
 * ============================================================================
 *
 * In high-intensity zombie survival, a fixed camera angle creates blind spots
 * when zombies approach from the south (directly beneath the camera).
 *
 * This CameraRig provides:
 *   1. Full yaw rotation around the player (smooth orbit or 45°/90° quick snaps)
 *   2. Smooth target tracking following player position
 *   3. Verticality compensation: when the player climbs stairs or stands on
 *      an upper floor, the camera elevates smoothly to match floor height
 *   4. Screen-shake integration (explosions, shotgun blasts, zombie hits)
 *   5. Screen-to-world input projection: translates WASD movement relative to
 *      camera yaw so W always moves "forward" on screen regardless of angle
 */

import * as THREE from 'three';

export interface CameraRigOptions {
  distance?: number;      // Distance back from player (default 9.5)
  height?: number;        // Elevation above player (default 8.0)
  fov?: number;           // Field of view (default 54)
  smoothSpeed?: number;   // Lerp tracking speed (default 5.0)
}

export class CameraRig {
  camera: THREE.PerspectiveCamera;

  /** Current camera yaw in radians (0 = standard north-facing view). */
  yaw: number = 0;
  targetYaw: number = 0;

  /** Elevation / pitch angle. */
  pitch: number = 0.68; // ~39 degrees down

  /** Distance and height offsets. */
  distance: number;
  height: number;
  smoothSpeed: number;

  /** Current smoothed target position. */
  targetPos = new THREE.Vector3(0, 1.0, 0);

  /** Screen shake offset. */
  private shakeOffset = new THREE.Vector3();
  private shakeTimer = 0;
  private shakeIntensity = 0;

  constructor(options: CameraRigOptions = {}) {
    this.distance = options.distance ?? 9.5;
    this.height = options.height ?? 8.0;
    this.smoothSpeed = options.smoothSpeed ?? 5.0;

    this.camera = new THREE.PerspectiveCamera(
      options.fov ?? 54,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
  }

  /** Rotate camera by delta radians (e.g. from mouse drag or keys). */
  rotateBy(deltaYaw: number): void {
    this.targetYaw += deltaYaw;
  }

  /** Snap camera 90 degrees left or right. */
  snapRotate(direction: 'left' | 'right'): void {
    const step = Math.PI / 2;
    if (direction === 'left') {
      this.targetYaw += step;
    } else {
      this.targetYaw -= step;
    }
  }

  /** Trigger screen shake for an impact/explosion. */
  shake(intensity = 0.25, duration = 0.35): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  /**
   * Convert screen-relative input (WASD) to world-space movement vector
   * using current camera yaw.
   *
   * @param inX Raw horizontal input (-1 to 1)
   * @param inZ Raw vertical input (-1 to 1)
   * @returns World-space movement vector { x, z }
   */
  toWorldMovement(inX: number, inZ: number): { x: number; z: number } {
    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);
    return {
      x: inX * cos + inZ * sin,
      z: -inX * sin + inZ * cos,
    };
  }

  /**
   * Update camera position and lookAt target.
   *
   * @param playerX Player world X
   * @param playerY Player world Y (floor elevation)
   * @param playerZ Player world Z
   * @param dt Frame delta time
   */
  update(playerX: number, playerY: number, playerZ: number, dt: number): void {
    // Smooth yaw rotation toward target
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, dt * 8.0);

    // Smooth target follow (including verticality Y)
    const targetY = playerY + 1.0;
    this.targetPos.x = THREE.MathUtils.lerp(this.targetPos.x, playerX, dt * this.smoothSpeed);
    this.targetPos.y = THREE.MathUtils.lerp(this.targetPos.y, targetY, dt * this.smoothSpeed);
    this.targetPos.z = THREE.MathUtils.lerp(this.targetPos.z, playerZ, dt * this.smoothSpeed);

    // Calculate camera offset relative to player using yaw and pitch
    const camOffsetX = Math.sin(this.yaw) * this.distance;
    const camOffsetZ = Math.cos(this.yaw) * this.distance;
    const camOffsetY = this.height;

    // Apply screen shake
    this.shakeOffset.set(0, 0, 0);
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = this.shakeTimer / 0.35;
      const amp = this.shakeIntensity * decay;
      this.shakeOffset.set(
        (Math.random() - 0.5) * amp,
        (Math.random() - 0.5) * amp,
        (Math.random() - 0.5) * amp,
      );
    }

    this.camera.position.set(
      this.targetPos.x + camOffsetX + this.shakeOffset.x,
      this.targetPos.y + camOffsetY + this.shakeOffset.y,
      this.targetPos.z + camOffsetZ + this.shakeOffset.z,
    );

    this.camera.lookAt(this.targetPos);
  }

  handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
