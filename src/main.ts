import * as THREE from 'three';
import type { ZombieMap } from './game/maps/types.ts';
import { createFieldhouseMap } from './game/maps/fieldhouse.ts';
import { createNachtMap } from './game/maps/nacht.ts';
import { createTownMap } from './game/maps/town.ts';
import { createCustomMapFromJson, SAMPLE_MODDED_MAP } from './game/maps/customLoader.ts';

import { createPlayerMesh, type PlayerCharacter } from './render/characters.ts';
import { CombatSystem } from './game/combat.ts';
import { HordeDirector } from './game/director.ts';
import { AudioSynth } from './audio/synth.ts';
import { InputManager } from './input/input.ts';
import { HudManager, type WeaponSlotState } from './ui/hud.ts';
import { createSentryTurret, createClaymore, createBarbedWire, type DeployableEntity } from './game/deployables.ts';
import { PERK_POOL, type PerkItem } from './game/items.ts';
import { WEAPON_REGISTRY, type WeaponDef } from './game/weapons.ts';
import { WallBuyManager } from './game/wallBuys.ts';
import { MysteryBoxManager } from './game/mysteryBox.ts';
import { PackAPunchManager } from './game/packAPunch.ts';

interface PlayerWeaponState {
  def: WeaponDef;
  ammo: number;
  reserve: number;
  isPap: boolean;
}

interface PlayerState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  weapons: PlayerWeaponState[];
  activeWeaponIdx: number;
  isReloading: boolean;
  reloadT: number;
  fireCooldown: number;
  recoilT: number;
  isRolling: boolean;
  rollT: number;
  rollDirX: number;
  rollDirZ: number;
  isMeleeing: boolean;
  meleeT: number;
  meleeCooldown: number;
  score: number;
  kills: number;
  headshots: number;
  // Perks
  ukuleleCount: number;
  behemothCount: number;
  gasolineCount: number;
  bulletDamageMult: number;
  knockbackMult: number;
  reloadSpeedMult: number;
  moveSpeedMult: number;
  rollCostMult: number;
  vampireMelee: boolean;
  pelletBonus: number;
  // Deployables
  activeDeployableType: 'sentry' | 'claymore' | 'wire';
  deployables: {
    sentry: number;
    claymore: number;
    wire: number;
  };
}

