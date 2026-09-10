import * as THREE from 'three';
import type { ZombieMap, MapObstacle, JumbotronInfo } from './types.ts';

const COURT = {
  halfWidth: 7.62,
  length: 28.65,
  halfLength: 14.325,
  laneHalfWidth: 2.45,
  laneDepth: 5.8,
  threeRadius: 6.75,
  centerRadius: 1.8,
  rimHeight: 3.05,
  rimRadius: 0.23,
  boardZ: 13.1, // distance from center
  boardW: 1.83,
  boardH: 1.07,
  boardY: 3.3,
};

export function createFieldhouseMap(): ZombieMap {
  const group = new THREE.Group();

  // Court boundaries
  const bounds = {
    minX: -13.0,
    maxX: 13.0,
    minZ: -16.0,
    maxZ: 16.0,
  };

  // 4 Corner Tunnel Spawn Points
  const spawnPoints = [
    { x: -12.5, y: 0, z: -14.5, name: 'Northwest Tunnel' },
    { x: 12.5, y: 0, z: -14.5, name: 'Northeast Tunnel' },
    { x: -12.5, y: 0, z: 14.5, name: 'Southwest Tunnel' },
    { x: 12.5, y: 0, z: 14.5, name: 'Southeast Tunnel' },
    { x: 0, y: 0, z: -15.5, name: 'North Main Gate' },
    { x: 0, y: 0, z: 15.5, name: 'South Main Gate' },
  ];

  // Hoop stanchions & obstacles
  const obstacles: MapObstacle[] = [
    { x: 0, z: -14.2, radius: 0.8, height: 4.0, isCover: true },
    { x: 0, z: 14.2, radius: 0.8, height: 4.0, isCover: true },
  ];

  // ── 1. Hardwood Court Canvas & Mesh ──────────────────────────────────────
  const courtW = 32;
  const courtH = 36;
  const courtCanvas = document.createElement('canvas');
  courtCanvas.width = 1024;
  courtCanvas.height = 1024;
  const cctx = courtCanvas.getContext('2d')!;

  // Render hardwood court
  renderHardwood(cctx, courtCanvas.width, courtCanvas.height);

  const courtTex = new THREE.CanvasTexture(courtCanvas);
  courtTex.colorSpace = THREE.SRGBColorSpace;

  const courtGeo = new THREE.PlaneGeometry(courtW, courtH);
  const courtMat = new THREE.MeshStandardMaterial({
    map: courtTex,
    roughness: 0.5,
    metalness: 0.05,
  });
  const courtMesh = new THREE.Mesh(courtGeo, courtMat);
  courtMesh.rotation.x = -Math.PI / 2;
  courtMesh.position.y = 0;
  courtMesh.receiveShadow = true;
  group.add(courtMesh);

  // ── 2. Blood Decal Overlay Plane ──────────────────────────────────────────
  const bloodCanvas = document.createElement('canvas');
  bloodCanvas.width = 1024;
  bloodCanvas.height = 1024;
  const bctx = bloodCanvas.getContext('2d')!;
  bctx.clearRect(0, 0, 1024, 1024);

  const bloodTex = new THREE.CanvasTexture(bloodCanvas);
  bloodTex.colorSpace = THREE.SRGBColorSpace;
  const bloodGeo = new THREE.PlaneGeometry(courtW, courtH);
  const bloodMat = new THREE.MeshBasicMaterial({
    map: bloodTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const bloodMesh = new THREE.Mesh(bloodGeo, bloodMat);
  bloodMesh.rotation.x = -Math.PI / 2;
  bloodMesh.position.y = 0.003;
  group.add(bloodMesh);

  // ── 3. Hoop Stanchions & Backboards ──────────────────────────────────────
  createHoopAssemblies(group);

  // ── 4. Bleachers & Stadium Tiered Stands ──────────────────────────────────
  createBleachers(group, bounds);

  // ── 5. Corner Tunnel Vomitories ──────────────────────────────────────────
  createSpawnTunnels(group);

  // ── 6. Overhead Light Trusses ────────────────────────────────────────────
  createLightTrusses(group);

  // ── 7. Dynamic 4-Panel Jumbotron ─────────────────────────────────────────
  const { jumboGroup, updateJumbo } = createJumbotron();
  group.add(jumboGroup);

  // Decal plotting helper
  const addBloodDecal = (worldX: number, worldZ: number, radius: number): void => {
    // Map world X (-16 to +16) and Z (-18 to +18) to 0..1024
    const u = (worldX + courtW / 2) / courtW;
    const v = (worldZ + courtH / 2) / courtH;
    const cx = u * 1024;
    const cy = v * 1024;
    const pxRadius = Math.max(8, (radius / courtW) * 1024);

    bctx.save();
    bctx.fillStyle = '#6b0808';
    bctx.beginPath();
    bctx.arc(cx, cy, pxRadius, 0, Math.PI * 2);
    bctx.fill();

    // Dark gore center
    bctx.fillStyle = '#3a0202';
    bctx.beginPath();
    bctx.arc(cx, cy, pxRadius * 0.55, 0, Math.PI * 2);
    bctx.fill();

    // Splatter droplets
    bctx.fillStyle = '#8f0d0d';
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = pxRadius * (0.8 + Math.random() * 1.6);
      const dropR = pxRadius * (0.12 + Math.random() * 0.22);
      bctx.beginPath();
      bctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, dropR, 0, Math.PI * 2);
      bctx.fill();
    }
    bctx.restore();
    bloodTex.needsUpdate = true;
  };

  return {
    id: 'fieldhouse',
    name: 'The Fieldhouse',
    courtBounds: bounds,
    spawnPoints,
    obstacles,
    wallBuys: [
      { weaponId: "kar98k", x: 0, y: 1.6, z: 15.6, rotationY: Math.PI },
      { weaponId: "olympia", x: -12.6, y: 1.6, z: 0, rotationY: Math.PI / 2 },
      { weaponId: "mp40", x: 0, y: 1.6, z: -15.6, rotationY: 0 },
      { weaponId: "stg44", x: 12.6, y: 1.6, z: 0, rotationY: -Math.PI / 2 },
    ],
    mysteryBoxPos: { x: 8.5, z: -2.0, yaw: -Math.PI / 2 },
    packAPunchPos: { x: -8.5, z: 2.0, yaw: Math.PI / 2 },
    group,
    addBloodDecal,
    update: (dt: number, info: JumbotronInfo) => {
      updateJumbo(dt, info);
    },
    dispose: () => {
      courtTex.dispose();
      bloodTex.dispose();
      courtGeo.dispose();
      courtMat.dispose();
      bloodGeo.dispose();
      bloodMat.dispose();
    },
  };
}

