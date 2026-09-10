import type { PerkItem } from '../game/items.ts';
import type { WeaponDef } from '../game/weapons.ts';
import type { CustomMapJson } from '../game/maps/customLoader.ts';

export interface WeaponSlotState {
  weapon: WeaponDef;
  ammo: number;
  reserve: number;
  isPap: boolean;
}

export class HudManager {
  private root: HTMLElement;

  // DOM elements
  private healthFill!: HTMLElement;
  private healthText!: HTMLElement;
  private staminaFill!: HTMLElement;
  private ammoText!: HTMLElement;
  private reloadFill!: HTMLElement;
  private roundBadge!: HTMLElement;
  private hostilesBadge!: HTMLElement;
  private pointsBadge!: HTMLElement;
  private deployableSlot!: HTMLElement;
  private interactPrompt!: HTMLElement;
  private weaponSlotsContainer!: HTMLElement;
  private bossBarContainer!: HTMLElement;
  private bossFill!: HTMLElement;
  private bossText!: HTMLElement;
  private modalContainer!: HTMLElement;
  private debriefContainer!: HTMLElement;
  private startContainer!: HTMLElement;
  private floatersLayer!: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.initDom();
  }

  private initDom(): void {
    this.root.innerHTML = `
      <!-- Top Boss Health Bar -->
      <div id="boss-hud" style="position: absolute; top: 18px; left: 50%; transform: translateX(-50%); width: 440px; display: none; flex-direction: column; align-items: center; z-index: 50;">
        <div style="display: flex; justify-content: space-between; width: 100%; color: #f87171; font-weight: 800; font-size: 14px; text-shadow: 0 0 8px rgba(239,68,68,0.8); margin-bottom: 4px;">
          <span>⚠️ APEX GOLIATH TYRANT</span>
          <span id="boss-text">100%</span>
        </div>
        <div style="width: 100%; height: 16px; background: rgba(15,23,42,0.85); border: 2px solid #ef4444; border-radius: 4px; overflow: hidden; box-shadow: 0 0 16px rgba(239,68,68,0.5);">
          <div id="boss-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #dc2626, #f97316); transition: width 0.1s ease-out;"></div>
        </div>
      </div>

      <!-- Top Right: Round & Wave Stats -->
      <div style="position: absolute; top: 20px; right: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        <div id="round-badge" style="font-size: 34px; font-weight: 900; color: #f59e0b; text-shadow: 0 0 12px rgba(245,158,11,0.6); letter-spacing: 2px;">
          ROUND 1
        </div>
        <div id="hostiles-badge" style="font-size: 14px; font-weight: 700; color: #94a3b8; background: rgba(15,23,42,0.7); padding: 4px 10px; border-radius: 4px; border: 1px solid #334155;">
          HOSTILES: 10 / 10
        </div>
        <div id="points-badge" style="font-size: 22px; font-weight: 800; color: #10b981; text-shadow: 0 0 8px rgba(16,185,129,0.5);">
          PTS: 500
        </div>
      </div>

      <!-- Center Interaction Prompt (CoD Zombies Style) -->
      <div id="interact-prompt" style="position: absolute; top: 62%; left: 50%; transform: translate(-50%, -50%); display: none; background: rgba(15,23,42,0.85); border: 2px solid #eab308; border-radius: 8px; padding: 10px 22px; font-size: 16px; font-weight: 900; color: #facc15; box-shadow: 0 0 18px rgba(234,179,8,0.4); pointer-events: none; letter-spacing: 1px; z-index: 40;">
        [E] BUY WEAPON
      </div>

      <!-- Bottom Left: Health, Stamina, Flashlight -->
      <div style="position: absolute; bottom: 24px; left: 24px; display: flex; flex-direction: column; gap: 8px; width: 250px;">
        <!-- Health -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #ef4444; margin-bottom: 2px;">
            <span>HEALTH</span>
            <span id="health-text">100 / 100</span>
          </div>
          <div style="width: 100%; height: 14px; background: rgba(15,23,42,0.8); border: 1px solid #dc2626; border-radius: 3px; overflow: hidden;">
            <div id="health-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #dc2626, #ef4444); transition: width 0.15s ease;"></div>
          </div>
        </div>
        <!-- Stamina -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 2px;">
            <span>STAMINA (DODGE ROLL)</span>
          </div>
          <div style="width: 100%; height: 8px; background: rgba(15,23,42,0.8); border: 1px solid #0284c7; border-radius: 2px; overflow: hidden;">
            <div id="stamina-fill" style="width: 100%; height: 100%; background: #38bdf8; transition: width 0.08s linear;"></div>
          </div>
        </div>
        <!-- Controls Legend -->
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; background: rgba(15,23,42,0.75); padding: 8px 10px; border-radius: 4px; border: 1px solid #1e293b;">
          <b>WASD</b>: Move | <b>M1</b>: Shoot | <b>Q/Wheel</b>: Swap Gun<br/>
          <b>E</b>: Interact (Wall/Box/PaP) | <b>F</b>: Butt-Strike | <b>T</b>: Deploy
        </div>
      </div>

      <!-- Bottom Right: CoD Weapon Slots & Ammo -->
      <div style="position: absolute; bottom: 24px; right: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <!-- Weapon Slots -->
        <div id="weapon-slots" style="display: flex; gap: 8px;"></div>
        <!-- Deployable Slot -->
        <div id="deploy-slot" style="background: rgba(15,23,42,0.85); border: 1px solid #eab308; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 800; color: #facc15;">
          [T] SENTRY TURRET (2)
        </div>
        <!-- Ammo Counter -->
        <div style="display: flex; flex-direction: column; align-items: flex-end;">
          <div id="ammo-text" style="font-size: 42px; font-weight: 900; color: #f8fafc; text-shadow: 0 0 12px rgba(255,255,255,0.4); line-height: 1;">
            8 <span style="font-size: 22px; color: #64748b;">/ 80</span>
          </div>
          <div style="width: 130px; height: 5px; background: #1e293b; border-radius: 2px; margin-top: 6px; overflow: hidden;">
            <div id="reload-fill" style="width: 0%; height: 100%; background: #eab308; transition: width 0.05s linear;"></div>
          </div>
        </div>
      </div>

      <!-- Floating Text Layer -->
      <div id="floaters" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden;"></div>

      <!-- Start Screen Modal with CoD Modded Maps Selector -->
      <div id="start-container" style="position: absolute; inset: 0; background: rgba(5,7,12,0.88); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 150; pointer-events: auto;">
      </div>

      <!-- Sector Requisition Pick-1-of-3 Modal -->
      <div id="modal-container" style="position: absolute; inset: 0; background: rgba(5,7,12,0.85); backdrop-filter: blur(8px); display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 100; pointer-events: auto;">
      </div>

      <!-- Game Over / Victory Debriefing -->
      <div id="debrief-container" style="position: absolute; inset: 0; background: rgba(5,7,12,0.92); backdrop-filter: blur(12px); display: none; flex-direction: column; align-items: center; justify-content: center; z-index: 200; pointer-events: auto;">
      </div>
    `;

    this.healthFill = document.getElementById('health-fill')!;
    this.healthText = document.getElementById('health-text')!;
    this.staminaFill = document.getElementById('stamina-fill')!;
    this.ammoText = document.getElementById('ammo-text')!;
    this.reloadFill = document.getElementById('reload-fill')!;
    this.roundBadge = document.getElementById('round-badge')!;
    this.hostilesBadge = document.getElementById('hostiles-badge')!;
    this.pointsBadge = document.getElementById('points-badge')!;
    this.deployableSlot = document.getElementById('deploy-slot')!;
    this.interactPrompt = document.getElementById('interact-prompt')!;
    this.weaponSlotsContainer = document.getElementById('weapon-slots')!;
    this.bossBarContainer = document.getElementById('boss-hud')!;
    this.bossFill = document.getElementById('boss-fill')!;
    this.bossText = document.getElementById('boss-text')!;
    this.modalContainer = document.getElementById('modal-container')!;
    this.debriefContainer = document.getElementById('debrief-container')!;
    this.startContainer = document.getElementById('start-container')!;
    this.floatersLayer = document.getElementById('floaters')!;
  }

  showStartScreen(
    maps: Array<{ id: string; name: string; desc: string }>,
    selectedMapId: string,
    onSelectMap: (mapId: string) => void,
    onDropCustomMap: (customData: CustomMapJson) => void,
    onStart: () => void
  ): void {
    this.startContainer.style.display = 'flex';
    this.startContainer.innerHTML = `
      <div style="font-size: 14px; font-weight: 800; color: #22c55e; letter-spacing: 4px; margin-bottom: 6px; text-shadow: 0 0 10px rgba(34,197,94,0.6);">
        ☣ CALL OF DUTY ZOMBIES MODDED ENGINE ☣
      </div>
      <div style="font-size: 50px; font-weight: 900; color: #f8fafc; text-shadow: 0 0 24px rgba(239,68,68,0.7); letter-spacing: 2px; margin-bottom: 6px; text-align: center;">
        SWISH <span style="color: #ef4444;">ZOMBIES</span>
      </div>
      <div style="font-size: 14px; font-weight: 600; color: #94a3b8; letter-spacing: 2px; margin-bottom: 24px; text-transform: uppercase;">
        Traditional Arsenal • Wall-Buys • Mystery Box • Pack-a-Punch • Custom Maps
      </div>

      <!-- Map Selector Grid -->
      <div style="display: flex; gap: 14px; max-width: 820px; width: 90%; margin-bottom: 20px;">
        ${maps.map(m => `
          <div class="map-card" data-map="${m.id}" style="flex: 1; background: ${m.id === selectedMapId ? 'rgba(37,99,235,0.25)' : 'rgba(15,23,42,0.8)'}; border: 2px solid ${m.id === selectedMapId ? '#38bdf8' : '#334155'}; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: all 0.2s ease;">
            <div style="font-size: 16px; font-weight: 800; color: ${m.id === selectedMapId ? '#38bdf8' : '#f8fafc'}; margin-bottom: 4px;">
              ${m.name}
            </div>
            <div style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
              ${m.desc}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Drop In Custom Map Area -->
      <div id="dropzone" style="background: rgba(15,23,42,0.7); border: 2px dashed #475569; border-radius: 10px; padding: 14px 24px; max-width: 820px; width: 90%; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 13px; font-weight: 800; color: #eab308;">📂 DROP IN CUSTOM MODDED MAP (.json)</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Drag & drop any custom map JSON or select a file to instantly load into the 3D engine</div>
        </div>
        <div style="display: flex; gap: 10px;">
          <input type="file" id="file-input" accept=".json" style="display: none;" />
          <button id="btn-browse" style="padding: 6px 14px; background: #334155; color: #f8fafc; font-size: 12px; font-weight: 800; border: none; border-radius: 6px; cursor: pointer;">
            CHOOSE FILE
          </button>
        </div>
      </div>

      <button id="btn-deploy" style="padding: 16px 48px; background: linear-gradient(135deg, #dc2626, #991b1b); color: #fff; font-size: 18px; font-weight: 900; letter-spacing: 1px; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 0 20px rgba(220,38,38,0.6); transition: all 0.2s ease;">
        DEPLOY INTO COMBAT
      </button>
    `;

    // Map selection clicks
    this.startContainer.querySelectorAll('.map-card').forEach(card => {
      card.addEventListener('click', () => {
        const mId = card.getAttribute('data-map')!;
        onSelectMap(mId);
      });
    });

    // File input handler
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    document.getElementById('btn-browse')?.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          try {
            const data = JSON.parse(re.target?.result as string) as CustomMapJson;
            onDropCustomMap(data);
          } catch (err) {
            alert('Invalid map JSON format');
          }
        };
        reader.readAsText(file);
      }
    });

    // Drag & drop on dropzone
    const dz = document.getElementById('dropzone');
    if (dz) {
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.style.borderColor = '#38bdf8'; });
      dz.addEventListener('dragleave', () => { dz.style.borderColor = '#475569'; });
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.style.borderColor = '#475569';
        const file = e.dataTransfer?.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            try {
              const data = JSON.parse(re.target?.result as string) as CustomMapJson;
              onDropCustomMap(data);
            } catch (err) {
              alert('Invalid map JSON format');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    document.getElementById('btn-deploy')?.addEventListener('click', () => {
      this.startContainer.style.display = 'none';
      onStart();
    });
  }

  setInteractPrompt(text: string | null): void {
    if (text) {
      this.interactPrompt.style.display = 'block';
      this.interactPrompt.innerText = text;
    } else {
      this.interactPrompt.style.display = 'none';
    }
  }

  updateWeaponSlots(slots: WeaponSlotState[], activeIdx: number): void {
    this.weaponSlotsContainer.innerHTML = slots.map((s, idx) => `
      <div style="background: ${idx === activeIdx ? 'rgba(37,99,235,0.4)' : 'rgba(15,23,42,0.8)'}; border: 2px solid ${
        idx === activeIdx ? (s.isPap ? '#c084fc' : '#38bdf8') : '#334155'
      }; border-radius: 6px; padding: 6px 12px; display: flex; flex-direction: column; align-items: flex-start; min-width: 130px; box-shadow: ${
        idx === activeIdx ? '0 0 12px rgba(56,189,248,0.4)' : 'none'
      };">
        <div style="font-size: 10px; font-weight: 800; color: ${s.isPap ? '#c084fc' : '#94a3b8'};">
          [${idx + 1}] ${s.isPap ? 'PACK-A-PUNCHED' : s.weapon.type.toUpperCase()}
        </div>
        <div style="font-size: 13px; font-weight: 900; color: #f8fafc;">
          ${s.isPap ? s.weapon.papName : s.weapon.name}
        </div>
      </div>
    `).join('');
  }

  addFloatingText(text: string, x: number, y: number, color: string = '#10b981'): void {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.position = 'absolute';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(-50%, -50%)';
    el.style.color = color;
    el.style.fontWeight = '900';
    el.style.fontSize = '18px';
    el.style.textShadow = `0 0 10px ${color}`;
    el.style.transition = 'all 0.8s ease-out';
    el.style.pointerEvents = 'none';
    this.floatersLayer.appendChild(el);

    requestAnimationFrame(() => {
      el.style.top = `${y - 40}px`;
      el.style.opacity = '0';
    });

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
  }

  update(
    health: number,
    maxHealth: number,
    stamina: number,
    maxStamina: number,
    ammo: number,
    reserveAmmo: number,
    isReloading: boolean,
    reloadProgress: number,
    round: number,
    hostilesAlive: number,
    totalHostiles: number,
    score: number,
    deployableType: string,
    deployableCount: number,
    bossActive: boolean,
    bossHpRatio: number
  ): void {
    const hpPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    this.healthFill.style.width = `${hpPct}%`;
    this.healthText.innerText = `${Math.ceil(health)} / ${maxHealth}`;

    const stamPct = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
    this.staminaFill.style.width = `${stamPct}%`;

    if (isReloading) {
      this.ammoText.innerHTML = `<span style="color: #eab308; font-size: 26px;">RELOADING...</span>`;
      this.reloadFill.style.width = `${Math.min(100, reloadProgress * 100)}%`;
    } else {
      this.ammoText.innerHTML = `${ammo} <span style="font-size: 22px; color: #64748b;">/ ${reserveAmmo}</span>`;
      this.reloadFill.style.width = '0%';
    }

    this.roundBadge.innerText = `ROUND ${round}`;
    this.hostilesBadge.innerText = `HOSTILES: ${hostilesAlive} / ${totalHostiles}`;
    this.pointsBadge.innerText = `PTS: ${score.toLocaleString()}`;

    const depName = deployableType === 'sentry' ? 'SENTRY TURRET' : deployableType === 'claymore' ? 'CLAYMORE MINE' : 'BARBED WIRE';
    this.deployableSlot.innerText = `[T] ${depName} (${deployableCount})`;

    if (bossActive) {
      this.bossBarContainer.style.display = 'flex';
      const pct = Math.max(0, Math.min(100, Math.round(bossHpRatio * 100)));
      this.bossFill.style.width = `${pct}%`;
      this.bossText.innerText = `${pct}%`;
    } else {
      this.bossBarContainer.style.display = 'none';
    }
  }

  showUpgradeModal(options: PerkItem[], onSelect: (item: PerkItem) => void): void {
    this.modalContainer.style.display = 'flex';
    this.modalContainer.innerHTML = `
      <div style="font-size: 14px; font-weight: 800; color: #38bdf8; letter-spacing: 3px; margin-bottom: 8px;">
        TACTICAL SECTOR REQUISITION
      </div>
      <div style="font-size: 32px; font-weight: 900; color: #f8fafc; margin-bottom: 32px; text-shadow: 0 0 16px rgba(255,255,255,0.3);">
        CHOOSE COMBAT SPECIALIZATION
      </div>
      <div style="display: flex; gap: 24px; max-width: 960px; width: 90%;">
        ${options.map((opt, idx) => `
          <div class="perk-card" data-idx="${idx}" style="flex: 1; background: rgba(15,23,42,0.85); border: 2px solid ${
            opt.rarity === 'legendary' ? '#f59e0b' : opt.rarity === 'rare' ? '#38bdf8' : '#10b981'
          }; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="font-size: 48px; margin-bottom: 16px;">${opt.icon}</div>
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: ${
              opt.rarity === 'legendary' ? '#f59e0b' : opt.rarity === 'rare' ? '#38bdf8' : '#10b981'
            }; letter-spacing: 1px; margin-bottom: 6px;">
              ${opt.rarity}
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #f8fafc; text-align: center; margin-bottom: 12px;">
              ${opt.name}
            </div>
            <div style="font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5; flex: 1;">
              ${opt.desc}
            </div>
            <button style="margin-top: 20px; width: 100%; padding: 10px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-weight: 800; font-size: 14px; cursor: pointer;">
              EQUIP UPGRADE
            </button>
          </div>
        `).join('')}
      </div>
    `;

    const cards = this.modalContainer.querySelectorAll('.perk-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        (card as HTMLElement).style.transform = 'translateY(-6px)';
      });
      card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'translateY(0)';
      });
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-idx') || '0', 10);
        const selected = options[idx];
        if (selected) {
          this.modalContainer.style.display = 'none';
          onSelect(selected);
        }
      });
    });
  }

  showDebriefing(isVictory: boolean, stats: { round: number; kills: number; headshots: number; score: number }, onRestart: () => void, onEndless?: () => void): void {
    this.debriefContainer.style.display = 'flex';
    this.debriefContainer.innerHTML = `
      <div style="font-size: 14px; font-weight: 800; color: ${isVictory ? '#22c55e' : '#ef4444'}; letter-spacing: 3px; margin-bottom: 8px;">
        ${isVictory ? 'MISSION ACCOMPLISHED' : 'FIELDHOUSE OVERRUN'}
      </div>
      <div style="font-size: 42px; font-weight: 900; color: #f8fafc; margin-bottom: 24px; text-shadow: 0 0 20px ${isVictory ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'};">
        ${isVictory ? 'EXTRACTION SUCCESSFUL' : 'OPERATOR KIA'}
      </div>
      <div style="background: rgba(15,23,42,0.85); border: 1px solid #334155; border-radius: 12px; padding: 24px 36px; min-width: 380px; margin-bottom: 28px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #94a3b8;">
          <span>ROUNDS SURVIVED</span>
          <span style="color: #f8fafc;">${stats.round}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #94a3b8;">
          <span>HOSTILES ELIMINATED</span>
          <span style="color: #f8fafc;">${stats.kills}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 700; color: #94a3b8;">
          <span>CRITICAL HEADSHOTS</span>
          <span style="color: #f8fafc;">${stats.headshots}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; color: #10b981; font-size: 18px; border-top: 1px solid #1e293b; padding-top: 10px;">
          <span>TOTAL SCORE</span>
          <span>${stats.score.toLocaleString()} PTS</span>
        </div>
      </div>
      <div style="display: flex; gap: 16px;">
        <button id="btn-restart" style="padding: 12px 28px; background: #dc2626; color: #fff; font-weight: 800; font-size: 15px; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s;">
          DEPLOY AGAIN
        </button>
        ${isVictory && onEndless ? `
          <button id="btn-endless" style="padding: 12px 28px; background: #16a34a; color: #fff; font-weight: 800; font-size: 15px; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s;">
            CONTINUE ENDLESS NIGHTMARE
          </button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.debriefContainer.style.display = 'none';
      onRestart();
    });

    if (isVictory && onEndless) {
      document.getElementById('btn-endless')?.addEventListener('click', () => {
        this.debriefContainer.style.display = 'none';
        onEndless();
      });
    }
  }
}
