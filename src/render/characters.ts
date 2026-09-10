import * as THREE from 'three';

export type ZombieType = 'walker' | 'runner' | 'crawler' | 'brute' | 'screamer' | 'boss';

export interface PlayerCharacter {
  group: THREE.Group;
  weaponSlotGroup: THREE.Group;
  flashlight: THREE.SpotLight;
  flashlightTarget: THREE.Object3D;
  setAim(aimX: number, aimZ: number): void;
  setWeapon(createMesh: (isPap?: boolean) => THREE.Group, isPap?: boolean): void;
  updateAnimation(dt: number, vx: number, vz: number, isRolling: boolean, isMeleeing: boolean, recoilT: number): void;
  toggleFlashlight(): boolean;
  dispose(): void;
}

export interface ZombieCharacter {
  id: string;
  type: ZombieType;
  group: THREE.Group;
  eyeLights: THREE.Mesh[];
  head: THREE.Group;
  updateAnimation(dt: number, speed: number, isAttacking: boolean, isShrieking?: boolean): void;
  dispose(): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO (PLAYER) BUILDER WITH MODULAR WEAPON SLOTS
// ─────────────────────────────────────────────────────────────────────────────
export function createPlayerMesh(): PlayerCharacter {
  const root = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: '#d4a373', roughness: 0.6 });
  const vestMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 });
  const bootMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });

  // Torso / Hips
  const hips = new THREE.Group();
  hips.position.y = 0.95;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.28), vestMat);
  torso.position.y = 0.29;
  hips.add(torso);

  // Chest Plate / Ammo Pouches
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: '#b45309' }));
  pouch.position.set(0, 0.26, 0.16);
  hips.add(pouch);

  // Neck & Head
  const neck = new THREE.Group();
  neck.position.set(0, 0.58, 0);
  hips.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), skinMat);
  head.position.set(0, 0.13, 0);
  neck.add(head);

  // Tactical Bandana
  const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.06, 0.27), new THREE.MeshBasicMaterial({ color: '#dc2626' }));
  bandana.position.set(0, 0.16, 0);
  neck.add(bandana);

  // Limbs: Legs
  const leftThigh = new THREE.Group();
  leftThigh.position.set(-0.14, 0, 0);
  const lThighMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.16), pantsMat);
  lThighMesh.position.y = -0.22;
  leftThigh.add(lThighMesh);
  hips.add(leftThigh);

  const leftShin = new THREE.Group();
  leftShin.position.set(0, -0.44, 0);
  const lShinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), bootMat);
  lShinMesh.position.y = -0.21;
  leftShin.add(lShinMesh);
  leftThigh.add(leftShin);

  const rightThigh = new THREE.Group();
  rightThigh.position.set(0.14, 0, 0);
  const rThighMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.16), pantsMat);
  rThighMesh.position.y = -0.22;
  rightThigh.add(rThighMesh);
  hips.add(rightThigh);

  const rightShin = new THREE.Group();
  rightShin.position.set(0, -0.44, 0);
  const rShinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), bootMat);
  rShinMesh.position.y = -0.21;
  rightShin.add(rShinMesh);
  rightThigh.add(rightShin);

  // Limbs: Arms
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.28, 0.52, 0);
  const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), skinMat);
  rArmMesh.position.y = -0.16;
  rightShoulder.add(rArmMesh);
  hips.add(rightShoulder);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.32, 0);
  const rForeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), skinMat);
  rForeMesh.position.y = -0.15;
  rightForearm.add(rForeMesh);
  rightShoulder.add(rightForearm);

  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.28, 0.52, 0);
  const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), skinMat);
  lArmMesh.position.y = -0.16;
  leftShoulder.add(lArmMesh);
  hips.add(leftShoulder);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.32, 0);
  const lForeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), skinMat);
  lForeMesh.position.y = -0.15;
  leftForearm.add(lForeMesh);
  leftShoulder.add(leftForearm);

  // ── Modular 3D Weapon Slot ───────────────────────────────────────────────
  const weaponSlotGroup = new THREE.Group();
  weaponSlotGroup.position.set(0, -0.25, 0.18);
  weaponSlotGroup.rotation.x = Math.PI / 2;
  rightForearm.add(weaponSlotGroup);

  let currentWeaponMesh: THREE.Group | null = null;
  const setWeapon = (createMesh: (isPap?: boolean) => THREE.Group, isPap: boolean = false): void => {
    if (currentWeaponMesh) {
      weaponSlotGroup.remove(currentWeaponMesh);
    }
    currentWeaponMesh = createMesh(isPap);
    weaponSlotGroup.add(currentWeaponMesh);
  };

  // Tactical Flashlight attached to barrel
  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0, 0.9, 12);
  root.add(flashlightTarget);

  const flashlight = new THREE.SpotLight('#fef08a', 4.5, 28, Math.PI / 6, 0.35, 1.2);
  flashlight.position.set(0.2, 0.9, 0.8);
  flashlight.target = flashlightTarget;
  root.add(flashlight);

  // Omnidirectional player body fill light
  const personalLight = new THREE.PointLight('#f8fafc', 1.4, 8);
  personalLight.position.set(0, 1.2, 0);
  root.add(personalLight);

  // Stance setup
  rightShoulder.rotation.x = -Math.PI / 3;
  rightShoulder.rotation.z = -0.2;
  rightForearm.rotation.x = -Math.PI / 4;

  leftShoulder.rotation.x = -Math.PI / 2.6;
  leftShoulder.rotation.y = 0.35;
  leftForearm.rotation.x = -Math.PI / 3.2;

  let walkPhase = 0;
  let flashlightOn = true;

  const setAim = (aimX: number, aimZ: number): void => {
    const dx = aimX - root.position.x;
    const dz = aimZ - root.position.z;
    const angle = Math.atan2(dx, dz);
    root.rotation.y = angle;

    flashlightTarget.position.set(root.position.x + dx, 0.9, root.position.z + dz);
  };

  const updateAnimation = (
    dt: number,
    vx: number,
    vz: number,
    isRolling: boolean,
    isMeleeing: boolean,
    recoilT: number
  ): void => {
    const speed = Math.hypot(vx, vz);

    if (isRolling) {
      hips.rotation.x += dt * 18;
      hips.position.y = 0.5 + Math.sin(hips.rotation.x) * 0.2;
      return;
    } else {
      hips.rotation.x = 0;
      hips.position.y = 0.95;
    }

    if (isMeleeing) {
      rightShoulder.rotation.x = -Math.PI / 1.8;
      rightShoulder.position.z = 0.25;
      rightForearm.rotation.x = -0.1;
      return;
    } else {
      rightShoulder.position.z = 0;
    }

    // Weapon recoil kick
    if (recoilT > 0) {
      const kick = Math.sin(recoilT * Math.PI) * 0.35;
      weaponSlotGroup.position.z = 0.18 - kick * 0.15;
      weaponSlotGroup.rotation.x = Math.PI / 2 - kick * 0.3;
    } else {
      weaponSlotGroup.position.z = 0.18;
      weaponSlotGroup.rotation.x = Math.PI / 2;
    }

    // Stride animation
    if (speed > 0.1) {
      walkPhase += dt * speed * 7.5;
      leftThigh.rotation.x = Math.sin(walkPhase) * 0.6;
      leftShin.rotation.x = Math.max(0, -Math.sin(walkPhase)) * 0.7;
      rightThigh.rotation.x = -Math.sin(walkPhase) * 0.6;
      rightShin.rotation.x = Math.max(0, Math.sin(walkPhase)) * 0.7;
      hips.position.y = 0.95 + Math.abs(Math.sin(walkPhase * 2)) * 0.05;
    } else {
      leftThigh.rotation.x = 0;
      leftShin.rotation.x = 0;
      rightThigh.rotation.x = 0;
      rightShin.rotation.x = 0;
      hips.position.y = 0.95;
    }
  };

  const toggleFlashlight = (): boolean => {
    flashlightOn = !flashlightOn;
    flashlight.visible = flashlightOn;
    personalLight.visible = flashlightOn;
    return flashlightOn;
  };

  return {
    group: root,
    weaponSlotGroup,
    flashlight,
    flashlightTarget,
    setAim,
    setWeapon,
    updateAnimation,
    toggleFlashlight,
    dispose: () => {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 3D ZOMBIE MESH BUILDER & VARIANTS
// ─────────────────────────────────────────────────────────────────────────────
export function createZombieMesh(id: string, type: ZombieType): ZombieCharacter {
  const root = new THREE.Group();

  let skinColor = '#22c55e';
  let shirtColor = '#1e3a5f';
  let eyeColor = '#ef4444';
  let scale = 1.0;
  let isCrawler = false;

  switch (type) {
    case 'walker':
      skinColor = '#4ade80';
      shirtColor = '#15803d';
      eyeColor = '#ef4444';
      scale = 1.0;
      break;
    case 'runner':
      skinColor = '#86efac';
      shirtColor = '#b91c1c';
      eyeColor = '#f87171';
      scale = 0.95;
      break;
    case 'crawler':
      skinColor = '#3f6212';
      shirtColor = '#374151';
      eyeColor = '#ef4444';
      scale = 0.85;
      isCrawler = true;
      break;
    case 'brute':
      skinColor = '#166534';
      shirtColor = '#0f172a';
      eyeColor = '#dc2626';
      scale = 1.4;
      break;
    case 'screamer':
      skinColor = '#dcfce7';
      shirtColor = '#4c0519';
      eyeColor = '#f59e0b';
      scale = 0.9;
      break;
    case 'boss':
      skinColor = '#14532d';
      shirtColor = '#450a0a';
      eyeColor = '#ff0000';
      scale = 1.85;
      break;
  }

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.9 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

  const hips = new THREE.Group();
  hips.position.y = isCrawler ? 0.25 : 0.95;
  if (isCrawler) hips.rotation.x = Math.PI / 2.4;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.26), shirtMat);
  torso.position.y = 0.28;
  hips.add(torso);

  if (type === 'brute') {
    const armor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.32), new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8 }));
    armor.position.y = 0.3;
    hips.add(armor);
  } else if (type === 'boss') {
    for (const sx of [-0.28, 0.28]) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshStandardMaterial({ color: '#7f1d1d' }));
      spike.position.set(sx, 0.62, 0);
      spike.rotation.z = sx > 0 ? -0.4 : 0.4;
      hips.add(spike);
    }
  }

  const neck = new THREE.Group();
  neck.position.set(0, 0.56, 0);
  hips.add(neck);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), skinMat);
  headMesh.position.set(0, 0.13, 0);
  neck.add(headMesh);

  const eyeLights: THREE.Mesh[] = [];
  for (const ex of [-0.07, 0.07]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eye.position.set(ex, 0.16, 0.14);
    neck.add(eye);
    eyeLights.push(eye);
  }

  const leftThigh = new THREE.Group();
  leftThigh.position.set(-0.13, 0, 0);
  const lThighMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.15), pantsMat);
  lThighMesh.position.y = -0.22;
  leftThigh.add(lThighMesh);
  hips.add(leftThigh);

  const leftShin = new THREE.Group();
  leftShin.position.set(0, -0.44, 0);
  const lShinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.4, 0.13), skinMat);
  lShinMesh.position.y = -0.2;
  leftShin.add(lShinMesh);
  leftThigh.add(leftShin);

  const rightThigh = new THREE.Group();
  rightThigh.position.set(0.13, 0, 0);
  const rThighMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.15), pantsMat);
  rThighMesh.position.y = -0.22;
  rightThigh.add(rThighMesh);
  hips.add(rightThigh);

  const rightShin = new THREE.Group();
  rightShin.position.set(0, -0.44, 0);
  const rShinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.4, 0.13), skinMat);
  rShinMesh.position.y = -0.2;
  rightShin.add(rShinMesh);
  rightThigh.add(rightShin);

  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.27, 0.5, 0);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), skinMat);
  lArm.position.y = -0.16;
  leftShoulder.add(lArm);
  hips.add(leftShoulder);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.32, 0);
  const lFore = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), skinMat);
  lFore.position.y = -0.15;
  leftForearm.add(lFore);
  leftShoulder.add(leftForearm);

  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.27, 0.5, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), skinMat);
  rArm.position.y = -0.16;
  rightShoulder.add(rArm);
  hips.add(rightShoulder);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.32, 0);
  const rFore = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), skinMat);
  rFore.position.y = -0.15;
  rightForearm.add(rFore);
  rightShoulder.add(rightForearm);

  leftShoulder.rotation.x = -Math.PI / 2.3;
  rightShoulder.rotation.x = -Math.PI / 2.1;
  neck.rotation.x = 0.25;

  root.scale.set(scale, scale, scale);

  let animT = Math.random() * 10;

  const updateAnimation = (dt: number, speed: number, isAttacking: boolean, isShrieking: boolean = false): void => {
    animT += dt * (speed > 0.1 ? speed * 6 : 2);

    if (isShrieking) {
      neck.rotation.x = -0.6 + Math.sin(animT * 12) * 0.1;
      leftShoulder.rotation.z = -0.8;
      rightShoulder.rotation.z = 0.8;
      return;
    }

    if (isCrawler) {
      leftShoulder.rotation.x = -Math.PI / 2 + Math.sin(animT) * 0.8;
      rightShoulder.rotation.x = -Math.PI / 2 - Math.sin(animT) * 0.8;
      hips.position.y = 0.25 + Math.abs(Math.sin(animT * 2)) * 0.06;
      return;
    }

    if (speed > 0.1) {
      leftThigh.rotation.x = Math.sin(animT) * 0.55;
      leftShin.rotation.x = Math.max(0, -Math.sin(animT)) * 0.6;
      rightThigh.rotation.x = -Math.sin(animT) * 0.55;
      rightShin.rotation.x = Math.max(0, Math.sin(animT)) * 0.6;
      leftShoulder.rotation.x = -Math.PI / 2.2 + Math.sin(animT) * 0.3;
      rightShoulder.rotation.x = -Math.PI / 2.2 - Math.sin(animT) * 0.3;
      neck.rotation.y = Math.sin(animT * 0.7) * 0.2;
    } else {
      leftThigh.rotation.x = 0;
      rightThigh.rotation.x = 0;
    }

    if (isAttacking) {
      hips.position.z = Math.sin(animT * 14) * 0.15;
    } else {
      hips.position.z = 0;
    }
  };

  return {
    id,
    type,
    group: root,
    eyeLights,
    head: neck,
    updateAnimation,
    dispose: () => {},
  };
}