// ── Helper: Render Hardwood Court ──────────────────────────────────────────
function renderHardwood(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Base wood background
  ctx.fillStyle = '#22150c';
  ctx.fillRect(0, 0, w, h);

  // Planks
  const plankCount = 64;
  const plankH = h / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const shade = 28 + ((i * 19) % 12);
    ctx.fillStyle = `hsl(26, 45%, ${shade}%)`;
    ctx.fillRect(0, i * plankH, w, plankH);
    ctx.fillStyle = '#140c06';
    ctx.fillRect(0, i * plankH, w, 1);
  }

  // Dark bloodstain weathering on floor
  const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.6);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Coordinate mapper from court space to canvas
  const mx = (x: number): number => ((x + 16) / 32) * w;
  const mz = (z: number): number => ((z + 18) / 36) * h;
  const m = w / 32;

  // Painted Keys (Crimson Red lane)
  ctx.fillStyle = '#5c1010';
  ctx.fillRect(mx(-COURT.laneHalfWidth), mz(-14.325), COURT.laneHalfWidth * 2 * m, COURT.laneDepth * m);
  ctx.fillRect(mx(-COURT.laneHalfWidth), mz(14.325 - COURT.laneDepth), COURT.laneHalfWidth * 2 * m, COURT.laneDepth * m);

  // White Court Boundary Lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.strokeRect(mx(-COURT.halfWidth), mz(-COURT.halfLength), COURT.halfWidth * 2 * m, COURT.length * m);

  // Half-court line
  ctx.beginPath();
  ctx.moveTo(mx(-COURT.halfWidth), mz(0));
  ctx.lineTo(mx(COURT.halfWidth), mz(0));
  ctx.stroke();

  // Center Circle
  ctx.beginPath();
  ctx.arc(mx(0), mz(0), COURT.centerRadius * m, 0, Math.PI * 2);
  ctx.stroke();

  // Center Hazmat / Skull Insignia
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☣ SECTOR 9 ☣', mx(0), mz(0));

  // 3-Point Arcs
  for (const zSign of [-1, 1]) {
    const hoopZ = zSign * 13.1;
    ctx.beginPath();
    ctx.arc(mx(0), mz(hoopZ), COURT.threeRadius * m, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Helper: 3D Basketball Hoops ────────────────────────────────────────────
function createHoopAssemblies(parent: THREE.Group): void {
  const stanchionMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6, metalness: 0.5 });
  const padMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.8 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.3, metalness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#93c5fd',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
  });

  for (const zSign of [-1, 1]) {
    const hoopGroup = new THREE.Group();
    const stanchionZ = zSign * 14.2;
    const boardZ = zSign * COURT.boardZ;

    // Base Protective Pad
    const padGeo = new THREE.BoxGeometry(1.2, 1.8, 1.2);
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.9, stanchionZ);
    hoopGroup.add(pad);

    // Stanchion Steel Post
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 3.8, 12);
    const pole = new THREE.Mesh(poleGeo, stanchionMat);
    pole.position.set(0, 1.9, stanchionZ);
    hoopGroup.add(pole);

    // Cantilever Arm reaching to backboard
    const armGeo = new THREE.BoxGeometry(0.16, 0.16, 1.4);
    const arm = new THREE.Mesh(armGeo, stanchionMat);
    arm.position.set(0, 3.3, (stanchionZ + boardZ) / 2);
    hoopGroup.add(arm);

    // Glass Backboard
    const boardGeo = new THREE.BoxGeometry(COURT.boardW, COURT.boardH, 0.06);
    const board = new THREE.Mesh(boardGeo, glassMat);
    board.position.set(0, COURT.boardY, boardZ);
    hoopGroup.add(board);

    // Backboard Target Square
    const squareGeo = new THREE.BoxGeometry(0.6, 0.45, 0.07);
    const squareMat = new THREE.MeshBasicMaterial({ color: '#ef4444', wireframe: true });
    const square = new THREE.Mesh(squareGeo, squareMat);
    square.position.set(0, COURT.boardY - 0.15, boardZ);
    hoopGroup.add(square);

    // Steel Rim
    const rimGeo = new THREE.TorusGeometry(COURT.rimRadius, 0.025, 8, 24);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, COURT.rimHeight, boardZ - zSign * (COURT.rimRadius + 0.15));
    hoopGroup.add(rim);

    // Net
    const netGeo = new THREE.CylinderGeometry(COURT.rimRadius, COURT.rimRadius * 0.6, 0.45, 12, 1, true);
    const netMat = new THREE.MeshBasicMaterial({ color: '#f8fafc', wireframe: true, transparent: true, opacity: 0.8 });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, COURT.rimHeight - 0.22, boardZ - zSign * (COURT.rimRadius + 0.15));
    // Paint / Key Area Floodlight
    const hoopLight = new THREE.SpotLight('#fef08a', 2.6, 14, Math.PI / 4, 0.4);
    hoopLight.position.set(0, 4.2, stanchionZ);
    hoopLight.target.position.set(0, 0, boardZ - zSign * 2.5);
    hoopGroup.add(hoopLight);
    hoopGroup.add(hoopLight.target);

    parent.add(hoopGroup);
  }
}

