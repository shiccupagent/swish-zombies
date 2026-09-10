import * as THREE from 'three';
import type { ZombieMap, MapObstacle } from './types.ts';

export function createNachtMap(): ZombieMap {
  const group = new THREE.Group();

  const bounds = {
    minX: -12.0,
    maxX: 12.0,
    minZ: -14.0,
    maxZ: 14.0,
  };

  const spawnPoints = [
    { x: -11.5, y: 0, z: -13.0, name: 'Northwest Window Barricade' },
    { x: 11.5, y: 0, z: -13.0, name: 'Northeast Window Barricade' },
    { x: -11.5, y: 0, z: 13.0, name: 'Southwest Trench Door' },
    { x: 11.5, y: 0, z: 13.0, name: 'Southeast Bunker Breach' },
    { x: 0, y: 0, z: -13.5, name: 'North Exterior Slit' },
  ];

  const obstacles: MapObstacle[] = [
    // Concrete Bunker Support Pillars
    { x: -5.0, z: -5.0, radius: 0.9, height: 4.5, isCover: true },
    { x: 5.0, z: -5.0, radius: 0.9, height: 4.5, isCover: true },
    { x: -5.0, z: 5.0, radius: 0.9, height: 4.5, isCover: true },
    { x: 5.0, z: 5.0, radius: 0.9, height: 4.5, isCover: true },
    // Sandbag Emplacement
    { x: 0, z: -2.0, radius: 0.8, height: 1.1, isCover: true },
  ];

  // ── 1. Concrete Bunker Floor Canvas ──────────────────────────────────────
  const floorW = 30;
  const floorH = 34;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Weathered cracked concrete
  ctx.fillStyle = '#1e232a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Slabs & seams
  ctx.strokeStyle = '#0f1217';
  ctx.lineWidth = 3;
  for (let x = 0; x < 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Dirt & grime weathering
  for (let i = 0; i < 400; i++) {
    const gx = Math.random() * 1024;
    const gy = Math.random() * 1024;
    const gr = 10 + Math.random() * 40;
    ctx.fillStyle = `rgba(10, 12, 16, ${0.1 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stenciled German Airfield Marker
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NACHT DER UNTOTEN — SEKTOR 1', 512, 512);

  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  const floorGeo = new THREE.PlaneGeometry(floorW, floorH);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.1 });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  group.add(floorMesh);

  // ── 2. Blood Decal Plane ──────────────────────────────────────────────────
  const bloodCanvas = document.createElement('canvas');
  bloodCanvas.width = 1024;
  bloodCanvas.height = 1024;
  const bctx = bloodCanvas.getContext('2d')!;
  bctx.clearRect(0, 0, 1024, 1024);

  const bloodTex = new THREE.CanvasTexture(bloodCanvas);
  bloodTex.colorSpace = THREE.SRGBColorSpace;
  const bloodMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(floorW, floorH),
    new THREE.MeshBasicMaterial({ map: bloodTex, transparent: true, opacity: 0.88, depthWrite: false })
  );
  bloodMesh.rotation.x = -Math.PI / 2;
  bloodMesh.position.y = 0.003;
  group.add(bloodMesh);

  // ── 3. Heavy Concrete Bunker Walls ────────────────────────────────────────
  const wallMat = new THREE.MeshStandardMaterial({ color: '#262d38', roughness: 0.95 });
  const beamMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.7, metalness: 0.6 });

  // Perimeter Walls with embrasure slits
  const wallH = 4.5;
  const wallThick = 1.0;

  // North wall
  const nWall = new THREE.Mesh(new THREE.BoxGeometry(floorW, wallH, wallThick), wallMat);
  nWall.position.set(0, wallH / 2, bounds.minZ - wallThick / 2);
  group.add(nWall);

  // South wall
  const sWall = new THREE.Mesh(new THREE.BoxGeometry(floorW, wallH, wallThick), wallMat);
  sWall.position.set(0, wallH / 2, bounds.maxZ + wallThick / 2);
  group.add(sWall);

  // West wall
  const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, floorH), wallMat);
  wWall.position.set(bounds.minX - wallThick / 2, wallH / 2, 0);
  group.add(wWall);

  // East wall
  const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, floorH), wallMat);
  eWall.position.set(bounds.maxX + wallThick / 2, wallH / 2, 0);
  group.add(eWall);

  // 4 Massive Concrete Pillars
  obstacles.slice(0, 4).forEach(p => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, wallH, 1.6), wallMat);
    pillar.position.set(p.x, wallH / 2, p.z);
    group.add(pillar);
  });

  // Sandbag Redoubt
  const sandMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.9 });
  const sandbag = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 0.9), sandMat);
  sandbag.position.set(0, 0.55, -2.0);
  group.add(sandbag);

  // Steel Ceiling Girders
  for (const z of [-7, 0, 7]) {
    const girder = new THREE.Mesh(new THREE.BoxGeometry(floorW, 0.5, 0.5), beamMat);
    girder.position.set(0, wallH - 0.25, z);
    group.add(girder);
  }

  // ── 6. Industrial Bunker Lighting & Searchlights ────────────────────────────
  // Overhead Caged Incandescent Ceiling Lamps
  const lampPositions: Array<[number, number]> = [
    [-5, -6],
    [5, -6],
    [-5, 6],
    [5, 6],
  ];

  const cageMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });

  lampPositions.forEach(([lx, lz]) => {
    // Visual industrial lamp mount
    const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8), cageMat);
    mount.position.set(lx, wallH - 0.15, lz);
    group.add(mount);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), bulbMat);
    bulb.position.set(lx, wallH - 0.35, lz);
    group.add(bulb);

    const pLight = new THREE.PointLight('#fef08a', 2.4, 15);
    pLight.position.set(lx, wallH - 0.5, lz);
    group.add(pLight);
  });

  // Dual Exterior Breach Searchlights
  const searchLight1 = new THREE.SpotLight('#93c5fd', 3.2, 28, Math.PI / 4, 0.4);
  searchLight1.position.set(-11, 3.8, -13);
  searchLight1.target.position.set(-2, 0, -4);
  group.add(searchLight1);
  group.add(searchLight1.target);

  const searchLight2 = new THREE.SpotLight('#93c5fd', 3.2, 28, Math.PI / 4, 0.4);
  searchLight2.position.set(11, 3.8, 13);
  searchLight2.target.position.set(2, 0, 4);
  group.add(searchLight2);
  group.add(searchLight2.target);

  // Mystery Box Alcove Spotlight
  const boxLight = new THREE.SpotLight('#fef08a', 2.4, 12, Math.PI / 3, 0.4);
  boxLight.position.set(7.5, 3.6, -8.5);
  boxLight.target.position.set(7.5, 0, -8.5);
  group.add(boxLight);
  group.add(boxLight.target);

  // Pack-a-Punch Alcove Spotlight (Cyan Neon)
  const papSpot = new THREE.SpotLight('#38bdf8', 2.8, 12, Math.PI / 3, 0.4);
  papSpot.position.set(-7.5, 3.6, 8.5);
  papSpot.target.position.set(-7.5, 0, 8.5);
  group.add(papSpot);
  group.add(papSpot.target);

  // Center Red Emergency Strobe Light
  const redEmergency = new THREE.PointLight('#ef4444', 2.0, 10);
  redEmergency.position.set(0, 3.5, 0);
  group.add(redEmergency);

  // Decal plotting
  const addBloodDecal = (worldX: number, worldZ: number, radius: number): void => {
    const u = (worldX + floorW / 2) / floorW;
    const v = (worldZ + floorH / 2) / floorH;
    const cx = u * 1024;
    const cy = v * 1024;
    const pxRadius = Math.max(8, (radius / floorW) * 1024);

    bctx.save();
    bctx.fillStyle = '#520404';
    bctx.beginPath();
    bctx.arc(cx, cy, pxRadius, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
    bloodTex.needsUpdate = true;
  };

  return {
    id: 'nacht',
    name: 'Nacht der Untoten',
    desc: 'The Original Abandoned Concrete Bunker & Aerodrome',
    courtBounds: bounds,
    spawnPoints,
    obstacles,
    wallBuys: [
      { weaponId: 'kar98k', x: 0, y: 1.6, z: bounds.maxZ, rotationY: Math.PI },
      { weaponId: 'olympia', x: bounds.minX, y: 1.6, z: -2.0, rotationY: Math.PI / 2 },
      { weaponId: 'mp40', x: bounds.maxX, y: 1.6, z: -2.0, rotationY: -Math.PI / 2 },
      { weaponId: 'stg44', x: 0, y: 1.6, z: bounds.minZ, rotationY: 0 },
    ],
    mysteryBoxPos: { x: 7.5, z: -8.5, yaw: -Math.PI / 4 },
    packAPunchPos: { x: -7.5, z: 8.5, yaw: Math.PI / 4 },
    ambientColor: '#0f172a',
    fogColor: '#030712',
    group,
    addBloodDecal,
    update: () => {},
    dispose: () => {
      floorTex.dispose();
      bloodTex.dispose();
      floorGeo.dispose();
      floorMat.dispose();
    },
  };
}
