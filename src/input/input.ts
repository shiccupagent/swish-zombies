import * as THREE from 'three';

export interface InputState {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  aimX: number;  // court floor world X
  aimY: number;  // court floor world Y (verticality aware)
  aimZ: number;  // court floor world Z
  isFiring: boolean;
  justFired: boolean;
  isRolling: boolean;
  isMeleeing: boolean;
  isReloading: boolean;
  isInteracting: boolean;
  swapWeapon: boolean;
  selectWeaponSlot: number | null; // 0 or 1
  toggleFlashlight: boolean;
  /** [G] key — throw a grenade. */
  throwGrenade: boolean;
  /** [Z] / [C] keys — camera rotation snap (-1 for left, 1 for right). */
  rotateCamera: number;
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private mousePos = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private courtIntersection = new THREE.Vector3();

  private isMouseDown: boolean = false;
  private justFiredFlag: boolean = false;
  private rollTriggered: boolean = false;
  private meleeTriggered: boolean = false;
  private reloadTriggered: boolean = false;
  private grenadeTriggered: boolean = false;
  private interactTriggered: boolean = false;
  private swapTriggered: boolean = false;
  private slotSelected: number | null = null;
  private flashlightTriggered: boolean = false;
  private cameraRotateTrigger: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.rollTriggered = true;
      } else if (e.code === 'KeyE') {
        this.interactTriggered = true;
      } else if (e.code === 'KeyQ') {
        this.swapTriggered = true;
      } else if (e.code === 'KeyF') {
        this.meleeTriggered = true;
      } else if (e.code === 'KeyR') {
        this.reloadTriggered = true;
      } else if (e.code === 'KeyT') {
        this.flashlightTriggered = true;
      } else if (e.code === 'KeyG') {
        this.grenadeTriggered = true;
      } else if (e.code === 'KeyZ') {
        this.cameraRotateTrigger = -1;
      } else if (e.code === 'KeyC') {
        this.cameraRotateTrigger = 1;
      } else if (e.code === 'KeyL') {
        this.flashlightTriggered = true;
      } else if (e.code === 'Digit1') {
        this.slotSelected = 0;
      } else if (e.code === 'Digit2') {
        this.slotSelected = 1;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > 20) {
        this.swapTriggered = true;
      }
    }, { passive: true });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.justFiredFlag = true;
      } else if (e.button === 2) {
        e.preventDefault();
        this.rollTriggered = true;
      } else if (e.button === 1) {
        e.preventDefault();
        this.meleeTriggered = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  sample(camera: THREE.Camera, targetFloorY = 0): InputState {
    this.groundPlane.constant = targetFloorY;
    this.raycaster.setFromCamera(this.mousePos, camera);
    this.raycaster.ray.intersectPlane(this.groundPlane, this.courtIntersection);

    let mx = 0;
    let mz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) mz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) mz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len;
      mz /= len;
    }

    const state: InputState = {
      moveX: mx,
      moveZ: mz,
      aimX: this.courtIntersection.x,
      aimY: targetFloorY,
      aimZ: this.courtIntersection.z,
      isFiring: this.isMouseDown,
      justFired: this.justFiredFlag,
      isRolling: this.rollTriggered,
      isMeleeing: this.meleeTriggered,
      isReloading: this.reloadTriggered,
      isInteracting: this.interactTriggered,
      swapWeapon: this.swapTriggered,
      selectWeaponSlot: this.slotSelected,
      toggleFlashlight: this.flashlightTriggered,
      throwGrenade: this.grenadeTriggered,
      rotateCamera: this.cameraRotateTrigger,
    };

    // Reset single-frame triggers
    this.justFiredFlag = false;
    this.rollTriggered = false;
    this.meleeTriggered = false;
    this.reloadTriggered = false;
    this.grenadeTriggered = false;
    this.interactTriggered = false;
    this.swapTriggered = false;
    this.slotSelected = null;
    this.flashlightTriggered = false;
    this.cameraRotateTrigger = 0;

    return state;
  }
}
