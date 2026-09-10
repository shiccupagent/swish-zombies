import * as THREE from 'three';
import {
  createM1911Mesh,
  createOlympiaMesh,
  createMp40Mesh,
  createStg44Mesh,
  createKar98kMesh,
  createRayGunMesh,
} from '../render/weaponModels.ts';
import type { AudioSynth } from '../audio/synth.ts';

export type WeaponType = 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'sniper' | 'wonder';

export interface WeaponDef {
  id: string;
  name: string;
  papName: string;
  type: WeaponType;
  wallBuyCost: number;
  ammoCost: number;
  damage: number;
  papDamage: number;
  pellets: number;
  spread: number;
  fireRate: number; // seconds between shots
  isAutomatic: boolean;
  magSize: number;
  papMagSize: number;
  reserveMax: number;
  penetration: number;
  isExplosive?: boolean;
  explosionRadius?: number;
  projectileColor: string;
  papProjectileColor: string;
  projectileSpeed: number;
  createMesh: (isPap?: boolean) => THREE.Group;
  soundShot: (audio: AudioSynth, isPap?: boolean) => void;
  soundReload: (audio: AudioSynth) => void;
}

export const WEAPON_REGISTRY: Record<string, WeaponDef> = {
  m1911: {
    id: 'm1911',
    name: 'Colt M1911',
    papName: 'Mustang & Sally',
    type: 'pistol',
    wallBuyCost: 0, // Starting weapon
    ammoCost: 250,
    damage: 28,
    papDamage: 180,
    pellets: 1,
    spread: 0.02,
    fireRate: 0.2,
    isAutomatic: false,
    magSize: 8,
    papMagSize: 16,
    reserveMax: 80,
    penetration: 1,
    isExplosive: false,
    projectileColor: '#fef08a',
    papProjectileColor: '#38bdf8',
    projectileSpeed: 55,
    createMesh: createM1911Mesh,
    soundShot: (audio, isPap) => {
      if (isPap) audio.playExplosion();
      else audio.playPistolShot();
    },
    soundReload: (audio) => audio.playMagInsert(),
  },

  olympia: {
    id: 'olympia',
    name: 'Olympia Over-Under',
    papName: 'Hades Incendiary',
    type: 'shotgun',
    wallBuyCost: 500,
    ammoCost: 250,
    damage: 30, // per pellet
    papDamage: 48,
    pellets: 12,
    spread: 0.09,
    fireRate: 0.35,
    isAutomatic: false,
    magSize: 2,
    papMagSize: 4,
    reserveMax: 38,
    penetration: 1,
    projectileColor: '#f97316',
    papProjectileColor: '#ef4444',
    projectileSpeed: 48,
    createMesh: createOlympiaMesh,
    soundShot: (audio, isPap) => audio.playShot(isPap),
    soundReload: (audio) => audio.playShellLoad(),
  },

  mp40: {
    id: 'mp40',
    name: 'MP40 Submachine Gun',
    papName: 'The Afterburner',
    type: 'smg',
    wallBuyCost: 1000,
    ammoCost: 500,
    damage: 42,
    papDamage: 85,
    pellets: 1,
    spread: 0.035,
    fireRate: 0.11,
    isAutomatic: true,
    magSize: 32,
    papMagSize: 64,
    reserveMax: 192,
    penetration: 2,
    projectileColor: '#fef08a',
    papProjectileColor: '#c084fc',
    projectileSpeed: 60,
    createMesh: createMp40Mesh,
    soundShot: (audio) => audio.playSmgShot(),
    soundReload: (audio) => audio.playMagInsert(),
  },

  stg44: {
    id: 'stg44',
    name: 'STG-44 Assault Rifle',
    papName: 'Spatz-447',
    type: 'rifle',
    wallBuyCost: 1500,
    ammoCost: 750,
    damage: 58,
    papDamage: 125,
    pellets: 1,
    spread: 0.025,
    fireRate: 0.13,
    isAutomatic: true,
    magSize: 30,
    papMagSize: 60,
    reserveMax: 180,
    penetration: 3,
    projectileColor: '#fef08a',
    papProjectileColor: '#facc15',
    projectileSpeed: 65,
    createMesh: createStg44Mesh,
    soundShot: (audio) => audio.playRifleShot(),
    soundReload: (audio) => audio.playMagInsert(),
  },

  kar98k: {
    id: 'kar98k',
    name: 'Kar98k Bolt-Action',
    papName: 'Armageddon Line-Piercer',
    type: 'sniper',
    wallBuyCost: 200,
    ammoCost: 100,
    damage: 180,
    papDamage: 550,
    pellets: 1,
    spread: 0.008,
    fireRate: 0.85,
    isAutomatic: false,
    magSize: 5,
    papMagSize: 10,
    reserveMax: 50,
    penetration: 5, // Pierces 5 zombies in a straight line!
    projectileColor: '#f8fafc',
    papProjectileColor: '#60a5fa',
    projectileSpeed: 85,
    createMesh: createKar98kMesh,
    soundShot: (audio) => audio.playSniperShot(),
    soundReload: (audio) => audio.playShellLoad(),
  },

  ray_gun: {
    id: 'ray_gun',
    name: 'Ray Gun',
    papName: "Porter's X2 Ray Gun",
    type: 'wonder',
    wallBuyCost: 0, // Mystery Box only!
    ammoCost: 2500,
    damage: 220,
    papDamage: 480,
    pellets: 1,
    spread: 0.015,
    fireRate: 0.22,
    isAutomatic: true,
    magSize: 20,
    papMagSize: 40,
    reserveMax: 160,
    penetration: 1,
    isExplosive: true,
    explosionRadius: 3.2,
    projectileColor: '#22c55e',
    papProjectileColor: '#ff0055',
    projectileSpeed: 42,
    createMesh: createRayGunMesh,
    soundShot: (audio) => audio.playRayGunShot(),
    soundReload: (audio) => audio.playEmpty(),
  },
};
