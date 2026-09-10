export interface PerkItem {
  id: string;
  name: string;
  desc: string;
  rarity: 'common' | 'rare' | 'legendary' | 'evolved';
  icon: string;
  apply: (state: any) => void;
}

export const PERK_POOL: PerkItem[] = [
  {
    id: 'ukulele',
    name: 'Tactical Ukulele',
    desc: '25% chance on hit to fire chain lightning across up to 3 nearby zombies for 40 damage.',
    rarity: 'rare',
    icon: '⚡',
    apply: (s) => { s.ukuleleCount = (s.ukuleleCount || 0) + 1; }
  },
  {
    id: 'behemoth',
    name: 'Brilliant Behemoth',
    desc: 'Pellets explode on impact, dealing 30 area-of-effect damage in a 2.5m radius.',
    rarity: 'legendary',
    icon: '💥',
    apply: (s) => { s.behemothCount = (s.behemothCount || 0) + 1; }
  },
  {
    id: 'gasoline',
    name: 'Napalm Gasoline',
    desc: 'Killing a zombie ignites a fire pool on the hardwood court, burning hostiles for 4s.',
    rarity: 'common',
    icon: '🔥',
    apply: (s) => { s.gasolineCount = (s.gasolineCount || 0) + 1; }
  },
  {
    id: 'heavy_slugs',
    name: 'Heavy Slugs',
    desc: '+25% bullet damage and +50% knockback force against armored infected.',
    rarity: 'rare',
    icon: '🎯',
    apply: (s) => { s.bulletDamageMult = (s.bulletDamageMult || 1) * 1.25; s.knockbackMult = (s.knockbackMult || 1) * 1.5; }
  },
  {
    id: 'drum_mag',
    name: 'Extended Drum Mag',
    desc: '+4 magazine capacity and +25% faster shell insertion speed.',
    rarity: 'common',
    icon: '🔋',
    apply: (s) => { s.magSize += 4; s.reloadSpeedMult = (s.reloadSpeedMult || 1) * 1.25; }
  },
  {
    id: 'flak_sabot',
    name: 'Flak Sabot',
    desc: '+4 additional buckshot pellets per blast with wider room-clearing cone spread.',
    rarity: 'rare',
    icon: '🌧️',
    apply: (s) => { s.pelletCount += 4; }
  },
  {
    id: 'adrenaline',
    name: 'Adrenaline Shot',
    desc: '+20% movement speed and -30% dodge roll stamina cost.',
    rarity: 'common',
    icon: '💉',
    apply: (s) => { s.moveSpeedMult = (s.moveSpeedMult || 1) * 1.2; s.rollCostMult = (s.rollCostMult || 1) * 0.7; }
  },
  {
    id: 'vampiric_bayonet',
    name: 'Vampiric Bayonet',
    desc: 'Melee bash deals +50 damage and restores +15 Health on kill.',
    rarity: 'legendary',
    icon: '🗡️',
    apply: (s) => { s.vampireMelee = true; }
  },
  {
    id: 'sentry_kit',
    name: 'Sentry Turret Supply',
    desc: 'Grants +2 Automated Sentry Turrets (<kbd>T</kbd>). Swivels & fires buckshot.',
    rarity: 'rare',
    icon: '🤖',
    apply: (s) => { s.deployables.sentry += 2; }
  },
  {
    id: 'claymore_kit',
    name: 'Claymore Mine Pack',
    desc: 'Grants +3 Directional Laser Claymores (<kbd>T</kbd>). 180 shrapnel damage.',
    rarity: 'common',
    icon: '💣',
    apply: (s) => { s.deployables.claymore += 3; }
  },
];