async function boot(): Promise<void> {
  const canvas = document.getElementById('court') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui-root') as HTMLElement;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#05070a', 0.014);

  // Balanced ambient & sky hemisphere lighting
  const hemiLight = new THREE.HemisphereLight('#67e8f9', '#1e293b', 0.85);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight('#1e293b', 0.6);
  scene.add(ambientLight);

  // Key directional light (cool white)
  const keyLight = new THREE.DirectionalLight('#f8fafc', 1.2);
  keyLight.position.set(6, 16, 10);
  scene.add(keyLight);

  // Rim / Fill directional light (tactical cyan accent from behind)
  const rimLight = new THREE.DirectionalLight('#38bdf8', 0.75);
  rimLight.position.set(-8, 14, -10);
  scene.add(rimLight);

  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 150);
  const camPos = new THREE.Vector3(0, 8.5, 9.5);
  const camTarget = new THREE.Vector3(0, 0.9, 0);
  camera.position.copy(camPos);
  camera.lookAt(camTarget);

  const audio = new AudioSynth();
  const hud = new HudManager(uiRoot);
  const input = new InputManager(canvas);

  // Map management
  const availableMaps = [
    { id: 'fieldhouse', name: 'The Fieldhouse', desc: 'Metro Basketball Arena with Jumbotron & Defensive Hoops' },
    { id: 'nacht', name: 'Nacht der Untoten', desc: 'Classic Abandoned Concrete Bunker & Aerodrome' },
    { id: 'town', name: 'Town Outskirts', desc: 'Post-apocalyptic Asphalt Ruins with Lava Fissures & Police Car' },
  ];
  let selectedMapId = 'fieldhouse';
  let currentMap: ZombieMap = createFieldhouseMap();
  scene.add(currentMap.group);

  const combat = new CombatSystem(scene);
  const playerMesh: PlayerCharacter = createPlayerMesh();
  scene.add(playerMesh.group);

  let director = new HordeDirector(scene, currentMap, audio, combat);
  director.zombies.forEach(z => scene.remove(z.char.group));
  director.zombies = [];
  director.zombiesToSpawn = 0;

  let wallBuyManager = new WallBuyManager(currentMap.wallBuys);
  scene.add(wallBuyManager.group);

  let mysteryBox = new MysteryBoxManager(currentMap.mysteryBoxPos.x, currentMap.mysteryBoxPos.z, currentMap.mysteryBoxPos.yaw);
  scene.add(mysteryBox.group);

  let packAPunch = new PackAPunchManager(currentMap.packAPunchPos.x, currentMap.packAPunchPos.z, currentMap.packAPunchPos.yaw);
  scene.add(packAPunch.group);

  const deployablesList: DeployableEntity[] = [];

  // Starting Player State (Colt M1911)
  const state: PlayerState = {
    x: 0,
    z: 2.0,
    vx: 0,
    vz: 0,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    weapons: [
      {
        def: WEAPON_REGISTRY['m1911']!,
        ammo: 8,
        reserve: 40,
        isPap: false,
      },
    ],
    activeWeaponIdx: 0,
    isReloading: false,
    reloadT: 0,
    fireCooldown: 0,
    recoilT: 0,
    isRolling: false,
    rollT: 0,
    rollDirX: 0,
    rollDirZ: 1,
    isMeleeing: false,
    meleeT: 0,
    meleeCooldown: 0,
    score: 500,
    kills: 0,
    headshots: 0,
    ukuleleCount: 0,
    behemothCount: 0,
    gasolineCount: 0,
    bulletDamageMult: 1.0,
    knockbackMult: 1.0,
    reloadSpeedMult: 1.0,
    moveSpeedMult: 1.0,
    rollCostMult: 1.0,
    vampireMelee: false,
    pelletBonus: 0,
    activeDeployableType: 'sentry',
    deployables: {
      sentry: 2,
      claymore: 3,
      wire: 2,
    },
  };

  // Mount initial starting weapon model (M1911)
  playerMesh.setWeapon(state.weapons[0]!.def.createMesh, false);

  const switchMap = (target: ZombieMap | string): void => {
    let newMap: ZombieMap;
    if (typeof target === 'string') {
      if (target === 'fieldhouse') newMap = createFieldhouseMap();
      else if (target === 'nacht') newMap = createNachtMap();
      else if (target === 'town') newMap = createTownMap();
      else return;
    } else {
      newMap = target;
    }
    selectedMapId = newMap.id;

    scene.remove(currentMap.group);
    currentMap.dispose();

    scene.remove(wallBuyManager.group);
    scene.remove(mysteryBox.group);
    scene.remove(packAPunch.group);

    currentMap = newMap;
    scene.add(currentMap.group);

    wallBuyManager = new WallBuyManager(currentMap.wallBuys || []);
    scene.add(wallBuyManager.group);

    if (currentMap.mysteryBoxPos) {
      mysteryBox = new MysteryBoxManager(currentMap.mysteryBoxPos.x, currentMap.mysteryBoxPos.z, currentMap.mysteryBoxPos.yaw);
      scene.add(mysteryBox.group);
    }

    if (currentMap.packAPunchPos) {
      packAPunch = new PackAPunchManager(currentMap.packAPunchPos.x, currentMap.packAPunchPos.z, currentMap.packAPunchPos.yaw);
      scene.add(packAPunch.group);
    }

    director.map = currentMap;
  };

  let gameStarted = false;

  const renderStartScreen = (): void => {
    hud.showStartScreen(
      availableMaps,
      selectedMapId,
      (mId) => {
        selectedMapId = mId;
        if (mId === 'fieldhouse') switchMap(createFieldhouseMap());
        else if (mId === 'nacht') switchMap(createNachtMap());
        else if (mId === 'town') switchMap(createTownMap());
        renderStartScreen();
      },
      (customData) => {
        const customMap = createCustomMapFromJson(customData);
        availableMaps.push({ id: customMap.id, name: customMap.name, desc: customMap.desc || 'Custom Map' });
        selectedMapId = customMap.id;
        switchMap(customMap);
        renderStartScreen();
      },
      () => {
        audio.init();
        gameStarted = true;
        director.startRound(1);
      }
    );
  };

  renderStartScreen();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Round Intermission Upgrade Handler ───────────────────────────────────
  let upgradeActive = false;
  const onRoundDone = (_round: number): void => {
    upgradeActive = true;
    const shuffled = [...PERK_POOL].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 3);
    hud.showUpgradeModal(options, (selectedPerk: PerkItem) => {
      selectedPerk.apply(state);
      audio.playPickup();
      hud.addFloatingText(`PERK EQUIPPED: ${selectedPerk.name}`, window.innerWidth / 2, window.innerHeight / 2, '#38bdf8');
      upgradeActive = false;
    });
  };

  // ── Main Game Loop ───────────────────────────────────────────────────────
  let lastTime = performance.now();
  let orbitAngle = 0;

  function animate(now: number): void {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;

    if (!gameStarted) {
      orbitAngle += dt * 0.2;
      camera.position.x = Math.sin(orbitAngle) * 11;
      camera.position.z = Math.cos(orbitAngle) * 11;
      camera.position.y = 7.5;
      camera.lookAt(0, 1.2, 0);

      currentMap.update(dt, {
        round: 1,
        zombiesAlive: 0,
        totalZombies: 10,
        score: 500,
        bossActive: false,
        bossHpRatio: 0,
        banner: 'CHOOSE MAP & SURVIVE',
        extractionActive: false,
        extractionTimeLeft: 0,
      });

      mysteryBox.update(dt);
      renderer.render(scene, camera);
      return;
    }

    if (upgradeActive) {
      renderer.render(scene, camera);
      return;
    }

    const inState = input.sample(camera);

    // 1. Player Aiming
    playerMesh.setAim(inState.aimX, inState.aimZ);

    if (inState.toggleFlashlight) {
      playerMesh.toggleFlashlight();
      audio.playEmpty();
    }

    // 2. Weapon Slot Switching (Q, 1, 2, Wheel)
    if (inState.swapWeapon) {
      if (state.weapons.length > 1) {
        state.activeWeaponIdx = (state.activeWeaponIdx + 1) % state.weapons.length;
        const curW = state.weapons[state.activeWeaponIdx]!;
        playerMesh.setWeapon(curW.def.createMesh, curW.isPap);
        state.isReloading = false;
        state.fireCooldown = 0.2;
        audio.playMagInsert();
      }
    } else if (inState.selectWeaponSlot !== null && state.weapons[inState.selectWeaponSlot]) {
      if (state.activeWeaponIdx !== inState.selectWeaponSlot) {
        state.activeWeaponIdx = inState.selectWeaponSlot;
        const curW = state.weapons[state.activeWeaponIdx]!;
        playerMesh.setWeapon(curW.def.createMesh, curW.isPap);
        state.isReloading = false;
        state.fireCooldown = 0.2;
        audio.playMagInsert();
      }
    }

    const activeGun = state.weapons[state.activeWeaponIdx]!;

    // 3. Cooldowns & Stamina Regen
    state.fireCooldown = Math.max(0, state.fireCooldown - dt);
    state.recoilT = Math.max(0, state.recoilT - dt * 6);
    state.meleeCooldown = Math.max(0, state.meleeCooldown - dt);
    if (!state.isRolling) {
      state.stamina = Math.min(state.maxStamina, state.stamina + 28 * dt);
    }

    // 4. Dodge Roll
    if (inState.isRolling && !state.isRolling && state.stamina >= 25 * state.rollCostMult) {
      state.isRolling = true;
      state.rollT = 0.35;
      state.stamina -= 25 * state.rollCostMult;
      if (inState.moveX !== 0 || inState.moveZ !== 0) {
        state.rollDirX = inState.moveX;
        state.rollDirZ = inState.moveZ;
      } else {
        const angle = playerMesh.group.rotation.y;
        state.rollDirX = Math.sin(angle);
        state.rollDirZ = Math.cos(angle);
      }
    }

    if (state.isRolling) {
      state.rollT -= dt;
      const rollSpeed = 11.0;
      state.vx = state.rollDirX * rollSpeed;
      state.vz = state.rollDirZ * rollSpeed;
      if (state.rollT <= 0) {
        state.isRolling = false;
      }
    } else if (state.isMeleeing) {
      state.meleeT -= dt;
      state.vx = 0;
      state.vz = 0;
      if (state.meleeT <= 0) {
        state.isMeleeing = false;
      }
    } else {
      const baseSpeed = 5.2 * state.moveSpeedMult;
      state.vx = inState.moveX * baseSpeed;
      state.vz = inState.moveZ * baseSpeed;
    }

    // 5. CQC Melee Butt-Strike (F)
    if (inState.isMeleeing && !state.isMeleeing && state.meleeCooldown <= 0) {
      state.isMeleeing = true;
      state.meleeT = 0.3;
      state.meleeCooldown = 0.85;
      audio.playMeleeBash();

      const px = state.x;
      const pz = state.z;
      const facing = playerMesh.group.rotation.y;

      let hitZombie = false;
      for (const z of director.zombies) {
        if (z.health <= 0) continue;
        const dx = z.x - px;
        const dz = z.z - pz;
        const dist = Math.hypot(dx, dz);

        if (dist < 2.0) {
          const angle = Math.atan2(dx, dz);
          const diff = Math.abs(angle - facing);
          if (diff < 1.0 || dist < 1.1) {
            hitZombie = true;
            const dmg = 80 + (state.vampireMelee ? 50 : 0);
            z.takeDamage(dmg, false);
            z.knockbackX += Math.sin(facing) * 9 * state.knockbackMult;
            z.knockbackZ += Math.cos(facing) * 9 * state.knockbackMult;

            combat.spawnBloodBurst(z.x, 1.2, z.z, 8);
            hud.addFloatingText('+130 CQC BASH!', window.innerWidth / 2, window.innerHeight / 2 - 40, '#f59e0b');
            state.score += 130;

            if (state.vampireMelee && z.health <= 0) {
              state.health = Math.min(state.maxHealth, state.health + 15);
            }
          }
        }
      }
      if (hitZombie) {
        audio.playPumpAction();
      }
    }

    // 6. Reloading
    const magCapacity = activeGun.isPap ? activeGun.def.papMagSize : activeGun.def.magSize;
    if (inState.isReloading && !state.isReloading && activeGun.ammo < magCapacity && activeGun.reserve > 0) {
      state.isReloading = true;
      state.reloadT = 0;
      activeGun.def.soundReload(audio);
    }

    if (state.isReloading) {
      state.reloadT += dt * state.reloadSpeedMult;
      const reloadDuration = activeGun.def.type === 'shotgun' ? 0.35 : 1.2;
      if (state.reloadT >= reloadDuration) {
        state.reloadT = 0;
        if (activeGun.def.type === 'shotgun') {
          activeGun.ammo++;
          activeGun.reserve--;
          if (activeGun.ammo >= magCapacity || activeGun.reserve <= 0) {
            state.isReloading = false;
            audio.playPumpAction();
          } else {
            activeGun.def.soundReload(audio);
          }
        } else {
          // Full magazine reload
          const needed = magCapacity - activeGun.ammo;
          const inserted = Math.min(needed, activeGun.reserve);
          activeGun.ammo += inserted;
          activeGun.reserve -= inserted;
          state.isReloading = false;
          audio.playMagInsert();
        }
      }
    }

    // 7. Weapon Firing (Primary Fire)
    const canFire = activeGun.def.isAutomatic ? inState.isFiring : inState.justFired;
    if (canFire && state.fireCooldown <= 0 && !state.isRolling && !state.isMeleeing) {
      if (activeGun.ammo > 0) {
        activeGun.ammo--;
        state.fireCooldown = activeGun.def.fireRate;
        state.recoilT = 1.0;
        state.isReloading = false;
        activeGun.def.soundShot(audio, activeGun.isPap);

        const aimDir = new THREE.Vector3(inState.aimX - state.x, 0, inState.aimZ - state.z).normalize();
        const muzzlePos = new THREE.Vector3(state.x + aimDir.x * 0.9, 0.95, state.z + aimDir.z * 0.9);

        combat.fireWeapon(
          muzzlePos,
          aimDir,
          activeGun.def,
          activeGun.isPap,
          state.bulletDamageMult,
          state.pelletBonus
        );
      } else {
        state.fireCooldown = 0.3;
        audio.playEmpty();
        if (activeGun.reserve > 0 && !state.isReloading) {
          state.isReloading = true;
          state.reloadT = 0;
          activeGun.def.soundReload(audio);
        }
      }
    }

    // 8. Interactive Objects: Wall-Buys, Mystery Box, Pack-A-Punch ([E])
    let promptMsg: string | null = null;

    // A. Wall Buys
    const nearWallBuy = wallBuyManager.getNearbyWallBuy(state.x, state.z, 2.3);
    if (nearWallBuy) {
      const alreadyHas = state.weapons.some(w => w.def.id === nearWallBuy.weapon.id);
      if (alreadyHas) {
        promptMsg = `[E] BUY AMMO FOR ${nearWallBuy.weapon.name.toUpperCase()} [${nearWallBuy.weapon.ammoCost} PTS]`;
        if (inState.isInteracting && state.score >= nearWallBuy.weapon.ammoCost) {
          state.score -= nearWallBuy.weapon.ammoCost;
          const found = state.weapons.find(w => w.def.id === nearWallBuy.weapon.id)!;
          found.reserve = found.def.reserveMax;
          audio.playMagInsert();
          hud.addFloatingText('AMMO REFILLED!', window.innerWidth / 2, window.innerHeight / 2, '#38bdf8');
        }
      } else {
        promptMsg = `[E] BUY ${nearWallBuy.weapon.name.toUpperCase()} [${nearWallBuy.weapon.wallBuyCost} PTS]`;
        if (inState.isInteracting && state.score >= nearWallBuy.weapon.wallBuyCost) {
          state.score -= nearWallBuy.weapon.wallBuyCost;
          audio.playMagInsert();
          const newGun: PlayerWeaponState = {
            def: nearWallBuy.weapon,
            ammo: nearWallBuy.weapon.magSize,
            reserve: nearWallBuy.weapon.reserveMax,
            isPap: false,
          };
          if (state.weapons.length < 2) {
            state.weapons.push(newGun);
            state.activeWeaponIdx = state.weapons.length - 1;
          } else {
            state.weapons[state.activeWeaponIdx] = newGun;
          }
          playerMesh.setWeapon(newGun.def.createMesh, false);
          hud.addFloatingText(`PURCHASED ${newGun.def.name}!`, window.innerWidth / 2, window.innerHeight / 2, '#10b981');
        }
      }
    }

    // B. Mystery Box
    const distToBox = Math.hypot(state.x - mysteryBox.x, state.z - mysteryBox.z);
    if (distToBox < 2.5) {
      if (mysteryBox.readyToTake && mysteryBox.selectedWeapon) {
        promptMsg = `[E] TAKE ${mysteryBox.selectedWeapon.name.toUpperCase()}`;
        if (inState.isInteracting) {
          const taken = mysteryBox.takeWeapon();
          if (taken) {
            audio.playPickup();
            const newGun: PlayerWeaponState = {
              def: taken,
              ammo: taken.magSize,
              reserve: taken.reserveMax,
              isPap: false,
            };
            if (state.weapons.length < 2) {
              state.weapons.push(newGun);
              state.activeWeaponIdx = state.weapons.length - 1;
            } else {
              state.weapons[state.activeWeaponIdx] = newGun;
            }
            playerMesh.setWeapon(newGun.def.createMesh, false);
            hud.addFloatingText(`EQUIPPED ${taken.name}!`, window.innerWidth / 2, window.innerHeight / 2, '#facc15');
          }
        }
      } else if (!mysteryBox.isSpinning) {
        promptMsg = `[E] MYSTERY BOX [950 PTS]`;
        if (inState.isInteracting && mysteryBox.canOpen(state.score)) {
          state.score -= 950;
          mysteryBox.startSpin(audio);
        }
      }
    }

    // C. Pack-a-Punch Machine
    const distToPap = Math.hypot(state.x - packAPunch.x, state.z - packAPunch.z);
    if (distToPap < 2.5) {
      if (!activeGun.isPap) {
        promptMsg = `[E] PACK-A-PUNCH ${activeGun.def.name.toUpperCase()} [5,000 PTS]`;
        if (inState.isInteracting && packAPunch.canUpgrade(state.score, activeGun.isPap)) {
          state.score -= 5000;
          packAPunch.startUpgrade(audio);
        }
      } else {
        promptMsg = `ALREADY PACK-A-PUNCHED: ${activeGun.def.papName.toUpperCase()}`;
      }
    }

    hud.setInteractPrompt(promptMsg);

    // Update Mystery Box & Pack-A-Punch
    mysteryBox.update(dt);
    packAPunch.update(dt, () => {
      activeGun.isPap = true;
      activeGun.ammo = activeGun.def.papMagSize;
      activeGun.reserve = activeGun.def.reserveMax;
      playerMesh.setWeapon(activeGun.def.createMesh, true);
      hud.addFloatingText(`PACK-A-PUNCHED: ${activeGun.def.papName}!`, window.innerWidth / 2, window.innerHeight / 2 - 30, '#c084fc');
    });

    // 9. Tactical Deployables (T)
    if (inState.isDeploying) {
      const depType = state.activeDeployableType;
      const count = state.deployables[depType];
      if (count > 0) {
        state.deployables[depType]--;
        audio.playPickup();

        const yaw = playerMesh.group.rotation.y;
        const placeX = state.x + Math.sin(yaw) * 1.2;
        const placeZ = state.z + Math.cos(yaw) * 1.2;

        let dep: DeployableEntity | null = null;
        if (depType === 'sentry') {
          dep = createSentryTurret(placeX, placeZ, yaw);
        } else if (depType === 'claymore') {
          dep = createClaymore(placeX, placeZ, yaw);
        } else if (depType === 'wire') {
          dep = createBarbedWire(placeX, placeZ);
        }

        if (dep) {
          scene.add(dep.group);
          deployablesList.push(dep);
          hud.addFloatingText(`DEPLOYED ${depType.toUpperCase()}`, window.innerWidth / 2, window.innerHeight / 2 - 20, '#eab308');
        }
      } else {
        audio.playEmpty();
      }
    }

    // 10. Movement & Obstacle Collision
    state.x += state.vx * dt;
    state.z += state.vz * dt;

    for (const obs of currentMap.obstacles) {
      const dx = state.x - obs.x;
      const dz = state.z - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = 0.55 + obs.radius;
      if (dist < minDist && dist > 0.001) {
        state.x = obs.x + (dx / dist) * minDist;
        state.z = obs.z + (dz / dist) * minDist;
      }
    }

    state.x = Math.max(currentMap.courtBounds.minX + 0.5, Math.min(currentMap.courtBounds.maxX - 0.5, state.x));
    state.z = Math.max(currentMap.courtBounds.minZ + 0.5, Math.min(currentMap.courtBounds.maxZ - 0.5, state.z));

    playerMesh.group.position.set(state.x, 0, state.z);
    playerMesh.updateAnimation(dt, state.vx, state.vz, state.isRolling, state.isMeleeing, state.recoilT);

    // 11. Update Deployables
    for (let i = deployablesList.length - 1; i >= 0; i--) {
      const dep = deployablesList[i]!;
      dep.update(dt, director.zombies, audio, (ex, ez, radius, dmg) => {
        combat.spawnShockwave(ex, ez, radius);
        for (const z of director.zombies) {
          const dist = Math.hypot(z.x - ex, z.z - ez);
          if (dist <= radius) {
            z.takeDamage(dmg);
            combat.spawnBloodBurst(z.x, 1.2, z.z, 10);
          }
        }
      });

      if (dep.isDead) {
        scene.remove(dep.group);
        dep.dispose();
        deployablesList.splice(i, 1);
      }
    }

    // 12. Update Combat System
    combat.update(dt, director.zombies, (bx, bz, r) => {
      currentMap.addBloodDecal(bx, bz, r);
    });

    // 13. Update Horde Director
    director.update(
      dt,
      { x: state.x, y: 0, z: state.z },
      (damage) => {
        if (!state.isRolling) {
          state.health -= damage;
          hud.addFloatingText(`-${Math.round(damage)}`, window.innerWidth / 2, window.innerHeight / 2 + 30, '#ef4444');
          if (state.health <= 0) {
            hud.showDebriefing(false, { round: director.round, kills: state.kills, headshots: state.headshots, score: state.score }, () => {
              window.location.reload();
            });
          }
        }
      },
      (killedZombie, isCrit) => {
        state.kills++;
        const pts = isCrit ? 100 : 60;
        state.score += pts;
        if (isCrit) state.headshots++;

        hud.addFloatingText(isCrit ? '+100 HEADSHOT!' : '+60 KILL', window.innerWidth / 2, window.innerHeight / 2 - 50, isCrit ? '#ef4444' : '#10b981');

        if (state.gasolineCount > 0 && Math.random() < 0.45) {
          combat.spawnFirePool(killedZombie.x, killedZombie.z);
        }

        if (state.ukuleleCount > 0 && Math.random() < 0.3) {
          audio.playLightningProc();
          let chained = 0;
          for (const other of director.zombies) {
            if (other.id === killedZombie.id || other.health <= 0) continue;
            const d = Math.hypot(other.x - killedZombie.x, other.z - killedZombie.z);
            if (d < 5.5 && chained < 3) {
              chained++;
              combat.spawnLightningArc(new THREE.Vector3(killedZombie.x, 1.2, killedZombie.z), new THREE.Vector3(other.x, 1.2, other.z));
              other.takeDamage(40);
            }
          }
        }
      },
      (completedRound) => {
        onRoundDone(completedRound);
      }
    );

    // Extraction Event Check
    if (director.extractionActive && director.extractionTimer <= 0) {
      director.extractionActive = false;
      hud.showDebriefing(true, { round: director.round, kills: state.kills, headshots: state.headshots, score: state.score }, () => {
        window.location.reload();
      }, () => {
        director.startRound(11);
      });
    }

    // 14. Update Jumbotron
    const bossRatio = director.bossInstance ? Math.max(0, director.bossInstance.health / director.bossInstance.maxHealth) : 0;
    currentMap.update(dt, {
      round: director.round,
      zombiesAlive: director.zombies.length,
      totalZombies: director.totalRoundZombies,
      score: state.score,
      bossActive: director.bossActive && !!director.bossInstance && director.bossInstance.health > 0,
      bossHpRatio: bossRatio,
      banner: director.round === 5 ? '⚠️ APEX GOLIATH DETECTED ⚠️' : 'DEFEND THE PERIMETER',
      extractionActive: director.extractionActive,
      extractionTimeLeft: director.extractionTimer,
    });

    // 15. Update HUD Weapon Slots & Ammo
    const weaponSlotViews: WeaponSlotState[] = state.weapons.map(w => ({
      weapon: w.def,
      ammo: w.ammo,
      reserve: w.reserve,
      isPap: w.isPap,
    }));
    hud.updateWeaponSlots(weaponSlotViews, state.activeWeaponIdx);

    const reloadDuration = activeGun.def.type === 'shotgun' ? 0.35 : 1.2;
    hud.update(
      state.health,
      state.maxHealth,
      state.stamina,
      state.maxStamina,
      activeGun.ammo,
      activeGun.reserve,
      state.isReloading,
      state.reloadT / reloadDuration,
      director.round,
      director.zombies.length,
      director.totalRoundZombies,
      state.score,
      state.activeDeployableType,
      state.deployables[state.activeDeployableType],
      director.bossActive && !!director.bossInstance && director.bossInstance.health > 0,
      bossRatio
    );

    // 16. Camera Tracking
    const targetCamX = state.x * 0.85;
    const targetCamZ = state.z * 0.85 + 8.5;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, dt * 5.0);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, dt * 5.0);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 8.5, dt * 4.0);

    camTarget.set(state.x, 0.9, state.z);
    camera.lookAt(camTarget);

    renderer.render(scene, camera);
  }

  // Verification hook
  (window as any).__game = {
    director,
    state,
    get map() { return currentMap; },
    combat,
    audio,
    hud,
    switchMap,
    giveWeapon: (wId: string) => {
      const def = WEAPON_REGISTRY[wId];
      if (def) {
        state.weapons[state.activeWeaponIdx] = { def, ammo: def.magSize, reserve: def.reserveMax, isPap: false };
        playerMesh.setWeapon(def.createMesh, false);
      }
    },
    givePap: () => {
      state.weapons[state.activeWeaponIdx]!.isPap = true;
      playerMesh.setWeapon(state.weapons[state.activeWeaponIdx]!.def.createMesh, true);
    },
    loadCustomMap: (data: any) => {
      const m = createCustomMapFromJson(data);
      switchMap(m);
    },
    sampleModdedMap: SAMPLE_MODDED_MAP,
  };

  requestAnimationFrame(animate);
}

boot().catch(err => {
  console.error('Fatal boot error in Swish Zombies:', err);
});