// ── Helper: Bleachers & Stadium Tiered Stands ───────────────────────────────
function createBleachers(parent: THREE.Group, bounds: ZombieMap['courtBounds']): void {
  const standMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });
  const railMat = new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.5, metalness: 0.7 });

  const tiers = 6;
  const tierW = 0.9;
  const tierH = 0.5;

  // Sideline bleachers (East & West)
  for (const side of [-1, 1]) {
    const xBase = side * (bounds.maxX + 0.5);
    for (let t = 0; t < tiers; t++) {
      const stepGeo = new THREE.BoxGeometry(tierW, (t + 1) * tierH, bounds.maxZ * 2 + 2);
      const step = new THREE.Mesh(stepGeo, standMat);
      step.position.set(xBase + side * t * tierW, ((t + 1) * tierH) / 2, 0);
      parent.add(step);
    }
  }

  // Baseline bleachers (North & South)
  for (const end of [-1, 1]) {
    const zBase = end * (bounds.maxZ + 0.5);
    for (let t = 0; t < tiers; t++) {
      const stepGeo = new THREE.BoxGeometry(bounds.maxX * 2 + 2, (t + 1) * tierH, tierW);
      const step = new THREE.Mesh(stepGeo, standMat);
      step.position.set(0, ((t + 1) * tierH) / 2, zBase + end * t * tierW);
      parent.add(step);
    }
  }

  // Safety railings around court perimeter
  for (const side of [-1, 1]) {
    const railGeo = new THREE.BoxGeometry(0.08, 0.9, bounds.maxZ * 2);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(side * bounds.maxX, 0.45, 0);
    parent.add(rail);
  }
}

