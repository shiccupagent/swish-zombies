import * as THREE from 'three';
import type { ZombieMap, MapObstacle } from './types.ts';
import type { WallBuyLocation } from '../wallBuys.ts';

export interface CustomMapJson {
  id?: string;
  name: string;
  desc?: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  floorColor?: string;
  wallColor?: string;
  ambientColor?: string;
  fogColor?: string;
  spawnPoints: Array<{ x: number; y: number; z: number; name: string }>;
  obstacles: Array<{ x: number; z: number; radius: number; height?: number; isCover?: boolean }>;
  wallBuys: WallBuyLocation[];
  mysteryBoxPos?: { x: number; z: number; yaw?: number };
  packAPunchPos?: { x: number; z: number; yaw?: number };
}

export const SAMPLE_MODDED_MAP: CustomMapJson = {
  id: 'verruckt',
  name: 'Verrückt Sanatorium',
  desc: 'Claustrophobic Asylum corridors with electro-shock traps and blood-soaked tiles',
  bounds: { minX: -11.0, maxX: 11.0, minZ: -13.0, maxZ: 13.0 },
  floorColor: '#0f172a',
  wallColor: '#1e293b',
  ambientColor: '#020617',
  fogColor: '#020617',
  spawnPoints: [
    { x: -10.0, y: 0, z: -12.0, name: 'Electro-Shock Ward' },
    { x: 10.0, y: 0, z: -12.0, name: 'Surgical Annex' },
    { x: -10.0, y: 0, z: 12.0, name: 'Morgue Spawner' },
    { x: 10.0, y: 0, z: 12.0, name: 'Solitary Cell Block' },
  ],
  obstacles: [
    { x: -4.0, z: -4.0, radius: 1.0, height: 3.5, isCover: true },
    { x: 4.0, z: 4.0, radius: 1.0, height: 3.5, isCover: true },
    { x: 0, z: 0, radius: 1.2, height: 1.2, isCover: true },
  ],
  wallBuys: [
    { weaponId: 'kar98k', x: 0, y: 1.6, z: 12.5, rotationY: Math.PI },
    { weaponId: 'olympia', x: -10.5, y: 1.6, z: 0, rotationY: Math.PI / 2 },
    { weaponId: 'mp40', x: 10.5, y: 1.6, z: 0, rotationY: -Math.PI / 2 },
    { weaponId: 'stg44', x: 0, y: 1.6, z: -12.5, rotationY: 0 },
  ],
  mysteryBoxPos: { x: 6.0, z: -6.0, yaw: -Math.PI / 4 },
  packAPunchPos: { x: -6.0, z: 6.0, yaw: Math.PI / 4 },
};

