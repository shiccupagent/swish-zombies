import * as THREE from 'three';

export function createM1911Mesh(isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  const slideMat = new THREE.MeshStandardMaterial({
    color: isPap ? '#38bdf8' : '#334155',
    roughness: isPap ? 0.2 : 0.4,
    metalness: 0.85,
    emissive: isPap ? '#0284c7' : '#000000',
    emissiveIntensity: isPap ? 0.5 : 0,
  });
  const gripMat = new THREE.MeshStandardMaterial({ color: isPap ? '#0f172a' : '#78350f', roughness: 0.7 });

  // Slide
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.28), slideMat);
  slide.position.set(0, 0.04, 0.06);
  group.add(slide);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), slideMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, 0.22);
  group.add(barrel);

  // Frame & Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.08), gripMat);
  grip.position.set(0, -0.07, -0.04);
  grip.rotation.x = 0.25;
  group.add(grip);

  // Trigger Guard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.06), slideMat);
  guard.position.set(0, -0.02, 0.06);
  group.add(guard);

  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

export function createOlympiaMesh(isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  const barrelMat = new THREE.MeshStandardMaterial({
    color: isPap ? '#f97316' : '#1e293b',
    roughness: 0.3,
    metalness: 0.85,
    emissive: isPap ? '#ea580c' : '#000000',
    emissiveIntensity: isPap ? 0.6 : 0,
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: isPap ? '#18181b' : '#78350f', roughness: 0.6 });

  // Over-and-under double barrels
  for (const by of [0.02, -0.02]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, by, 0.35);
    group.add(barrel);
  }

  // Wooden Forend
  const forend = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.25), woodMat);
  forend.position.set(0, -0.01, 0.2);
  group.add(forend);

  // Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.16), barrelMat);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // Buttstock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.15, 0.35), woodMat);
  stock.position.set(0, -0.04, -0.22);
  stock.rotation.x = -0.15;
  group.add(stock);

  group.scale.set(1.1, 1.1, 1.1);
  return group;
}

export function createMp40Mesh(isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: isPap ? '#a855f7' : '#334155',
    roughness: 0.4,
    metalness: 0.8,
    emissive: isPap ? '#9333ea' : '#000000',
    emissiveIntensity: isPap ? 0.5 : 0,
  });
  const gripMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.8 });

  // Cylindrical Receiver
  const receiver = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), metalMat);
  receiver.rotation.x = Math.PI / 2;
  receiver.position.set(0, 0.03, 0.08);
  group.add(receiver);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 8), metalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03, 0.42);
  group.add(barrel);

  // Front Hooded Sight
  const sight = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 4, 8), metalMat);
  sight.position.set(0, 0.06, 0.55);
  group.add(sight);

  // Vertical/Angled 32-round Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.05), metalMat);
  mag.position.set(0, -0.12, 0.15);
  mag.rotation.x = 0.15;
  group.add(mag);

  // Pistol Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.07), gripMat);
  grip.position.set(0, -0.08, -0.06);
  grip.rotation.x = 0.3;
  group.add(grip);

  // Underfolding Steel Wire Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.32), metalMat);
  stock.position.set(0, -0.02, -0.24);
  group.add(stock);

  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

export function createStg44Mesh(isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: isPap ? '#fbbf24' : '#1e293b',
    roughness: 0.35,
    metalness: 0.85,
    emissive: isPap ? '#d97706' : '#000000',
    emissiveIntensity: isPap ? 0.6 : 0,
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: isPap ? '#451a03' : '#78350f', roughness: 0.6 });

  // Stamped Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.45), steelMat);
  body.position.set(0, 0.04, 0.08);
  group.add(body);

  // Barrel & Gas Tube
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), steelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.05, 0.48);
  group.add(barrel);

  const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8), steelMat);
  gasTube.rotation.x = Math.PI / 2;
  gasTube.position.set(0, 0.09, 0.38);
  group.add(gasTube);

  // Curved 30-round Banana Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.08), steelMat);
  mag.position.set(0, -0.12, 0.16);
  mag.rotation.x = 0.35;
  group.add(mag);

  // Wooden Buttstock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.14, 0.32), woodMat);
  stock.position.set(0, -0.01, -0.26);
  stock.rotation.x = -0.1;
  group.add(stock);

  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

export function createKar98kMesh(isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: isPap ? '#60a5fa' : '#334155',
    roughness: 0.3,
    metalness: 0.85,
    emissive: isPap ? '#2563eb' : '#000000',
    emissiveIntensity: isPap ? 0.5 : 0,
  });
  const woodMat = new THREE.MeshStandardMaterial({ color: isPap ? '#1e1b4b' : '#92400e', roughness: 0.6 });

  // Full-length Wooden Stock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.85), woodMat);
  stock.position.set(0, 0, 0.05);
  group.add(stock);

  // Long Steel Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.68, 8), metalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, 0.55);
  group.add(barrel);

  // Bolt Handle (curved downwards)
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 6), metalMat);
  bolt.rotation.z = Math.PI / 2.5;
  bolt.position.set(0.05, 0.05, -0.05);
  group.add(bolt);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), metalMat);
  knob.position.set(0.09, 0.03, -0.05);
  group.add(knob);

  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

export function createRayGunMesh(isPap: boolean = false): THREE.Group {
  const group = new THREE.Group();
  const bodyColor = isPap ? '#b91c1c' : '#dc2626';
  const glowColor = isPap ? '#ff0055' : '#22c55e';

  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.6 });
  const trimMat = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.3, metalness: 0.9 });
  const glowMat = new THREE.MeshBasicMaterial({ color: glowColor });

  // Bulbous Main Receiver
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bodyMat);
  bulb.scale.set(0.9, 1.2, 1.4);
  bulb.position.set(0, 0.04, 0);
  group.add(bulb);

  // Gauge Meter on Top
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), trimMat);
  gauge.position.set(0, 0.16, -0.02);
  group.add(gauge);

  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), glowMat);
  dial.rotation.x = -Math.PI / 2;
  dial.position.set(0, 0.176, -0.02);
  group.add(dial);

  // Dual Forward Emitter Prongs
  for (const px of [-0.07, 0.07]) {
    const prong = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.38), trimMat);
    prong.position.set(px, 0.04, 0.28);
    group.add(prong);

    const prongTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), glowMat);
    prongTip.position.set(px, 0.04, 0.47);
    group.add(prongTip);
  }

  // Central Glowing Plasma Core
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), glowMat);
  core.position.set(0, 0.04, 0.3);
  group.add(core);

  // Angled Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.07), new THREE.MeshStandardMaterial({ color: '#1e293b' }));
  grip.position.set(0, -0.09, -0.08);
  grip.rotation.x = 0.35;
  group.add(grip);

  // Core Light
  const light = new THREE.PointLight(glowColor, 1.8, 3);
  light.position.set(0, 0.04, 0.3);
  group.add(light);

  group.scale.set(1.2, 1.2, 1.2);
  return group;
}