// ── Helper: 4 Corner Zombie Spawn Tunnels ──────────────────────────────────
function createSpawnTunnels(parent: THREE.Group): void {
  const concreteMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.95 });
  const hazardMat = new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.7 });
  const redLampMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

  const tunnelPositions = [
    { x: -13.0, z: -15.0, ry: Math.PI / 4 },
    { x: 13.0, z: -15.0, ry: -Math.PI / 4 },
    { x: -13.0, z: 15.0, ry: (3 * Math.PI) / 4 },
    { x: 13.0, z: 15.0, ry: -(3 * Math.PI) / 4 },
  ];

  tunnelPositions.forEach(tp => {
    const tg = new THREE.Group();
    tg.position.set(tp.x, 0, tp.z);
    tg.rotation.y = tp.ry;

    // Arch Frame
    const archGeo = new THREE.BoxGeometry(2.4, 2.8, 1.2);
    const arch = new THREE.Mesh(archGeo, concreteMat);
    arch.position.y = 1.4;
    tg.add(arch);

    // Hazard Stripes Barrier
    const stripeGeo = new THREE.BoxGeometry(2.2, 0.3, 1.22);
    const stripe = new THREE.Mesh(stripeGeo, hazardMat);
    stripe.position.y = 0.3;
    tg.add(stripe);

    // Ominous Emergency Red Beacon Lamp
    const lampGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const lamp = new THREE.Mesh(lampGeo, redLampMat);
    lamp.position.set(0, 2.7, 0.6);
    tg.add(lamp);

    const redLight = new THREE.PointLight('#ef4444', 1.8, 6);
    redLight.position.set(0, 2.7, 0.7);
    tg.add(redLight);

    parent.add(tg);
  });
}