export function createCustomMapFromJson(data: CustomMapJson): ZombieMap {
  const group = new THREE.Group();
  const bounds = data.bounds;

  const floorW = (bounds.maxX - bounds.minX) + 4;
  const floorH = (bounds.maxZ - bounds.minZ) + 4;

  // Floor Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = data.floorColor || '#1e293b';
  ctx.fillRect(0, 0, 1024, 1024);

  // Grid tiles
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  for (let x = 0; x < 1024; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(1024, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(data.name.toUpperCase(), 512, 512);

  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(floorW, floorH),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.1 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  group.add(floorMesh);

  // Blood Decal Overlay
  const bloodCanvas = document.createElement('canvas');
  bloodCanvas.width = 1024;
  bloodCanvas.height = 1024;
  const bctx = bloodCanvas.getContext('2d')!;
  const bloodTex = new THREE.CanvasTexture(bloodCanvas);
  bloodTex.colorSpace = THREE.SRGBColorSpace;
  const bloodMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(floorW, floorH),
    new THREE.MeshBasicMaterial({ map: bloodTex, transparent: true, opacity: 0.85, depthWrite: false })
  );
  bloodMesh.rotation.x = -Math.PI / 2;
  bloodMesh.position.y = 0.003;
  group.add(bloodMesh);

  // Perimeter Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: data.wallColor || '#1e293b', roughness: 0.85 });
  const wallH = 4.0;
  const wallThick = 0.8;

  // North wall
  const nW = new THREE.Mesh(new THREE.BoxGeometry(floorW, wallH, wallThick), wallMat);
  nW.position.set(0, wallH / 2, bounds.minZ - wallThick / 2);
  group.add(nW);

  // South wall
  const sW = new THREE.Mesh(new THREE.BoxGeometry(floorW, wallH, wallThick), wallMat);
  sW.position.set(0, wallH / 2, bounds.maxZ + wallThick / 2);
  group.add(sW);

  // West wall
  const wW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, floorH), wallMat);
  wW.position.set(bounds.minX - wallThick / 2, wallH / 2, 0);
  group.add(wW);

  // East wall
  const eW = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, floorH), wallMat);
  eW.position.set(bounds.maxX + wallThick / 2, wallH / 2, 0);
  group.add(eW);

  // Obstacles
  const obsList: MapObstacle[] = (data.obstacles || []).map(o => {
    const h = o.height || 2.5;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(o.radius * 2, h, o.radius * 2), wallMat);
    mesh.position.set(o.x, h / 2, o.z);
    group.add(mesh);
    return { x: o.x, z: o.z, radius: o.radius, height: h, isCover: true };
  });

  // ── Multi-Point Interior Ceiling Lights ──────────────────────────────────
  const qX = floorW * 0.28;
  const qZ = floorH * 0.28;
  const quadPositions: Array<[number, number]> = [
    [-qX, -qZ],
    [qX, -qZ],
    [-qX, qZ],
    [qX, qZ],
  ];
  quadPositions.forEach(([lx, lz]) => {
    const qLight = new THREE.PointLight(data.ambientColor || '#fef08a', 2.4, Math.max(floorW, floorH) * 0.7);
    qLight.position.set(lx, wallH - 0.5, lz);
    group.add(qLight);
  });

  // Center Accent Light
  const pLight = new THREE.PointLight('#38bdf8', 2.0, 18);
  pLight.position.set(0, wallH - 0.3, 0);
  group.add(pLight);

  // Spotlights for Mystery Box & Pack-a-Punch if present
  if (data.mysteryBoxPos) {
    const bSpot = new THREE.SpotLight('#fef08a', 2.5, 14, Math.PI / 3, 0.4);
    bSpot.position.set(data.mysteryBoxPos.x, wallH - 0.2, data.mysteryBoxPos.z);
    bSpot.target.position.set(data.mysteryBoxPos.x, 0, data.mysteryBoxPos.z);
    group.add(bSpot);
    group.add(bSpot.target);
  }
  if (data.packAPunchPos) {
    const papSpot = new THREE.SpotLight('#38bdf8', 2.8, 14, Math.PI / 3, 0.4);
    papSpot.position.set(data.packAPunchPos.x, wallH - 0.2, data.packAPunchPos.z);
    papSpot.target.position.set(data.packAPunchPos.x, 0, data.packAPunchPos.z);
    group.add(papSpot);
    group.add(papSpot.target);
  }

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
    id: data.id || `custom_${Date.now()}`,
    name: data.name,
    desc: data.desc || 'Custom CoD Modded Zombies Map',
    courtBounds: bounds,
    spawnPoints: data.spawnPoints,
    obstacles: obsList,
    wallBuys: data.wallBuys || [],
    mysteryBoxPos: data.mysteryBoxPos || { x: 5, z: -5 },
    packAPunchPos: data.packAPunchPos || { x: -5, z: 5 },
    ambientColor: data.ambientColor,
    fogColor: data.fogColor,
    group,
    addBloodDecal,
    update: () => {},
    dispose: () => {
      floorTex.dispose();
      bloodTex.dispose();
    },
  };
}
