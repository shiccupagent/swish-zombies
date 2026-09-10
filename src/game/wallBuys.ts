import * as THREE from 'three';
import { WEAPON_REGISTRY, type WeaponDef } from './weapons.ts';

export interface WallBuyLocation {
  weaponId: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export interface WallBuyEntity {
  weapon: WeaponDef;
  x: number;
  y: number;
  z: number;
  group: THREE.Group;
  promptText: string;
}

export class WallBuyManager {
  wallBuys: WallBuyEntity[] = [];
  group: THREE.Group = new THREE.Group();

  constructor(locations: WallBuyLocation[] = []) {
    (locations || []).forEach(loc => {
      const weapon = WEAPON_REGISTRY[loc.weaponId];
      if (!weapon) return;

      const g = new THREE.Group();
      g.position.set(loc.x, loc.y, loc.z);
      g.rotation.y = loc.rotationY;

      // 3D Chalk Weapon Outline Box
      const chalkMat = new THREE.MeshBasicMaterial({ color: '#fef08a', wireframe: true });
      const chalkMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.08), chalkMat);
      g.add(chalkMesh);

      // Weapon replica model on wall
      const gunModel = weapon.createMesh(false);
      gunModel.position.set(0, 0, 0.06);
      g.add(gunModel);

      // Soft chalk light
      const chalkLight = new THREE.PointLight('#fef08a', 0.8, 3.5);
      chalkLight.position.set(0, 0, 0.4);
      g.add(chalkLight);

      this.group.add(g);

      this.wallBuys.push({
        weapon,
        x: loc.x,
        y: loc.y,
        z: loc.z,
        group: g,
        promptText: `[E] BUY ${weapon.name.toUpperCase()} [${weapon.wallBuyCost} PTS]`,
      });
    });
  }

  getNearbyWallBuy(playerX: number, playerZ: number, maxDist: number = 2.4): WallBuyEntity | null {
    for (const wb of this.wallBuys) {
      const dist = Math.hypot(wb.x - playerX, wb.z - playerZ);
      if (dist <= maxDist) {
        return wb;
      }
    }
    return null;
  }
}
