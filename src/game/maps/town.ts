import * as THREE from 'three';
import type { ZombieMap, MapObstacle } from './types.ts';

export function createTownMap(): ZombieMap {
  const group = new THREE.Group();

  const bounds = {
    minX: -14.0,
    maxX: 14.0,
    minZ: -16.0,
    maxZ: 16.0,
  };

  const spawnPoints = [
    { x: -13.0, y: 0, z: -15.0, name: 'Diner Alley Spawner' },
    { x: 13.0, y: 0, z: -15.0, name: 'Bank Vault Breach' },
    { x: -13.0, y: 0, z: 15.0, name: 'Barricaded Highway' },
    { x: 13.0, y: 0, z: 15.0, name: 'Lava Fissure Trench' },
    { x: 0, y: 0, z: 15.5, name: 'Downtown Main Road' },
  ];

  const obstacles: MapObstacle[] = [
    // Wrecked Police Car (Center-Left)
    { x: -4.0, z: 2.0, radius: 1.4, height: 1.5, isCover: true },
    // Burning Dumpster / Concrete Barrier
    { x: 5.0, z: -3.0, radius: 1.1, height: 1.4, isCover: true },
    // Streetlamp Post
    { x: -7.0, z: -8.0, radius: 0.3, height: 4.5, isCover: true },
    { x: 7.0, z: 8.0, radius: 0.3, height: 4.5, isCover: true },
  ];

  // ── 1. Asphalt Roadway Floor Canvas ──────────────────────────────────────
  const floorW = 34;
  const floorH = 38;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark cracked asphalt
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 1024, 1024);

  // Concrete sidewalk shoulders
  ctx.fillStyle = '#27272a';
  ctx.fillRect(0, 0, 140, 1024);
  ctx.fillRect(1024 - 140, 0, 140, 1024);

  // Sidewalk curb line
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 4;
  ctx.strokeRect(140, 0, 1024 - 280, 1024);

  // Double Yellow Center Highway Lines
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(506, 0); ctx.lineTo(506, 1024);
  ctx.moveTo(518, 0); ctx.lineTo(518, 1024);
  ctx.stroke();

  // Molten Lava Fissure Cracks across street
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(250, 420);
  ctx.lineTo(410, 460);
  ctx.lineTo(530, 430);
  ctx.lineTo(760, 480);
  ctx.stroke();

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 420);
  ctx.lineTo(410, 460);
  ctx.lineTo(530, 430);
  ctx.lineTo(760, 480);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(floorW, floorH),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.1 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  group.add(floorMesh);

  // ── 2. Blood Decal Plane ──────────────────────────────────────────────────
  const bloodCanvas = document.createElement('canvas');
  bloodCanvas.width = 1024;
  bloodCanvas.height = 1024;
  const bctx = bloodCanvas.getContext('2d')!;

  const bloodTex = new THREE.CanvasTexture(bloodCanvas);
  bloodTex.colorSpace = THREE.SRGBColorSpace;
  const bloodMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(floorW, floorH),
    new THREE.MeshBasicMaterial({ map: bloodTex, transparent: true, opacity: 0.88, depthWrite: false })
  );
  bloodMesh.rotation.x = -Math.PI / 2;
  bloodMesh.position.y = 0.003;
  group.add(bloodMesh);

  // ── 3. Wrecked Police Car ────────────────────────────────────────────────
  const carGroup = new THREE.Group();
  carGroup.position.set(-4.0, 0, 2.0);
  carGroup.rotation.y = 0.45;

  const carMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5, metalness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.1 });

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 3.8), carMat);
  chassis.position.y = 0.55;
  carGroup.add(chassis);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 1.8), glassMat);
  cabin.position.set(0, 1.15, -0.2);
  carGroup.add(cabin);

  // Red/Blue Emergency Lightbar
  const barMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.25), barMat);
  bar.position.set(0, 1.55, -0.2);
  carGroup.add(bar);

  group.add(carGroup);

  // ── 4. Molten Lava Fissure Radiance ───────────────────────────────────────
  const lavaPoints: Array<[number, number]> = [[-6, -2], [0, -1], [6, -0.5]];
  lavaPoints.forEach(([lx, lz]) => {
    const lLight = new THREE.PointLight('#f97316', 3.0, 12);
    lLight.position.set(lx, 0.7, lz);
    group.add(lLight);
  });

  // ── 5. Police Cruiser Emergency Beacons ────────────────────────────────────
  const policeRed = new THREE.PointLight('#ef4444', 2.8, 12);
  policeRed.position.set(-6.3, 1.4, -4.0);
  group.add(policeRed);

  const policeBlue = new THREE.PointLight('#3b82f6', 2.8, 12);
  policeBlue.position.set(-5.7, 1.4, -4.0);
  group.add(policeBlue);

  // ── 6. 4 Highway Cobra-Head Streetlamps ───────────────────────────────────
  const poleMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8 });
  const lampPositions: Array<[number, number]> = [
    [-8, -9],
    [8, -9],
    [-8, 9],
    [8, 9],
  ];
  lampPositions.forEach((pos) => {
    const lx = pos[0];
    const lz = pos[1];
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.5, 8), poleMat);
    pole.position.set(lx, 2.25, lz);
    group.add(pole);

    const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), poleMat);
    lampArm.position.set(lx + (lx < 0 ? 0.4 : -0.4), 4.4, lz);
    group.add(lampArm);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
    bulb.position.set(lx + (lx < 0 ? 0.7 : -0.7), 4.3, lz);
    group.add(bulb);

    const lamp = new THREE.SpotLight('#fde047', 3.4, 22, Math.PI / 3.5, 0.45);
    lamp.position.set(lx + (lx < 0 ? 0.7 : -0.7), 4.3, lz);
    lamp.target.position.set(lx + (lx < 0 ? 3 : -3), 0, lz);
    group.add(lamp);
    group.add(lamp.target);
  });

  // ── 7. Mystery Box & Pack-a-Punch Spotlights ─────────────────────────────
  const townBoxSpot = new THREE.SpotLight('#fef08a', 2.5, 12, Math.PI / 3, 0.4);
  townBoxSpot.position.set(4.5, 4.0, 5.0);
  townBoxSpot.target.position.set(4.5, 0, 5.0);
  group.add(townBoxSpot);
  group.add(townBoxSpot.target);

  const townPapSpot = new THREE.SpotLight('#38bdf8', 2.8, 14, Math.PI / 3, 0.4);
  townPapSpot.position.set(0, 4.0, -10.0);
  townPapSpot.target.position.set(0, 0, -10.0);
  group.add(townPapSpot);
  group.add(townPapSpot.target);

  const addBloodDecal = (worldX: number, worldZ: number, radius: number): void => {
    const u = (worldX + floorW / 2) / floorW;
    const v = (worldZ + floorH / 2) / floorH;
    const cx = u * 1024;
    const cy = v * 1024;
    const pxRadius = Math.max(8, (radius / floorW) * 1024);

    bctx.save();
    bctx.fillStyle = '#4c0519';
    bctx.beginPath();
    bctx.arc(cx, cy, pxRadius, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
    bloodTex.needsUpdate = true;
  };

  return {
    id: 'town',
    name: 'Town Outskirts',
    desc: 'Asphalt Ruins with Molten Lava Fissures & Wrecked Vehicles',
    courtBounds: bounds,
    spawnPoints,
    obstacles,
    wallBuys: [
      { weaponId: 'olympia', x: bounds.minX, y: 1.6, z: 4.0, rotationY: Math.PI / 2 },
      { weaponId: 'mp40', x: bounds.maxX, y: 1.6, z: -4.0, rotationY: -Math.PI / 2 },
      { weaponId: 'stg44', x: 0, y: 1.6, z: bounds.minZ, rotationY: 0 },
      { weaponId: 'kar98k', x: 0, y: 1.6, z: bounds.maxZ, rotationY: Math.PI },
    ],
    mysteryBoxPos: { x: 4.5, z: 5.0, yaw: -Math.PI / 3 },
    packAPunchPos: { x: 0, z: -10.0, yaw: 0 },
    ambientColor: '#1c1917',
    fogColor: '#0a0a0a',
    group,
    addBloodDecal,
    update: () => {},
    dispose: () => {
      floorTex.dispose();
      bloodTex.dispose();
    },
  };
}
