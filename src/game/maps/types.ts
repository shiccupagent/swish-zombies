import * as THREE from 'three';
import type { WallBuyLocation } from '../wallBuys.ts';

export interface JumbotronInfo {
  round: number;
  zombiesAlive: number;
  totalZombies: number;
  score: number;
  bossActive: boolean;
  bossHpRatio: number;
  bossName?: string;
  banner: string;
  extractionActive: boolean;
  extractionTimeLeft: number;
}

export interface MapObstacle {
  x: number;
  z: number;
  radius: number;
  height: number;
  isCover?: boolean;
}

export interface ZombieMap {
  id: string;
  name: string;
  desc?: string;
  courtBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  spawnPoints: Array<{ x: number; y: number; z: number; name: string }>;
  obstacles: MapObstacle[];
  wallBuys: WallBuyLocation[];
  mysteryBoxPos: { x: number; z: number; yaw?: number };
  packAPunchPos: { x: number; z: number; yaw?: number };
  ambientColor?: string;
  fogColor?: string;
  group: THREE.Group;
  addBloodDecal(worldX: number, worldZ: number, radius: number): void;
  update(dt: number, info: JumbotronInfo): void;
  dispose(): void;
}