// ── Helper: Overhead Trusses ───────────────────────────────────────────────
function createLightTrusses(parent: THREE.Group): void {
  const trussMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5, metalness: 0.8 });
  const beamGeo = new THREE.BoxGeometry(28, 0.6, 0.6);

  for (const z of [-8, 8]) {
    const beam = new THREE.Mesh(beamGeo, trussMat);
    beam.position.set(0, 11, z);
    parent.add(beam);

    // Hanging lamps & functional stadium floodlights
    for (let x = -10; x <= 10; x += 5) {
      const lampGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.3, 8);
      const lamp = new THREE.Mesh(lampGeo, trussMat);
      lamp.position.set(x, 10.6, z);
      parent.add(lamp);

      const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: '#fef08a' }));
      bulb.position.set(x, 10.4, z);
      parent.add(bulb);
    }

    // 3 High-power stadium spotlights per truss shining down onto the court
    [-7.5, 0, 7.5].forEach(x => {
      const flood = new THREE.SpotLight('#fffbeb', 3.0, 26, Math.PI / 4, 0.5, 0.8);
      flood.position.set(x, 10.2, z);
      flood.target.position.set(x, 0, z * 0.4);
      parent.add(flood);
      parent.add(flood.target);
    });
  }
}

// ── Helper: Dynamic 4-Panel Jumbotron ──────────────────────────────────────
function createJumbotron(): {
  jumboGroup: THREE.Group;
  updateJumbo: (dt: number, info: JumbotronInfo) => void;
} {
  const jumboGroup = new THREE.Group();
  jumboGroup.position.set(0, 8.5, 0);

  // Center Court Jumbotron Spotlight
  const jumboLight = new THREE.SpotLight('#67e8f9', 2.8, 20, Math.PI / 3, 0.4, 0.8);
  jumboLight.position.set(0, -1.0, 0);
  jumboLight.target.position.set(0, -8.5, 0);
  jumboGroup.add(jumboLight);
  jumboGroup.add(jumboLight.target);

  // Center housing body
  const bodyGeo = new THREE.CylinderGeometry(2.4, 2.1, 2.0, 4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.7, metalness: 0.5 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.y = Math.PI / 4;
  jumboGroup.add(body);

  // Dynamic Canvas Texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d')!;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex });

  // 4 Display Panels on each side
  const panelW = 2.8;
  const panelH = 1.6;
  const panelDist = 1.5;
  const panelGeo = new THREE.PlaneGeometry(panelW, panelH);

  for (let i = 0; i < 4; i++) {
    const panel = new THREE.Mesh(panelGeo, screenMat);
    const angle = (i * Math.PI) / 2;
    panel.position.set(Math.sin(angle) * panelDist, 0, Math.cos(angle) * panelDist);
    panel.rotation.y = angle;
    jumboGroup.add(panel);
  }

  let repaintTimer = 0;

  const paintScreen = (info: JumbotronInfo): void => {
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 512, 288);

    // Glowing border
    ctx.strokeStyle = info.bossActive ? '#ef4444' : info.extractionActive ? '#22c55e' : '#3b82f6';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 280);

    // Top Header
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('☣ FIELDHOUSE SURVIVAL ☣', 256, 36);

    // Round Indicator
    ctx.fillStyle = info.bossActive ? '#f87171' : '#f59e0b';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(`ROUND ${info.round}`, 256, 92);

    // Zombies Count & Score
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`HOSTILES: ${info.zombiesAlive} / ${info.totalZombies}`, 256, 138);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`POINTS: ${info.score}`, 256, 178);

    // Bottom Banner / Boss Bar
    if (info.bossActive) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(36, 212, 440, 28);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(38, 214, Math.max(0, 436 * info.bossHpRatio), 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`APEX GOLIATH: ${Math.round(info.bossHpRatio * 100)}%`, 256, 232);
    } else if (info.extractionActive) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`🚁 EXTRACTION LZ: ${Math.ceil(info.extractionTimeLeft)}s`, 256, 232);
    } else {
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(info.banner, 256, 232);
    }

    tex.needsUpdate = true;
  };

  return {
    jumboGroup,
    updateJumbo: (dt: number, info: JumbotronInfo) => {
      jumboGroup.rotation.y += dt * 0.15;
      repaintTimer += dt;
      if (repaintTimer >= 0.1) {
        repaintTimer = 0;
        paintScreen(info);
      }
    },
  };
}
