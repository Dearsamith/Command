const STORAGE_KEY = 'art_of_command_v10_offline';
const MAP = { w: 980, h: 560 };

const uiMeta = {
  overview: { eyebrow: 'SECTOR OVERVIEW', title: 'ภาพรวมยุทธการ', desc: 'ดูสถานการณ์รวม ภารกิจ และเรื่องเร่งด่วนในหมวดเดียว' },
  operations: { eyebrow: 'OPERATIONS', title: 'ปฏิบัติการและแผนที่', desc: 'คุมแผนที่ยุทธการ ออกคำสั่ง และติดตามการเคลื่อนไหวแบบ Real-Time' },
  command: { eyebrow: 'CHAIN OF COMMAND', title: 'สายการบังคับบัญชา', desc: 'ดูโครงสร้างกองทัพ 4 ชั้น พร้อมสถานะของแต่ละหน่วย' },
  c2: { eyebrow: 'COMMAND & STAFF', title: 'ศูนย์บัญชาการและฝ่ายเสนาธิการ', desc: 'บริหารทักษะ ผบช. ระบบส่งคำสั่ง การยืนยันรับ และงานที่ค้างอยู่ของฝ่ายเสนาธิการ' },
  staff: { eyebrow: 'STAFF & LOGISTICS', title: 'ฝ่ายอำนวยการและส่งกำลัง', desc: 'ติดตาม S1/S2/S3/S4/S6, การแพทย์ และความพร้อมของระบบสนับสนุน' },
  nation: { eyebrow: 'NATIONAL MANAGEMENT', title: 'เศรษฐกิจหลายประเทศ', desc: 'บริหารเศรษฐกิจระหว่างประเทศ อุตสาหกรรม ทรัพยากร และนโยบายของรัฐบาล' },
  history: { eyebrow: 'LOCAL RECORDS', title: 'โลกย้อนหลังและ Snapshot', desc: 'ดูประวัติที่บันทึกในเบราว์เซอร์และสถานะโลกในอดีต เฉพาะช่วงเวลาที่เปิดเล่น' },
  missions: { eyebrow: 'MISSION MANAGEMENT', title: 'แผนภารกิจ', desc: 'สร้างและติดตามภารกิจหลายระยะพร้อมข้อจำกัดด้านความพร้อมและทรัพยากร' },
  commanders: { eyebrow: 'COMMAND PERSONNEL', title: 'ผู้บังคับบัญชา', desc: 'จัดการโปรไฟล์ ชื่อ และภาพประจำตัวของผู้บังคับบัญชาแต่ละนาย' },
  personnel: { eyebrow: 'UNIT ORGANIZATION', title: 'กำลังพลและอุปกรณ์', desc: 'ตรวจอัตรากำลังจริง รายการผู้บาดเจ็บ ยานพาหนะ และสภาพการเดินทางของหน่วย' },
  sustain: { eyebrow: 'SUSTAINMENT', title: 'คลังเสบียงและการแพทย์', desc: 'จัดการสต็อกทรัพยากรแยกประเภท การขนส่ง การรักษา และการซ่อมบำรุงตามเวลาจำลอง' },
  scenarios: { eyebrow: 'HISTORICAL SCENARIOS', title: 'Scenario ประวัติศาสตร์', desc: 'เลือกสงครามโลกครั้งที่สองหรือยุคปัจจุบันแบบอิงเหตุการณ์จริง พร้อมผลลัพธ์ทางเลือก' },
  era: { eyebrow: 'ERA & EQUIPMENT', title: 'ยุค อุปกรณ์ และ AI', desc: 'ตรวจความแตกต่างตามยุคและพฤติกรรมของ AI ฝ่ายตรงข้ามในเกม' },
  reports: { eyebrow: 'REPORTS & REVIEW', title: 'รายงานและบันทึก', desc: 'ตรวจ AAR และบันทึกเหตุการณ์ทั้งหมดของโลกจำลอง' }
};

const state = {
  timeMinutes: 360,
  day: 1,
  speed: 1,
  paused: false,
  activeView: 'overview',
  selectedUnitId: null,
  selectedLayer: 'terrain',
  pendingMapAction: null,
  map: { zoom: 1, offsetX: 0, offsetY: 0 },
  economy: { budget: 820, industry: 68, fuel: 74, supplies: 79, publicSupport: 63 },
  staff: { operations: 72, intelligence: 64, logistics: 70, medical: 66, communications: 61, replacementPool: 540 },
  enemyPressure: 48,
  missionSerial: 1,
  eventSerial: 1,
  weather: 'ท้องฟ้าโปร่ง',
  units: [],
  missions: [],
  events: [],
  absMinutes: 0, requests: [], convoys: [], depots: [], relays: [], intelContacts: {}, reports: {}, lastAutoRequest: {}, requestSerial: 0, orderSerial: 0, convoySerial: 0,
  commanders: [], selectedCommanderId: null, rngSeed: 68371, world: {}, c2: null, selectedC2CommanderId: null, sustain: null, scenario:null, scenarioId:"sandbox", opponent:null, eraModel:null
};

function createDefaultState() {
  state.timeMinutes = 360; state.day = 1; state.speed = 1; state.paused = false;
  state.activeView = 'overview'; state.selectedUnitId = 'army'; state.selectedLayer = 'terrain';
  state.pendingMapAction = null; state.map = { zoom: 1, offsetX: 0, offsetY: 0 }; state.selectedCommanderId = null;
  state.economy = { budget: 820, industry: 68, fuel: 74, supplies: 79, publicSupport: 63 };
  state.staff = { operations: 72, intelligence: 64, logistics: 70, medical: 66, communications: 61, replacementPool: 540 };
  state.sustain=null;state.scenario=null;state.scenarioId="sandbox";state.opponent=null;state.eraModel=null;
  state.enemyPressure = 48; state.weather = 'ท้องฟ้าโปร่ง'; state.missionSerial = 1; state.eventSerial = 1; state.rngSeed = 68371; state.c2=null; state.selectedC2CommanderId=null;

  state.units = [
    unit('army','1st Army Command',null,'army',null,260,140,'ally',0.82),
    unit('div1','1st Division','army','division',null,240,130,'ally',0.79,'ยึดแนวเนินเขาด้านตะวันตก','MG Chanin'),
    unit('div2','2nd Division','army','division',null,520,250,'ally',0.75,'รักษาสะพานหลักและเส้นทางส่งกำลัง','MG Preecha'),
    unit('div3','Reserve Division','army','division',null,710,140,'ally',0.72,'เป็นกองหนุนและพร้อมโต้ตอบ','MG Sorasak'),

    unit('b11','1st Battalion','div1','battalion',null,190,150,'ally',0.78,'คุมพื้นที่ป่าทิศเหนือ','COL Pramote'),
    unit('b12','2nd Battalion','div1','battalion',null,300,160,'ally',0.77,'คุ้มกันแนวรุกบนสันเขา','COL Kriangsak'),
    unit('b21','3rd Battalion','div2','battalion',null,455,250,'ally',0.75,'รักษาเมืองหน้าและสะพาน','COL Niphon'),
    unit('b22','4th Battalion','div2','battalion',null,570,268,'ally',0.73,'ป้องกันศูนย์ขนส่ง','COL Thanet'),
    unit('b31','5th Battalion','div3','battalion',null,650,145,'ally',0.71,'เป็นกำลังสำรองเคลื่อนที่เร็ว','COL Panya'),
    unit('b32','6th Battalion','div3','battalion',null,770,155,'ally',0.70,'พร้อมเสริมพื้นที่เสี่ยง','COL Wichai'),

    unit('c111','A Coy','b11','company',132,170,168,'ally',0.76,'ลาดตระเวนแนวป่า','CAPT Arun'),
    unit('c112','B Coy','b11','company',128,206,152,'ally',0.74,'คุมแนวลำน้ำย่อย','CAPT Boripat'),
    unit('c121','C Coy','b12','company',129,282,172,'ally',0.76,'บุกยึดทางขึ้นเนิน','CAPT Chaiwat'),
    unit('c122','D Coy','b12','company',130,330,148,'ally',0.73,'คุ้มกันปีกซ้าย','CAPT Decha'),
    unit('c211','E Coy','b21','company',126,430,262,'ally',0.75,'รักษาเมืองหน้า','CAPT Ekasit'),
    unit('c212','F Coy','b21','company',127,482,240,'ally',0.72,'คุมสะพานและท่าข้าม','CAPT Faran'),
    unit('c221','G Coy','b22','company',124,548,290,'ally',0.71,'รักษาศูนย์เสบียง','CAPT Kiet'),
    unit('c222','H Coy','b22','company',123,604,254,'ally',0.70,'คุ้มกันถนนสายหลัก','CAPT Harit'),
    unit('c311','I Coy','b31','company',131,678,126,'ally',0.74,'กองหนุนหน้า 1','CAPT Inthorn'),
    unit('c312','J Coy','b31','company',120,722,154,'ally',0.69,'คุ้มกันกองหนุน','CAPT Jaran'),
    unit('c321','K Coy','b32','company',122,792,130,'ally',0.70,'กองหนุนหน้า 2','CAPT Kittisak'),
    unit('c322','L Coy','b32','company',118,830,166,'ally',0.67,'ปิดช่องว่างแนวบน','CAPT Likhit'),

    unit('e1','Red Spear 1',null,'company',124,786,392,'enemy',0.68,'รวมพลรุกสะพาน',''),
    unit('e2','Red Spear 2',null,'company',119,690,414,'enemy',0.66,'คุมป่าตะวันออก',''),
    unit('e3','Red Spear 3',null,'company',127,860,350,'enemy',0.69,'คุ้มกันแนวขวา',''),
    unit('e4','Red Spear 4',null,'company',121,620,362,'enemy',0.67,'กดดันเมืองหน้า',''),
    unit('e5','Red Spear 5',null,'company',120,740,458,'enemy',0.70,'เป็นกำลังเสริม','')
  ];

  state.units.forEach(u => {
    u.commandDelay = commandDelayFor(u);
    if (u.side === 'ally') {
      u.readiness = clamp(55 + Math.round(u.training * 35), 0, 100);
      u.supply = clamp(58 + Math.round(rng() * 24), 0, 100);
      u.morale = clamp(60 + Math.round(rng() * 24), 0, 100);
      u.fatigue = clamp(10 + Math.round(rng() * 18), 0, 100);
    } else {
      u.readiness = clamp(50 + Math.round(u.training * 30), 0, 100);
      u.supply = clamp(50 + Math.round(rng() * 25), 0, 100);
      u.morale = clamp(55 + Math.round(rng() * 18), 0, 100);
      u.fatigue = clamp(12 + Math.round(rng() * 20), 0, 100);
    }
  });

  state.missions = [
    { id:'m1', unitId:'div1', title:'ยึดแนวเนินตะวันตก', objective:'ยันแนวข้าศึกไม่ให้ลงมาสู่ถนนหลัก', priority:'สูง', status:'กำลังดำเนินการ' },
    { id:'m2', unitId:'div2', title:'ป้องกันสะพานหลวง', objective:'รักษาทางข้ามแม่น้ำและเมืองหน้า', priority:'สูง', status:'กำลังดำเนินการ' },
    { id:'m3', unitId:'div3', title:'จัดกำลังสำรอง', objective:'คอยเสริมพื้นที่ที่ถูกกดดัน', priority:'กลาง', status:'พร้อมปฏิบัติ' }
  ];

  state.absMinutes=0; state.requests=[]; state.convoys=[]; state.depots=[
    {id:'depot-west',name:'คลังตะวันตก',x:260,y:240,stock:680},
    {id:'depot-central',name:'คลังกลาง',x:600,y:215,stock:830}
  ]; state.relays=[]; state.intelContacts={}; state.reports={}; state.lastAutoRequest={}; state.requestSerial=0; state.orderSerial=0; state.convoySerial=0;
  state.events = [];
  initializeCommanderProfiles(); C2.initialize(state,false); World.initialize(state,false);
  logEvent('SYSTEM', 'เริ่มสถานการณ์ใหม่และเพิ่มระบบโปรไฟล์ผู้บังคับบัญชาสำหรับ Build 0.5');
  logEvent('HQ', 'กองทัพที่ 1 เข้าประจำที่ ศูนย์บัญชาการพร้อมปฏิบัติ');
  logEvent('S4', 'คลังเสบียงกลางอยู่ในสภาพพร้อมใช้งาน 79%');
}

function unit(id, name, parentId, echelon, strength, x, y, side, training, doctrine='สมดุล', commander='') {
  return { id, name, parentId, echelon, strength, x, y, side, training, doctrine, commander,
    children: [], targetX: x, targetY: y, order: 'HOLD', lastReportMinute: 0, lastOrderMinute: 0,
    objective: doctrine, statusText: 'พร้อม', aiMode: 'balanced' };
}



function initializeCommanderProfiles() {
  const rankMap = { army:'GEN', division:'MG', battalion:'COL', company:'CAPT' };
  const roleMap = { army:'Army Commander', division:'Division Commander', battalion:'Battalion Commander', company:'Company Commander' };
  const allyUnits = state.units.filter(u=>u.side==='ally' && (u.commander || u.echelon==='army'));
  state.commanders = allyUnits.map((u, idx) => {
    const rank = rankMap[u.echelon] || 'OFF';
    const name = u.commander || (u.echelon==='army' ? 'GEN Suradet' : `${rank} Officer ${idx+1}`);
    const profile = randomCommanderProfile(`cmd-${u.id}`, name, rank, idx);
    profile.assignedUnitId = u.id;
    profile.role = roleMap[u.echelon] || 'Commander';
    u.commanderId = profile.id;
    profile.commandStyle ||= 'balanced'; profile.composure ??= 72;
    u.commander = profile.name;
    return profile;
  });
  state.selectedCommanderId = state.commanders[0]?.id || null;
}

function ensureCommanderSystem() {
  if (!Array.isArray(state.commanders) || !state.commanders.length) {
    initializeCommanderProfiles();
    return;
  }
  const rankMap = { army:'GEN', division:'MG', battalion:'COL', company:'CAPT' };
  state.units.filter(u=>u.side==='ally' && (u.commander || u.echelon==='army')).forEach((u, idx) => {
    let profile = state.commanders.find(c => c.assignedUnitId === u.id);
    if (!profile && u.commanderId) profile = state.commanders.find(c => c.id === u.commanderId);
    if (!profile) {
      profile = randomCommanderProfile(`cmd-${u.id}`, u.commander || `${rankMap[u.echelon]||'OFF'} Officer ${idx+1}`, rankMap[u.echelon] || 'OFF', idx+5);
      profile.assignedUnitId = u.id;
      profile.role = `${labelEchelon(u.echelon)} Commander`;
      state.commanders.push(profile);
    }
    u.commanderId = profile.id;
    profile.commandStyle ||= 'balanced'; profile.composure ??= 72;
    u.commander = profile.name;
  });
  if (!state.selectedCommanderId || !state.commanders.find(c=>c.id===state.selectedCommanderId)) {
    state.selectedCommanderId = state.commanders[0]?.id || null;
  }
}

function commanderById(id) { return state.commanders.find(c => c.id === id); }
function commanderForUnit(unit) { return unit?.commanderId ? commanderById(unit.commanderId) : null; }

function randomCommanderProfile(id, name, rank='OFF', seed=0) {
  const pick = (arr, offset=0) => arr[(seed + offset) % arr.length];
  return {
    id,
    name,
    rank,
    role: 'Commander',
    assignedUnitId: null,
    faceTone: pick(['fair','light','medium','tan','deep'],1),
    hairStyle: pick(['short','sidepart','buzz','crew','wavy'],2),
    hairColor: pick(['black','darkbrown','brown','darkgray'],3),
    eyeColor: pick(['brown','darkbrown','hazel','gray'],4),
    eyebrow: pick(['normal','thick','arched'],5),
    facialHair: pick(['none','stubble','mustache','trimbeard'],6),
    uniform: pick(['olive','service','field','desert'],7),
    headgear: pick(['none','beret','servicecap','patrolcap'],8),
    background: pick(['studioGreen','hqDark','flagOlive','mapRoom'],9),
    ageBand: pick(['young','mid','senior'],10),
    accessory: pick(['none','earpiece','ribbon','glasses'],11),
    scar: pick(['none','brow','cheek'],12),
    commandStyle:pick(['balanced','cautious','independent'],13),composure:60+(seed%31)
  };
}

function applyCommanderLinks() {
  state.units.forEach(u => {
    const c = commanderForUnit(u);
    if (c) u.commander = c.name;
  });
}

function commanderNameForUnit(u) {
  const c = commanderForUnit(u);
  return c ? c.name : (u?.commander || 'AI / UNKNOWN');
}

function commanderRankRole(unit) {
  const c = commanderForUnit(unit);
  if (!c) return '';
  return `${c.rank} • ${c.role}`;
}

function rebuildChildren() {
  const map = Object.fromEntries(state.units.map(u => [u.id, u]));
  state.units.forEach(u => u.children = []);
  state.units.forEach(u => { if (u.parentId && map[u.parentId]) map[u.parentId].children.push(u.id); });
}

function commandDelayFor(u) {
  const base = { army: 20, division: 14, battalion: 9, company: 4 }[u.echelon] || 6;
  return Math.max(2, Math.round(base - u.training * 4));
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function fmtTime(min){ const hh = Math.floor(min/60)%24; const mm = Math.floor(min)%60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function nowStamp(){ return `D${String(state.day).padStart(2,'0')} ${fmtTime(state.timeMinutes)}`; }
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(showToast._t); showToast._t=setTimeout(()=>t.classList.remove('show'),1800); }
function getUnit(id){ return state.units.find(u=>u.id===id); }
function leafCompaniesOf(id){ const start=getUnit(id); if(!start) return []; const out=[]; const walk=u=>{ if(u.echelon==='company') out.push(u); else u.children.map(getUnit).filter(Boolean).forEach(walk);}; walk(start); return out; }
function friendlyCompanies(){ return state.units.filter(u=>u.side==='ally' && u.echelon==='company'); }
function enemyCompanies(){ return state.units.filter(u=>u.side==='enemy' && u.echelon==='company'); }
function aggregateOf(id){ const leaves=leafCompaniesOf(id); const source = leaves.length? leaves : [getUnit(id)].filter(Boolean); const count = source.length || 1;
  const strength=source.reduce((s,u)=>s+(u.strength||0),0); const readiness=Math.round(source.reduce((s,u)=>s+u.readiness,0)/count);
  const supply=Math.round(source.reduce((s,u)=>s+u.supply,0)/count); const morale=Math.round(source.reduce((s,u)=>s+u.morale,0)/count); const fatigue=Math.round(source.reduce((s,u)=>s+u.fatigue,0)/count);
  return { strength, readiness, supply, morale, fatigue };
}
function logEvent(src, msg){ state.events.unshift({ id:`e${state.eventSerial++}`, stamp: nowStamp(), source: src, message: msg }); if(state.events.length>180) state.events.length=180; }

function saveGame() {
  try {localStorage.setItem(STORAGE_KEY, JSON.stringify(state));} catch(e) { showToast('ไม่สามารถบันทึกได้: พื้นที่จัดเก็บไม่พร้อม'); return; }
  window.OfflineWorld?.afterSave?.();
  showToast('บันทึกเกมแล้ว');
}
function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('art_of_command_v10') || localStorage.getItem('art_of_command_v09') || localStorage.getItem('art_of_command_v08') || localStorage.getItem('art_of_command_v07') || localStorage.getItem('art_of_command_v06') || localStorage.getItem('art_of_command_v05') || localStorage.getItem('art_of_command_v04') || localStorage.getItem('art_of_command_v03');
  if (!raw) { showToast('ไม่พบบันทึกเกม'); return; }
  const data = JSON.parse(raw);
  if(!Object.prototype.hasOwnProperty.call(data,'nations')){delete state.nations;delete state.diplomacy;delete state.market;delete state.nationEvents;delete state.nationActions;}
  Object.assign(state, data);
  const savedPreset=Scenarios.byId(state.scenarioId||'sandbox');
  if(!state.scenario || state.scenario.id!==savedPreset.id) state.scenario={...savedPreset,title:savedPreset.name};
  else state.scenario.era=savedPreset.era;
  rebuildChildren(); Theaters.activate(state.scenarioId||'sandbox');World.initialize(state,true); initializeSystems(true); C2.initialize(state,true); Era.apply(state,true); Opponent.initialize(state,true); Nations.initialize(state,true);
  state.scenarioId ||= "sandbox"; state.scenario ||= {...Scenarios.byId(state.scenarioId),title:Scenarios.byId(state.scenarioId).name};
  window.OfflineWorld?.afterLoad?.();
  renderAll();
  showToast('โหลดเกมสำเร็จ');
}

function exportGame() {
  const blob = new Blob([JSON.stringify(state,null,2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'art-of-command-v10-offline-save.json'; a.click();
  URL.revokeObjectURL(a.href);
}

function startNewScenario(scenarioId='sandbox') {
  createDefaultState(); rebuildChildren(); initializeSystems(false);
  Scenarios.apply(state, scenarioId); Nations.initialize(state,false); state.activeView='overview';setView('overview');document.getElementById('sustainUnit')?.removeAttribute('data-ready');
  window.OfflineWorld?.newCampaign?.();
  renderAll(); showToast('เริ่ม Scenario: '+Scenarios.byId(scenarioId).name);
}

function setView(view){ state.activeView=view; document.querySelectorAll('.nav-item').forEach(btn=>btn.classList.toggle('active', btn.dataset.view===view)); document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id===`view-${view}`)); const meta=uiMeta[view]; document.getElementById('pageEyebrow').textContent=meta.eyebrow; document.getElementById('pageTitle').textContent=meta.title; document.getElementById('pageDescription').textContent=meta.desc; }

function renderKPIs(){
  const allies=friendlyCompanies(); const agg=aggregateOf('army');
  const kpis = [
    ['กำลังพลพร้อมรบ', agg.strength, 'รวมจาก 12 กองร้อย'],
    ['ความพร้อม', `${agg.readiness}%`, 'ค่าเฉลี่ยทั้งกองทัพ'],
    ['เสบียง', `${agg.supply}%`, 'ระดับหน่วยภาคสนาม'],
    ['ขวัญกำลังใจ', `${agg.morale}%`, 'สะท้อนความมั่นคงของแนวรบ'],
    ['แรงกดดันข้าศึก', `${state.enemyPressure}%`, 'ค่าประเมินจากสถานการณ์'],
    ['งบประมาณ', `${state.economy.budget}`, 'หน่วยสมมติ/รอบเวลา']
  ];
  document.getElementById('kpiBar').innerHTML = kpis.map(([label,v,sub])=>`<div class="kpi-card"><div class="label">${label}</div><div class="value">${v}</div><div class="sub">${sub}</div></div>`).join('');
}

function renderSidebarSummary(){
  const agg=aggregateOf('army');
  const html = [
    miniStat('แนวรบหลัก','ชายแดนเหนือ','สถานะ','ปะทะระดับต่ำ'),
    miniStat('กำลังพลรวม', agg.strength,'เสบียงเฉลี่ย', `${agg.supply}%`),
    miniStat('หน่วยที่เลือก', getSelectedUnit()?.name || 'ไม่มี','คำสั่งล่าสุด', getSelectedUnit()?.order || '-'),
    miniStat('ภารกิจเปิดอยู่', state.missions.length,'งบประมาณคงเหลือ', state.economy.budget)
  ].join('');
  document.getElementById('sidebarSummary').innerHTML = html;
}
function miniStat(title,a,b,c){return `<div class="mini-stat"><strong>${escapeHtml(title)}</strong><div class="row"><span>${escapeHtml(a)}</span><span class="muted">${escapeHtml(b)}</span></div><div class="muted">${escapeHtml(c)}</div></div>`;}

function renderOverview(){
  const agg=aggregateOf('army');
  const overview = [
    infoCard('กองทัพที่ 1', 'ระดับการปฏิบัติการโดยรวม', [
      barRow('Readiness', agg.readiness), barRow('Supply', agg.supply), barRow('Morale', agg.morale), barRow('Fatigue', agg.fatigue, true)
    ].join('')),
    infoCard('กองพลที่ 1', 'แนวเนินตะวันตก', renderUnitMini('div1')),
    infoCard('กองพลที่ 2', 'สะพานหลวงและเมืองหน้า', renderUnitMini('div2')),
    infoCard('กองพลสำรอง', 'กำลังหนุนเคลื่อนที่', renderUnitMini('div3'))
  ].join('');
  document.getElementById('overviewBoard').innerHTML = overview;

  document.getElementById('missionBoard').innerHTML = state.missions.slice(0,5).map(renderMissionBrief).join('') || '<div class="helper-note">ยังไม่มีภารกิจ</div>'; 

  const priorities = buildPriorities();
  document.getElementById('priorityList').innerHTML = priorities.map(p=>`<div class="priority-card"><div><h3>${p.title}</h3><div class="muted">${p.detail}</div></div><span class="priority-badge ${priorityClass(p.level)}">${p.level}</span></div>`).join('');
  renderEventLists();
}
function renderUnitMini(id){ const u=getUnit(id); if(!u) return ''; const agg=aggregateOf(id); return `<div class="inline-stats"><div class="stat-tile"><div class="muted">กำลังพล</div><div class="big">${agg.strength}</div></div><div class="stat-tile"><div class="muted">ผู้บังคับบัญชา</div><div>${escapeHtml(commanderNameForUnit(u)||'-')}</div></div></div>${barRow('Readiness',agg.readiness)}${barRow('Supply',agg.supply)}${barRow('Morale',agg.morale)}`; }
function infoCard(title,sub,body){ return `<div class="info-card"><div class="row"><h3 style="margin:0">${title}</h3><span class="muted">${sub}</span></div>${body}</div>`; }
function barRow(label,val,invert=false){ val=Math.round(clamp(Number(val)||0,0,100)); const cls = val < 45 ? 'danger' : val < 65 ? 'warn' : ''; const computed = invert ? 100 - val : val; return `<div style="margin-top:8px"><div class="row"><span class="muted">${label}</span><strong>${val}%</strong></div><div class="metric-bar"><div class="metric-fill ${cls}" style="width:${computed}%"></div></div></div>`; }
function priorityClass(level){ return level==='สูง'?'high':level==='กลาง'?'medium':'low'; }

function buildPriorities(){
  const p=[]; const agg=aggregateOf('army');
  if (agg.supply < 68) p.push({ title:'เสบียงเฉลี่ยต่ำกว่าระดับปลอดภัย', detail:'ควรเพิ่มงบด้าน S4 หรือสั่งพักกำลังบางพื้นที่', level:'สูง' });
  if (state.staff.communications < 58) p.push({ title:'ระบบสื่อสารมีประสิทธิภาพต่ำ', detail:'คำสั่งระดับบนอาจล่าช้ากว่าปกติ', level:'กลาง' });
  const weak = friendlyCompanies().sort((a,b)=>a.readiness-b.readiness)[0];
  if (weak) p.push({ title:`${weak.name} readiness ต่ำ`, detail:`หน่วยนี้อยู่ที่ ${Math.round(weak.readiness)}% และอาจต้องพักหรือเสริมกำลัง`, level: weak.readiness < 50 ? 'สูง' : 'กลาง' });
  p.push({ title:'ประเมินแรงกดดันฝ่ายตรงข้าม', detail:`ระดับแรงกดดันปัจจุบัน ${state.enemyPressure}% ขึ้นกับการเคลื่อนตัวของกองร้อยข้าศึก`, level: state.enemyPressure > 56 ? 'สูง' : 'ต่ำ' });
  return p.slice(0,4);
}

function getSelectedUnit(){ return getUnit(state.selectedUnitId) || getUnit('army'); }
function renderCommandPanel(){
  const u=getSelectedUnit(); if(!u) return; const agg=aggregateOf(u.id); const isEnemy = u.side==='enemy';
  const children = u.children.map(getUnit).filter(Boolean);
  const html = [
    `<div class="command-group"><h3>${u.name}</h3><div class="muted">${labelEchelon(u.echelon)} • ${u.commander||'AI Command'} • Delay ${u.commandDelay} min</div>${!isEnemy?`${barRow('Readiness',agg.readiness)}${barRow('Supply',agg.supply)}${barRow('Morale',agg.morale)}`:''}</div>`,
    !isEnemy ? `<div class="command-group"><h3>คำสั่งพื้นฐาน</h3><div class="button-grid"><button class="btn btn-secondary" data-order="HOLD">รักษาที่ตั้ง</button><button class="btn btn-secondary" data-order="REST">พักกำลัง</button><button class="btn btn-secondary" data-order="DELEGATE">มอบอำนาจ AI</button><button class="btn btn-secondary" data-order="REPORT">ขอรายงาน</button></div></div>` : '',
    !isEnemy ? `<div class="command-group"><h3>เคลื่อนกำลัง</h3><div class="muted">กดปุ่มด้านล่างแล้วคลิกจุดหมายบนแผนที่</div><div class="button-grid"><button class="btn btn-primary" id="moveOrderButton">กำหนดจุดหมายบนแผนที่</button><button class="btn btn-ghost" id="cancelMapActionButton">ยกเลิกโหมดคลิกแผนที่</button></div></div>` : '',
    !isEnemy && u.echelon !== 'company' ? `<div class="command-group"><h3>ภารกิจของหน่วยรอง</h3><div class="input-row"><input id="missionText" class="text-input" maxlength="70" placeholder="เช่น โอบแนวสะพานฝั่งเหนือ" /></div><div class="button-grid"><button class="btn btn-primary" id="assignMissionButton">มอบภารกิจให้หน่วยนี้</button></div></div>` : '',
    !isEnemy ? `<div class="command-group"><h3>สถานะการส่งคำสั่ง</h3><div class="muted">รอส่งถึงหน่วยรอง: <strong>${state.relays.filter(r=>r.kind==='order' && (r.originId===u.id || leafCompaniesOf(u.id).some(c=>c.id===r.targetId))).length}</strong> รายการ</div><div class="muted">การตอบรับจะเกิดเมื่อเวลาจำลองเดินถึงกำหนด</div></div>` : '',
    !isEnemy ? `<div class="command-group"><h3>คำขอสนับสนุน</h3><div class="button-grid"><button class="btn btn-secondary" data-support="supply">ขอรับเสบียง</button><button class="btn btn-secondary" data-support="medical">ขอกำลังแพทย์</button><button class="btn btn-secondary" data-support="comms">ขอสนับสนุนการสื่อสาร</button><button class="btn btn-secondary" data-support="intel">ขอข้อมูลข่าวกรอง</button></div></div>` : '',
    children.length ? `<div class="command-group"><h3>หน่วยรอง</h3>${children.map(c=>`<div class="unit-card"><div class="row"><strong>${c.name}</strong><button class="node-btn" data-select-unit="${c.id}">เลือก</button></div><div class="muted">${labelEchelon(c.echelon)} • ${c.objective || c.doctrine}</div></div>`).join('')}</div>` : ''
  ].join('');
  document.getElementById('commandPanel').innerHTML = html;

  document.querySelectorAll('[data-order]').forEach(btn=>btn.onclick=()=>issueOrder(u.id, btn.dataset.order));
  document.querySelectorAll('[data-support]').forEach(btn=>btn.onclick=()=>{createStaffRequest(u.id,btn.dataset.support);renderAll();});
  const moveBtn=document.getElementById('moveOrderButton'); if(moveBtn) moveBtn.onclick=()=>{ state.pendingMapAction={type:'move', unitId:u.id}; showToast('คลิกตำแหน่งบนแผนที่เพื่อเคลื่อนกำลัง'); setView('operations'); };
  const cancelBtn=document.getElementById('cancelMapActionButton'); if(cancelBtn) cancelBtn.onclick=()=>{ state.pendingMapAction=null; showToast('ยกเลิกโหมดคลิกแผนที่'); };
  const assignBtn=document.getElementById('assignMissionButton'); if(assignBtn) assignBtn.onclick=()=>assignMission(u.id, document.getElementById('missionText').value.trim());
  document.querySelectorAll('[data-select-unit]').forEach(btn=>btn.onclick=()=>selectUnit(btn.dataset.selectUnit));
}

function assignMission(unitId, text){ if(!text) return showToast('ใส่คำอธิบายภารกิจก่อน'); const u=getUnit(unitId); if(!u) return; u.objective = text; state.missions.unshift({ id:`m${++state.missionSerial}`, unitId, title:`ภารกิจใหม่: ${u.name}`, objective:text, priority:'กลาง', status:'กำลังดำเนินการ' }); logEvent('HQ', `มอบภารกิจให้ ${u.name}: ${text}`); renderAll(); showToast('มอบภารกิจแล้ว'); }

function labelEchelon(e){ return { army:'กองทัพ', division:'กองพล', battalion:'กองพัน', company:'กองร้อย' }[e] || e; }
function selectUnit(id){ state.selectedUnitId=id; renderCommandPanel(); renderSelectedSummary(); renderUnitProfile(); drawMap(); setView(state.activeView==='operations'||state.activeView==='command'?state.activeView:'command'); }

function issueOrder(unitId, order) {
  const u=getUnit(unitId); if(!u || u.side!=='ally') return;
  if(order==='REPORT') {
    queueReport(u.id); renderAll(); return;
  }
  queueCommand(unitId,order,{});
  renderAll(); showToast('ส่งคำสั่งแล้ว: รอผู้ใต้บังคับบัญชารับคำสั่ง');
}
function moveOrder(unitId,x,y){
  const u=getUnit(unitId); if(!u || u.side!=='ally') return;
  queueCommand(unitId,'MOVE',{x:clamp(x,0,980),y:clamp(y,0,560)});
  state.pendingMapAction = null; renderAll();
  showToast('ส่งคำสั่งเคลื่อนกำลังตามสายบังคับบัญชาแล้ว');
}
function radialOffsets(n,r){ const arr=[]; for(let i=0;i<n;i++){ const a=(Math.PI*2*i)/Math.max(1,n); arr.push({x:Math.cos(a)*r,y:Math.sin(a)*r}); } return arr; }

function simulateStep(dtMinutes) {
  state.absMinutes += dtMinutes;
  // clock
  state.timeMinutes += dtMinutes;
  while (state.timeMinutes >= 1440) { state.timeMinutes -= 1440; state.day += 1; logEvent('SYSTEM', `เริ่ม Day ${state.day}`); }

  World.updateWeather(state,rng);

  // economy drift
  if (rng() < 0.018 * dtMinutes) {
    state.economy.budget = clamp(state.economy.budget + rand(-6,8), 120, 1300);
    state.economy.industry = clamp(state.economy.industry + rand(-1,2), 20, 100);
    state.economy.supplies = clamp(state.economy.supplies + rand(-1,2), 20, 100);
  }

  // Unit movements, maintenance, fatigue and availability follow terrain and personnel state.
  for(const u of friendlyCompanies()) {
    const officer=commanderForUnit(u);
    if(u.order==='DELEGATE' && state.absMinutes >= (u.nextAiDecision||0)) {
      const decision=C2.assessDelegation(state,u,officer);
      if(decision.kind==='rest'){
        u.order='REST';u.objective='พักและฟื้นฟูตามการประเมินของผู้บังคับบัญชารอง';
      } else {
        u.objective='บริหารงานประจำหน่วยภายใต้อำนาจที่ได้รับ';
      }
      u.statusCause=decision.why;
      C2.note(state,`${u.name}: ${decision.why}`);
      u.nextAiDecision=state.absMinutes+12+(officer?.c2Traits?.planning||60)*.14;
    }
    World.updateUnit(u,dtMinutes,state,rng);
  }

  // Persistent, goal-driven fictional opponent simulation. Goals are not exposed via live intel.
  Opponent.update(state);
  for(const u of enemyCompanies()) {
    World.updateUnit(u,dtMinutes,state,rng);
  }

  // contact simulation
  friendlyCompanies().forEach(a => {
    enemyCompanies().forEach(b => {
      const d = distance(a.x,a.y,b.x,b.y);
      if (d < 48) {
        const allyPower = a.readiness*0.45 + a.morale*0.30 + a.supply*0.25 + a.training*26;
        const enemyPower = b.readiness*0.45 + b.morale*0.30 + b.supply*0.25 + b.training*26;
        if (rng() < 0.03 * dtMinutes) {
          World.applyCasualty(a,Math.max(1,Math.round(enemyPower/55)));
          World.applyCasualty(b,Math.max(1,Math.round(allyPower/55)));
          a.readiness = clamp(a.readiness - 0.4, 0, 100); b.readiness = clamp(b.readiness - 0.4, 0, 100);
          a.morale = clamp(a.morale - 0.2 + (allyPower>enemyPower?0.25:0), 0, 100);
          b.morale = clamp(b.morale - 0.2 + (enemyPower>allyPower?0.25:0), 0, 100);
          if (rng() < 0.18) logEvent('CONTACT', `${a.name} ปะทะ ${b.name} บริเวณแนวหน้า`);
        }
      }
    });
  });

  // staff drift based on economy
  state.staff.logistics = clamp(state.staff.logistics + (state.economy.supplies - 60) * 0.002 - 0.004, 20, 100);
  state.staff.communications = clamp(state.staff.communications + (rng()-0.5)*0.08, 20, 100);
  state.staff.medical = clamp(state.staff.medical + (rng()-0.5)*0.04, 20, 100);
  state.staff.intelligence = clamp(state.staff.intelligence + (rng()-0.5)*0.06, 20, 100);
  state.enemyPressure = clamp(Math.round(enemyCompanies().reduce((s,u)=>s+u.readiness,0)/Math.max(1,enemyCompanies().length) - 15 + rng()*12), 15, 90);
  simulateSystems(dtMinutes);
  Sustain.update(state,dtMinutes);

  if (rng() < 0.02 * dtMinutes) {
    const candidates = ['S2 รายงานความเคลื่อนไหวใหม่ทางปีกขวา','S4 ขอเพิ่มงบเสบียงให้กองพลหน้า','แนวหน้าแจ้ง fatigue สะสมในหน่วยปะทะ','รัฐบาลสนับสนุนงบซ่อมบำรุงเพิ่ม'];
    const sources = ['S2','S4','FRONT','NATION'];
    const i = Math.floor(rng()*candidates.length); logEvent(sources[i], candidates[i]);
  }
}
function rand(min,max){ return Math.floor(rng()*(max-min+1))+min; }
function rng(){let v=(state.rngSeed>>>0)||68371;v^=v<<13;v^=v>>>17;v^=v<<5;state.rngSeed=v>>>0;return state.rngSeed/4294967296;}
function moveTowards(u,tx,ty,step){ const dx=tx-u.x, dy=ty-u.y; const d=Math.hypot(dx,dy); if(d<=step||d===0){ u.x=tx; u.y=ty; return; } u.x += (dx/d)*step; u.y += (dy/d)*step; }
function distance(x1,y1,x2,y2){ return Math.hypot(x2-x1,y2-y1); }

function renderCommandTree(){
  const root=getUnit('army');
  document.getElementById('commandTree').innerHTML = renderNode(root);
  document.querySelectorAll('.node-btn').forEach(btn=>btn.onclick=()=>selectUnit(btn.dataset.id || btn.dataset.selectUnit));
}
function renderNode(u){ const agg=aggregateOf(u.id); const children=u.children.map(getUnit).filter(Boolean);
  return `<div class="tree-node"><div class="node-header"><div><div class="node-title">${u.name}</div><div class="node-meta">${labelEchelon(u.echelon)} • ${u.commander||'AI'} • ${agg.strength||u.strength} นาย</div></div><div class="node-actions"><button class="node-btn" data-select-unit="${u.id}">เลือก</button></div></div>${children.length?children.map(renderNode).join(''):''}</div>`;
}

function renderUnitProfile(){
  const u=getSelectedUnit(); if(!u) return; const agg = aggregateOf(u.id); const report=state.reports?.[u.id];
  const commander = commanderForUnit(u);
  const portrait = commander ? `<div class="portrait-frame large">${renderCommanderPortraitSVG(commander, 220, 260)}</div>` : '';
  const commanderBlock = commander ? `<div class="commander-inline">${portrait}<div class="commander-inline-info"><div class="eyebrow">ผู้บังคับบัญชา</div><h3>${escapeHtml(commander.name)}</h3><div class="muted">${escapeHtml(commander.rank)} • ${escapeHtml(commander.role)}</div><button class="btn btn-ghost small-btn" data-open-commander="${commander.id}">เปิดหน้าแต่งโปรไฟล์</button></div></div>` : `<div class="helper-note">ยังไม่มีข้อมูลผู้บังคับบัญชาของหน่วยนี้</div>`;
  document.getElementById('unitProfile').innerHTML = `<div class="profile-card"><h3>${escapeHtml(u.name)}</h3><div class="muted">${labelEchelon(u.echelon)} • ${u.side==='ally'?'ฝ่ายเรา':'ฝ่ายตรงข้าม'}</div>${u.side==='ally' ? commanderBlock : ''}<div class="subgrid" style="margin-top:10px"><div class="small-box"><h4>ผู้บังคับบัญชา</h4><div>${escapeHtml(commanderNameForUnit(u))}</div></div><div class="small-box"><h4>คำสั่งปัจจุบัน</h4><div>${escapeHtml(u.order || '-')}</div></div><div class="small-box"><h4>ภารกิจ / หลักนิยม</h4><div>${escapeHtml(u.objective || u.doctrine)}</div></div><div class="small-box"><h4>หน่วงเวลาคำสั่ง</h4><div>${u.commandDelay} นาที</div></div></div>${u.side==='ally'?`${barRow('Readiness',agg.readiness)}${barRow('Supply',agg.supply)}${barRow('Morale',agg.morale)}${barRow('Fatigue',agg.fatigue,true)}`:'<div class="muted" style="margin-top:10px">ข้อมูลศัตรูเป็นค่าประเมิน ไม่รับประกันความถูกต้องเต็ม 100%</div>'}${report?`<div class="report-received"><strong>รายงานจากหน่วยรองที่ได้รับล่าสุด</strong><div>ข้อมูลย้อนหลัง ${Math.round(state.absMinutes-report.at)} นาที • ได้รับหลังส่งคำขอ ${Math.round(report.receivedAt-report.at)} นาที • ความเชื่อมั่น ${report.confidence ?? 65}%</div><div>กำลังพล ${report.strength} • ความพร้อม ${report.readiness}% • เสบียง ${report.supply}%</div></div>`:'<div class="helper-note" style="margin-top:12px">ยังไม่มีรายงานที่ร้องขอจากหน่วยนี้</div>'}</div>`;
  document.querySelectorAll('[data-open-commander]').forEach(btn => btn.onclick = ()=> openCommanderProfile(btn.dataset.openCommander));
}

function renderStaff(){
  const groups = [
    { title:'S1 บุคลากร / การแพทย์', score: Math.round((state.staff.medical + (state.staff.replacementPool/10))/2), desc:'กำลังพลทดแทน การดูแลผู้บาดเจ็บ และการหมุนเวียนกำลัง', items:[['Replacement Pool', `${state.staff.replacementPool} นาย`],['Medical Capacity', `${Math.round(state.staff.medical)}%`],['Fatigue Avg', `${aggregateOf('army').fatigue}%`],['Morale Avg', `${aggregateOf('army').morale}%`]]},
    { title:'S2 ข่าวกรอง', score: state.staff.intelligence, desc:'ตรวจจับการเคลื่อนไหวของข้าศึกและประเมินภัยคุกคาม', items:[['Intel Quality', `${Math.round(state.staff.intelligence)}%`],['Enemy Pressure', `${state.enemyPressure}%`],['Fog of War', 'เปิดใช้งาน'],['Last Estimate', enemyCompanies()[0] ? 'ปรับปรุงล่าสุด' : '-']]},
    { title:'S3 ปฏิบัติการ', score: state.staff.operations, desc:'ควบคุมภารกิจและจังหวะการปฏิบัติการของทุกกองพล', items:[['Open Missions', state.missions.length],['Active Orders', friendlyCompanies().filter(u=>u.order==='MOVE').length],['HQ Posture', 'Balanced'],['Weather', state.weather]]},
    { title:'S4 ส่งกำลังบำรุง', score: state.staff.logistics, desc:'เสบียง เชื้อเพลิง และการคงความพร้อมของแนวหน้า', items:[['Logistics', `${Math.round(state.staff.logistics)}%`],['Supplies Stock', `${state.economy.supplies}%`],['Fuel', `${state.economy.fuel}%`],['Field Supply Avg', `${aggregateOf('army').supply}%`]]},
    { title:'S6 การสื่อสาร', score: state.staff.communications, desc:'ผลโดยตรงต่อความเร็วของคำสั่งในสายการบังคับบัญชา', items:[['Communications', `${Math.round(state.staff.communications)}%`],['Avg Order Delay', `${Math.round(friendlyCompanies().reduce((s,u)=>s+u.commandDelay,0)/friendlyCompanies().length)} นาที`],['Network Status', state.staff.communications>60?'Stable':'Degraded'],['Relay Nodes', 10]]},
    { title:'การซ่อมบำรุงและระบบสนับสนุน', score: Math.round((state.economy.industry + state.economy.supplies)/2), desc:'เชื่อมหลังบ้านของประเทศสู่ประสิทธิภาพหน่วยในสนาม', items:[['Industry', `${state.economy.industry}%`],['Budget', state.economy.budget],['Public Support', `${state.economy.publicSupport}%`],['Readiness Avg', `${aggregateOf('army').readiness}%`]]},
  ];
  document.getElementById('staffGrid').innerHTML = groups.map(g=>`<section class="panel staff-card"><div class="panel-head"><div><h2>${g.title}</h2><p>${g.desc}</p></div><span class="tag">${Math.round(g.score)}%</span></div>${barRow('Performance',g.score)}<div class="staff-items">${g.items.map(([k,v])=>`<div class="small-box"><h4>${k}</h4><div>${v}</div></div>`).join('')}</div></section>`).join('');
}

function renderNation(){
  document.getElementById('nationBoard').innerHTML = `<div class="nation-card"><h3>สถานะทรัพยากรของประเทศ</h3>${barRow('Budget',Math.min(100, Math.round(state.economy.budget/10)))}${barRow('Industry',state.economy.industry)}${barRow('Fuel',state.economy.fuel)}${barRow('Supplies',state.economy.supplies)}${barRow('Public Support',state.economy.publicSupport)}</div><div class="nation-card"><h3>สรุปผลเชิงนโยบาย</h3><p class="muted">การปรับนโยบายจะส่งผลทันทีในโลกจำลอง เช่น งบประมาณเพิ่ม = logistics ดีขึ้น แต่ public support อาจแกว่ง</p></div>`;
  const buttons = [
    ['เพิ่มงบส่งกำลังบำรุง','budget-logistics'],
    ['เร่งการผลิตอุตสาหกรรม','boost-industry'],
    ['เพิ่มการประชาสัมพันธ์','boost-support'],
    ['โอนงบไปด้านข่าวกรอง','boost-intel']
  ];
  document.getElementById('policyActions').innerHTML = buttons.map(([txt,key])=>`<button class="btn btn-secondary full" data-policy="${key}">${txt}</button>`).join('');
  document.querySelectorAll('[data-policy]').forEach(btn=>btn.onclick=()=>applyPolicy(btn.dataset.policy));
}
function applyPolicy(key){
  const cost={ 'budget-logistics':35, 'boost-industry':28, 'boost-support':20, 'boost-intel':24 }[key];
  if(!cost || state.economy.budget<cost){showToast('งบประมาณไม่พอสำหรับนโยบายนี้');return;}
  if(key==='budget-logistics'){ state.economy.budget=clamp(state.economy.budget-35,0,1300); state.staff.logistics=clamp(state.staff.logistics+4,0,100); state.economy.supplies=clamp(state.economy.supplies+3,0,100); logEvent('NATION','อนุมัติงบเพิ่มให้สายส่งกำลังบำรุง'); }
  if(key==='boost-industry'){ state.economy.budget=clamp(state.economy.budget-28,0,1300); state.economy.industry=clamp(state.economy.industry+5,0,100); state.economy.publicSupport=clamp(state.economy.publicSupport-1,0,100); logEvent('NATION','เร่งกำลังการผลิตอุตสาหกรรมสงคราม'); }
  if(key==='boost-support'){ state.economy.budget=clamp(state.economy.budget-20,0,1300); state.economy.publicSupport=clamp(state.economy.publicSupport+5,0,100); logEvent('NATION','ดำเนินมาตรการประชาสัมพันธ์และเสริมความเชื่อมั่นประชาชน'); }
  if(key==='boost-intel'){ state.economy.budget=clamp(state.economy.budget-24,0,1300); state.staff.intelligence=clamp(state.staff.intelligence+6,0,100); state.staff.communications=clamp(state.staff.communications+2,0,100); logEvent('NATION','จัดสรรงบเพิ่มเติมให้ข่าวกรองและสื่อสาร'); }
  renderAll(); showToast('ปรับนโยบายแล้ว');
}

function renderReports(){
  const agg = aggregateOf('army');
  document.getElementById('aarPanel').innerHTML = `<div class="profile-card"><h3>Operational Assessment</h3><div class="muted">สรุปเชิงระบบของรอบเวลาปัจจุบัน</div><div class="subgrid" style="margin-top:10px"><div class="small-box"><h4>Readiness</h4><div>${agg.readiness}%</div></div><div class="small-box"><h4>Supply</h4><div>${agg.supply}%</div></div><div class="small-box"><h4>Open Missions</h4><div>${state.missions.length}</div></div><div class="small-box"><h4>Event Count</h4><div>${state.events.length}</div></div><div class="small-box"><h4>ภารกิจเสร็จสิ้น</h4><div>${state.missions.filter(m=>m.status==='completed').length}/${state.missions.length}</div></div><div class="small-box"><h4>ขนส่งสำเร็จ</h4><div>${state.requests.filter(r=>r.status==='delivered').length}/${state.requests.length}</div></div></div><p class="muted" style="margin-top:12px">ข้อสังเกต: ระบบนี้เป็นแบบจำลองโลกสมมติสำหรับเกม ไม่ใช่แบบจำลองทางทหารที่ผ่านการตรวจสอบความเที่ยงตรงเพื่อการใช้งานจริง</p></div>`;
  document.getElementById('allEvents').innerHTML = state.events.map(renderEvent).join('');
}
function renderEvent(e){ return `<div class="event-card"><div class="event-time">${escapeHtml(e.stamp)}<br><span class="muted">${escapeHtml(e.source)}</span></div><div>${escapeHtml(e.message)}</div></div>`; }
function renderEventLists(){ document.getElementById('liveEvents').innerHTML = state.events.slice(0,8).map(renderEvent).join(''); }

function renderIntelFeed(){
  const contacts=Object.values(state.intelContacts||{}).filter(c=>c.confidence>10).sort((a,b)=>b.confidence-a.confidence);
  document.getElementById('intelFeed').innerHTML = contacts.length ? contacts.map(c=>`<div class="intel-card"><div class="row"><strong>${escapeHtml(c.name)}</strong><span class="badge enemy">ESTIMATE</span></div><div class="muted">ตำแหน่งประมาณ: ${Math.round(c.x)}, ${Math.round(c.y)}</div><div class="muted">ความเชื่อมั่น: ${Math.round(c.confidence)}% • รายงาน ${Math.round(state.absMinutes-c.seenAt)} นาทีที่แล้ว</div></div>`).join('') : '<div class="helper-note">ยังไม่มีข้อมูลที่ยืนยันได้จากการตรวจพบ</div>';
}
function renderSelectedSummary(){
  const u=getSelectedUnit(); if(!u) return; const agg=aggregateOf(u.id); const commander = commanderForUnit(u);
  const portrait = commander ? `<div class="portrait-frame small">${renderCommanderPortraitSVG(commander, 110, 128)}</div>` : '';
  document.getElementById('selectedSummary').innerHTML = `<div class="unit-card">${portrait}<div class="row"><strong>${escapeHtml(u.name)}</strong><span class="badge ${u.side==='ally'?'ally':'enemy'}">${u.side==='ally'?'ALLY':'ENEMY'}</span></div><div class="muted">${labelEchelon(u.echelon)} • ${escapeHtml(commanderNameForUnit(u)||'AI')}</div>${commander ? `<div class="muted">${escapeHtml(commander.rank)} • ${escapeHtml(commander.role)}</div>`:''}<div class="row"><span>Order</span><strong>${escapeHtml(u.order||'-')}</strong></div>${u.side==='ally'?`${barRow('Readiness',agg.readiness)}${barRow('Supply',agg.supply)}`:'<div class="muted" style="margin-top:8px">ข้อมูลข้าศึกเป็นค่าประเมิน</div>'}${commander ? `<button class="btn btn-ghost full small-btn" data-open-commander="${commander.id}">แต่ง ผบช.</button>`:''}</div>`;
  document.querySelectorAll('[data-open-commander]').forEach(btn => btn.onclick = ()=> openCommanderProfile(btn.dataset.openCommander));
}


function openCommanderProfile(id) {
  if (!state.commanders.find(c=>c.id===id)) return;
  state.selectedCommanderId = id;
  setView('commanders');
  renderCommanders();
}

function renderCommanders() {
  const roster = document.getElementById('commanderRoster');
  const studio = document.getElementById('commanderStudio');
  if (!roster || !studio) return;
  roster.innerHTML = state.commanders.map(c => {
    const active = c.id === state.selectedCommanderId ? ' active' : '';
    const unit = getUnit(c.assignedUnitId);
    return `<button class="commander-card${active}" data-select-commander="${c.id}"><div class="portrait-frame thumb">${renderCommanderPortraitSVG(c, 92, 110)}</div><div class="commander-card-body"><strong>${escapeHtml(c.name)}</strong><div class="muted">${escapeHtml(c.rank)} • ${escapeHtml(c.role)}</div><div class="muted">${escapeHtml(unit?.name || 'Unassigned')}</div></div></button>`;
  }).join('');
  const c = commanderById(state.selectedCommanderId) || state.commanders[0];
  if (!c) { studio.innerHTML = '<div class="helper-note">ไม่พบข้อมูล ผบช.</div>'; return; }
  state.selectedCommanderId = c.id;
  const unit = getUnit(c.assignedUnitId);
  studio.innerHTML = `<div class="commander-editor"><div class="commander-preview-column"><div class="portrait-frame hero">${renderCommanderPortraitSVG(c, 260, 320)}</div><div class="commander-bio"><div class="eyebrow">Assigned Unit</div><h3>${escapeHtml(c.name)}</h3><div class="muted">${escapeHtml(c.rank)} • ${escapeHtml(c.role)}</div><div class="muted">${escapeHtml(unit?.name || 'Unassigned')}</div><div class="button-line"><button id="randomizeCommander" class="btn btn-secondary small-btn">สุ่มหน้าตา</button><button id="syncCommanderName" class="btn btn-ghost small-btn">อัปเดตทั้งระบบ</button></div></div></div><div class="commander-fields"><div class="subgrid"><label>ชื่อผู้บังคับบัญชา<input id="commanderNameInput" class="text-input" maxlength="36" value="${escapeAttr(c.name)}" /></label><label>ยศ<input id="commanderRankInput" class="text-input" maxlength="12" value="${escapeAttr(c.rank)}" /></label></div><label>ตำแหน่ง/บทบาท<input id="commanderRoleInput" class="text-input" maxlength="40" value="${escapeAttr(c.role)}" /></label><div class="subgrid"><label>โทนผิว<select id="commanderFaceTone" class="text-input">${optionTags(['fair','light','medium','tan','deep'], c.faceTone)}</select></label><label>ช่วงอายุ<select id="commanderAgeBand" class="text-input">${optionTags(['young','mid','senior'], c.ageBand)}</select></label></div><div class="subgrid"><label>ทรงผม<select id="commanderHairStyle" class="text-input">${optionTags(['short','sidepart','buzz','crew','wavy'], c.hairStyle)}</select></label><label>สีผม<select id="commanderHairColor" class="text-input">${optionTags(['black','darkbrown','brown','darkgray'], c.hairColor)}</select></label></div><div class="subgrid"><label>คิ้ว<select id="commanderEyebrow" class="text-input">${optionTags(['normal','thick','arched'], c.eyebrow)}</select></label><label>สีตา<select id="commanderEyeColor" class="text-input">${optionTags(['brown','darkbrown','hazel','gray'], c.eyeColor)}</select></label></div><div class="subgrid"><label>หนวด/เครา<select id="commanderFacialHair" class="text-input">${optionTags(['none','stubble','mustache','trimbeard'], c.facialHair)}</select></label><label>รอยแผล<select id="commanderScar" class="text-input">${optionTags(['none','brow','cheek'], c.scar)}</select></label></div><div class="subgrid"><label>เครื่องแบบ<select id="commanderUniform" class="text-input">${optionTags(['olive','service','field','desert'], c.uniform)}</select></label><label>หมวก/ศีรษะ<select id="commanderHeadgear" class="text-input">${optionTags(['none','beret','servicecap','patrolcap'], c.headgear)}</select></label></div><div class="subgrid"><label>อุปกรณ์เสริม<select id="commanderAccessory" class="text-input">${optionTags(['none','earpiece','ribbon','glasses'], c.accessory)}</select></label><label>พื้นหลัง<select id="commanderBackground" class="text-input">${optionTags(['studioGreen','hqDark','flagOlive','mapRoom'], c.background)}</select></label></div><label>รูปแบบการบริหารหน่วย<select id="commanderStyle" class="text-input">${optionTags(['balanced','cautious','independent'],c.commandStyle||'balanced')}</select></label><div class="helper-note">รูปแบบการบริหารหน่วยมีผลต่อการประเมินสถานะเมื่อมอบอำนาจ AI; ภาพ ผบช. เป็นภาพ SVG ในเกม ไม่ใช่รูปถ่ายจริง</div></div></div>`;

  roster.querySelectorAll('[data-select-commander]').forEach(btn=>btn.onclick=()=>{state.selectedCommanderId=btn.dataset.selectCommander; renderCommanders();});
  ['commanderNameInput','commanderRankInput','commanderRoleInput','commanderFaceTone','commanderAgeBand','commanderHairStyle','commanderHairColor','commanderEyebrow','commanderEyeColor','commanderFacialHair','commanderScar','commanderUniform','commanderHeadgear','commanderAccessory','commanderBackground','commanderStyle'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    if (['commanderNameInput','commanderRankInput','commanderRoleInput'].includes(id)) {
      el.onchange = el.onblur = () => updateSelectedCommanderFromEditor();
    } else {
      el.onchange = () => updateSelectedCommanderFromEditor();
    }
  });
  const randBtn = document.getElementById('randomizeCommander'); if (randBtn) randBtn.onclick = ()=> randomizeSelectedCommander();
  const syncBtn = document.getElementById('syncCommanderName'); if (syncBtn) syncBtn.onclick = ()=> { applyCommanderLinks(); renderAll(); showToast('อัปเดตชื่อและรูปโปรไฟล์ของ ผบช. แล้ว'); };
}

function optionTags(list, current) {
  const labels = {
    fair:'ขาวมาก', light:'ขาวเหลือง', medium:'ผิวกลาง', tan:'สองสี', deep:'เข้ม',
    young:'หนุ่ม', mid:'วัยกลางคน', senior:'อาวุโส',
    short:'สั้นทหาร', sidepart:'แสกข้าง', buzz:'เกรียนสั้น', crew:'crew cut', wavy:'หยักศก',
    black:'ดำ', darkbrown:'น้ำตาลเข้ม', brown:'น้ำตาล', darkgray:'เทาเข้ม',
    normal:'ปกติ', thick:'หนา', arched:'โก่ง',
    brown:'น้ำตาล', hazel:'เฮเซล', gray:'เทา', darkbrown:'น้ำตาลเข้ม',
    none:'ไม่มี', stubble:'เคราครึ้มบาง', mustache:'หนวด', trimbeard:'เคราตัดแต่ง',
    brow:'เหนือคิ้ว', cheek:'แก้ม',
    olive:'คอมแบทเขียว', service:'ชุดพิธีการ', field:'สนามเข้ม', desert:'ทะเลทราย',
    beret:'เบเรต์', servicecap:'หมวกพิธีการ', patrolcap:'หมวกสนาม',
    earpiece:'หูฟังสื่อสาร', ribbon:'แพรแถบ', glasses:'แว่น',
    balanced:'สมดุล',cautious:'รอบคอบ',independent:'ยืดหยุ่น',
    studioGreen:'ฉากสตูดิโอ', hqDark:'ศูนย์บัญชาการ', flagOlive:'ธงโอลีฟ', mapRoom:'ห้องแผนที่'
  };
  return list.map(v => `<option value="${v}" ${v===current?'selected':''}>${labels[v] || v}</option>`).join('');
}

function updateSelectedCommanderFromEditor() {
  const c = commanderById(state.selectedCommanderId); if (!c) return;
  const map = {
    name:'commanderNameInput', rank:'commanderRankInput', role:'commanderRoleInput', faceTone:'commanderFaceTone', ageBand:'commanderAgeBand', hairStyle:'commanderHairStyle', hairColor:'commanderHairColor', eyebrow:'commanderEyebrow', eyeColor:'commanderEyeColor', facialHair:'commanderFacialHair', scar:'commanderScar', uniform:'commanderUniform', headgear:'commanderHeadgear', accessory:'commanderAccessory', background:'commanderBackground', commandStyle:'commanderStyle'
  };
  Object.entries(map).forEach(([k,id]) => { const el=document.getElementById(id); if (el) c[k] = String(el.value || '').trim() || c[k]; });
  applyCommanderLinks();
  renderAll();
  setView('commanders');
}

function randomizeSelectedCommander() {
  const c = commanderById(state.selectedCommanderId); if (!c) return;
  const next = randomCommanderProfile(c.id, c.name, c.rank, Math.floor(rng()*1000));
  Object.assign(c, next, { id:c.id, name:c.name, rank:c.rank, role:c.role, assignedUnitId:c.assignedUnitId });
  applyCommanderLinks();
  renderAll();
  setView('commanders');
  showToast('สุ่มภาพ ผบช. ใหม่แล้ว');
}

function renderCommanderPortraitSVG(c, width=180, height=220) {
  const palettes = {
    face:{fair:'#f3d3bb', light:'#e7bf9f', medium:'#d5a47d', tan:'#b97f59', deep:'#8c593f'},
    shadow:{fair:'#ddb89f', light:'#d2a884', medium:'#bc8b65', tan:'#a46e4e', deep:'#72462f'},
    hair:{black:'#161819', darkbrown:'#3b2a22', brown:'#6a4730', darkgray:'#58595e'},
    eyes:{brown:'#5b3b28', darkbrown:'#372117', hazel:'#78643c', gray:'#6f7882'},
    uniform:{olive:['#516744','#3a4a31'], service:['#43585d','#2d383c'], field:['#4b5e41','#33412c'], desert:['#9f8a62','#786344']},
    bg:{studioGreen:['#253226','#334834'], hqDark:['#1a2023','#2e353a'], flagOlive:['#42553a','#6f855e'], mapRoom:['#3d3426','#5b4f3c']}
  };
  const face = palettes.face[c.faceTone] || palettes.face.medium;
  const shadow = palettes.shadow[c.faceTone] || palettes.shadow.medium;
  const hair = palettes.hair[c.hairColor] || palettes.hair.black;
  const eye = palettes.eyes[c.eyeColor] || palettes.eyes.brown;
  const [u1,u2] = palettes.uniform[c.uniform] || palettes.uniform.olive;
  const [b1,b2] = palettes.bg[c.background] || palettes.bg.studioGreen;
  const ageLine = c.ageBand==='senior' ? '<path d="M94 117c10 4 21 4 32 0" stroke="#8d6d57" stroke-width="1.4" fill="none" opacity="0.55" />' : c.ageBand==='mid' ? '<path d="M98 118c8 3 16 3 24 0" stroke="#98745f" stroke-width="1.1" fill="none" opacity="0.4" />' : '';
  const accessory = c.accessory==='glasses' ? '<rect x="77" y="88" width="22" height="14" rx="5" fill="none" stroke="#2d312d" stroke-width="2"/><rect x="105" y="88" width="22" height="14" rx="5" fill="none" stroke="#2d312d" stroke-width="2"/><line x1="99" y1="95" x2="105" y2="95" stroke="#2d312d" stroke-width="2"/>' : c.accessory==='earpiece' ? '<path d="M142 100c6 2 10 7 10 14" stroke="#111" stroke-width="2" fill="none"/><circle cx="141" cy="98" r="3" fill="#222" />' : c.accessory==='ribbon' ? '<rect x="90" y="176" width="24" height="10" rx="2" fill="#816a1f"/><rect x="116" y="176" width="24" height="10" rx="2" fill="#64551c"/>' : '';
  const scar = c.scar==='brow' ? '<path d="M103 78l-5 13" stroke="#b97d71" stroke-width="1.6" stroke-linecap="round" />' : c.scar==='cheek' ? '<path d="M125 113l-9 16" stroke="#b97d71" stroke-width="1.4" stroke-linecap="round" />' : '';
  const headgear = headgearSVG(c.headgear, hair, u1);
  const hairShape = hairSVG(c.hairStyle, hair);
  const brow = c.eyebrow==='thick' ? 3.4 : c.eyebrow==='arched' ? 2 : 2.6;
  const beard = facialHairSVG(c.facialHair, hair, shadow);
  return `<svg viewBox="0 0 200 240" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Commander portrait"><defs><linearGradient id="bg-${c.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${b1}"/><stop offset="100%" stop-color="${b2}"/></linearGradient><linearGradient id="uni-${c.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${u1}"/><stop offset="100%" stop-color="${u2}"/></linearGradient><radialGradient id="face-${c.id}" cx="52%" cy="40%" r="60%"><stop offset="0%" stop-color="${face}"/><stop offset="100%" stop-color="${shadow}"/></radialGradient></defs><rect width="200" height="240" rx="18" fill="url(#bg-${c.id})"/><g opacity="0.18"><path d="M12 25h176M12 55h176M12 85h176M12 115h176M12 145h176M12 175h176M12 205h176" stroke="#dce1d0"/><path d="M35 10v220M75 10v220M115 10v220M155 10v220" stroke="#dce1d0"/></g><ellipse cx="100" cy="226" rx="58" ry="15" fill="rgba(0,0,0,.18)"/><path d="M42 228c8-36 24-52 57-54 36-2 55 16 59 54" fill="url(#uni-${c.id})"/><path d="M71 191c8 10 18 15 29 15 12 0 22-5 30-15l-11-18H83z" fill="#d9d3c7" opacity="0.86"/><path d="M83 173l17 22 19-22" fill="#2a2c2a" opacity="0.75"/><ellipse cx="100" cy="107" rx="43" ry="54" fill="url(#face-${c.id})"/>
    <path d="M75 109c6 18 17 28 25 28 10 0 20-10 26-28" fill="rgba(0,0,0,.04)"/>
    ${headgear}${hairShape}
    <ellipse cx="81" cy="98" rx="9" ry="11" fill="#fff" opacity="0.18"/>
    <ellipse cx="119" cy="98" rx="9" ry="11" fill="#fff" opacity="0.18"/>
    <path d="M72 85c8-4 16-4 22 1" stroke="${hair}" stroke-width="${brow}" stroke-linecap="round" fill="none"/>
    <path d="M107 86c6-5 14-5 22-1" stroke="${hair}" stroke-width="${brow}" stroke-linecap="round" fill="none"/>
    <ellipse cx="82" cy="97" rx="5" ry="6" fill="${eye}"/><ellipse cx="118" cy="97" rx="5" ry="6" fill="${eye}"/><circle cx="83" cy="96" r="1.5" fill="#fff" opacity=".75"/><circle cx="119" cy="96" r="1.5" fill="#fff" opacity=".75"/>
    <path d="M100 100c-2 6-4 14-3 22 2 3 5 4 8 4" stroke="#8d6955" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M85 130c7 5 22 5 31-1" stroke="#7a4f45" stroke-width="2.1" fill="none" stroke-linecap="round"/>
    ${beard}${ageLine}${accessory}${scar}
    <path d="M70 61c-8 12-11 23-11 33" stroke="rgba(255,255,255,.06)" stroke-width="2" fill="none"/><path d="M131 61c8 12 11 23 11 33" stroke="rgba(255,255,255,.06)" stroke-width="2" fill="none"/>
  </svg>`;
}

function hairSVG(style, color) {
  const styles = {
    short:`<path d="M58 84c2-29 20-45 42-45 26 0 44 17 45 47-9-10-23-18-45-18-17 0-32 5-42 16z" fill="${color}"/>`,
    sidepart:`<path d="M56 86c3-31 21-49 47-49 22 0 39 14 44 44-14-7-25-10-37-9-8 1-17 3-27 7l-11 7z" fill="${color}"/><path d="M100 40c4 14 2 30-3 38" stroke="rgba(255,255,255,.18)" stroke-width="2"/>`,
    buzz:`<path d="M62 79c6-22 22-35 39-35 20 0 34 12 39 34-12-8-26-12-39-12s-27 4-39 13z" fill="${color}"/>`,
    crew:`<path d="M57 84c7-25 21-40 44-40 21 0 36 14 43 41-13-7-28-10-43-10-15 0-29 3-44 9z" fill="${color}"/><path d="M84 48c-7 5-14 13-18 24" stroke="rgba(255,255,255,.12)" stroke-width="1.7"/>`,
    wavy:`<path d="M56 87c1-31 23-48 46-48 24 0 43 18 43 49-7-8-12-10-18-11-4-9-11-15-20-16-12-1-24 4-32 14-9 0-15 3-19 12z" fill="${color}"/>`
  };
  return styles[style] || styles.short;
}
function headgearSVG(type, hair, uniform) {
  if (type==='beret') return `<path d="M56 72c14-20 46-28 73-13 8 4 16 12 17 23-16-1-28 0-41 6-18-6-31-7-49-2-2-5-2-9 0-14z" fill="#6b2a2f"/><circle cx="130" cy="74" r="7" fill="#cfbf75"/>`;
  if (type==='servicecap') return `<path d="M58 72c7-18 24-30 42-30 21 0 38 12 44 30" fill="${uniform}"/><rect x="58" y="71" width="86" height="12" rx="6" fill="#232826"/><rect x="92" y="62" width="16" height="10" rx="2" fill="#c8b56d"/>`;
  if (type==='patrolcap') return `<path d="M60 72c8-17 22-26 40-26 17 0 32 7 40 22l-7 13H67z" fill="${uniform}"/><path d="M81 85h41c-5 9-14 12-21 12-8 0-15-4-20-12z" fill="#2d352d"/>`;
  return '';
}
function facialHairSVG(type, color, shadow) {
  if (type==='mustache') return `<path d="M88 126c4 3 8 4 12 4 4 0 8-1 12-4 2 4 0 9-5 11-4 2-10 2-14 0-5-2-7-7-5-11z" fill="${color}" opacity="0.9"/>`;
  if (type==='stubble') return `<path d="M79 132c11 11 32 11 43 0" stroke="${shadow}" stroke-width="8" opacity="0.22" stroke-linecap="round"/>`;
  if (type==='trimbeard') return `<path d="M82 130c6 10 12 16 18 18 8 2 15-1 23-18" fill="${color}" opacity="0.88"/>`;
  return '';
}

function drawMap() {
  const canvas = document.getElementById('battlefield'); const ctx = canvas.getContext('2d');
  const zoom = state.map.zoom;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.scale(zoom, zoom);
  ctx.translate(state.map.offsetX, state.map.offsetY);
  // Schematic, scenario-specific map and passability are produced by the same terrain model.
  Theaters.draw(ctx);
  // Terrain grid represents passability and speed; river crossings are narrow.
  if(state.selectedLayer==='mobility') {
    ctx.save();
    for(let y=0;y<MAP.h;y+=20)for(let x=0;x<MAP.w;x+=20){
      const kind=World.terrainAt(x+10,y+10);
      ctx.fillStyle={river:'rgba(37,92,152,.72)',road:'rgba(211,183,90,.52)',plain:'rgba(116,161,98,.10)',hill:'rgba(235,138,84,.33)',forest:'rgba(32,72,40,.47)',urban:'rgba(181,180,193,.33)',beach:'rgba(222,192,121,.25)',field:'rgba(189,197,98,.20)',water:'rgba(37,92,152,.72)'}[kind]||'transparent';
      ctx.fillRect(x+.5,y+.5,19,19);
    }
    ctx.restore();
  }
  // Landmarks and roads already rendered by Theaters.draw.
  // supply layer overlay
  if (state.selectedLayer==='supply') {
    ctx.fillStyle='rgba(210,182,90,.10)'; [[460,240,180,140],[540,260,150,120],[650,110,140,100]].forEach(([x,y,w,h])=>ctx.fillRect(x,y,w,h));
  }
  // intel layer overlay
  if (state.selectedLayer==='intel') {
    Object.values(state.intelContacts||{}).filter(c=>c.confidence>10).forEach(c=>{ ctx.beginPath(); ctx.fillStyle='rgba(255,120,120,.06)'; ctx.arc(c.x,c.y,Math.max(20,105-c.confidence),0,Math.PI*2); ctx.fill(); });
  }

  // paths
  friendlyCompanies().forEach(u=>{ if (u.order==='MOVE') { ctx.strokeStyle='rgba(126,195,255,.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(u.x,u.y);for(const p of (u.nav?.waypoints||[]).slice(u.nav?.next||0))ctx.lineTo(p.x,p.y); ctx.stroke(); }});

  // units
  friendlyCompanies().forEach(u=>drawUnit(ctx,u));
  Object.values(state.intelContacts||{}).filter(c=>c.confidence>10).forEach(c=>drawContact(ctx,c));
  state.depots.forEach(d=>drawDepot(ctx,d));
  state.convoys.filter(c=>c.status==='inTransit').forEach(c=>drawConvoy(ctx,c));
  // selected highlight
  const sel=getSelectedUnit(); if(sel){ const leaves=leafCompaniesOf(sel.id); const units = sel.echelon==='company'?[sel]:leaves; ctx.strokeStyle='#f6efb7'; ctx.lineWidth=2; units.forEach(u=>{ ctx.beginPath(); ctx.arc(u.x,u.y,12,0,Math.PI*2); ctx.stroke(); }); }
  ctx.restore();
  ctx.save();ctx.fillStyle='rgba(9,20,13,.82)';ctx.fillRect(12,13,Math.min(canvas.width-24,400),26);ctx.fillStyle='#d8ebc8';ctx.font='bold 13px sans-serif';ctx.fillText((state.scenario?.theater||'NORTH BORDER')+' • SCHEMATIC MAP',23,31);ctx.restore();

  document.getElementById('mapOverlay').textContent = state.pendingMapAction ? 'โหมดกำหนดจุดหมาย: คลิกบนแผนที่เพื่อยืนยันการเคลื่อนกำลัง' : 'คลิกหน่วยสีน้ำเงินเพื่อเลือก • ใช้คำสั่งจากแผงด้านขวา';
  document.getElementById('mapInfoText').textContent = `THEATER: ${Theaters.config().name} • SCHEMATIC GRID`;
  document.getElementById('weatherText').textContent = `สภาพอากาศ: ${state.weather} • ${World.modifiers(state).light.light==='day'?'กลางวัน':World.modifiers(state).light.light==='night'?'กลางคืน':'พลบค่ำ'}`;
}
function road(ctx,x1,y1,x2,y2){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
function drawBlob(ctx,x,y,w,h,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,Math.PI*2); ctx.fill(); }
function drawObjective(ctx,x,y,label){ ctx.fillStyle='#d4c179'; ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#efe2a5'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#e8eadf'; ctx.font='12px sans-serif'; ctx.fillText(label, x+10, y-8); }
function drawUnit(ctx,u){ const color = u.side==='ally' ? '#7ec3ff' : '#ff7c7c'; ctx.fillStyle = color; ctx.strokeStyle = '#0f1510'; ctx.lineWidth=2; ctx.beginPath(); ctx.rect(u.x-7,u.y-7,14,14); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e9eadf'; ctx.font='11px sans-serif'; ctx.fillText(u.name, u.x+10, u.y+4); }

function renderAll(){
  document.getElementById('clockDay').textContent = `DAY ${String(state.day).padStart(2,'0')}`;
  document.getElementById('clockTime').textContent = fmtTime(state.timeMinutes);
  document.getElementById('simStatusText').textContent = state.paused ? 'SIMULATION PAUSED' : 'SIMULATION RUNNING';
  document.getElementById('pauseButton').textContent = state.paused ? 'เดินเวลา' : 'หยุดเวลา';
  renderEraPanel(); renderKPIs(); renderSidebarSummary(); renderOverview(); renderSustainPage(); renderScenariosPage(); updateScenarioLabels(); if(document.activeElement?.id!=='missionText') renderCommandPanel(); renderCommandTree(); renderUnitProfile(); renderStaff(); renderStaffWorkflow(); renderMissionManager(); renderNation(); renderReports(); renderIntelFeed(); renderSelectedSummary(); renderPersonnel(); renderC2Panel(); if (state.activeView !== 'commanders' || !document.activeElement?.closest('#commanderStudio')) renderCommanders(); drawMap();
}

function setupEvents(){
  document.getElementById('mainNav').addEventListener('click', e=>{ const btn=e.target.closest('.nav-item'); if(!btn) return; setView(btn.dataset.view); });
  document.getElementById('pauseButton').onclick = ()=>{ state.paused=!state.paused; renderAll(); };
  document.getElementById('saveButton').onclick = saveGame;
  document.getElementById('loadButton').onclick = loadGame;
  document.getElementById('exportButton').onclick = exportGame;
  document.getElementById('speedSelect').onchange = e=> state.speed = Number(e.target.value);
  document.getElementById('newScenarioButton').onclick = ()=>{setView('scenarios');renderScenariosPage();};
  document.getElementById('confirmNewScenario').onclick = ()=>{ document.getElementById('scenarioModal').hidden = true; startNewScenario(selectedNextScenarioId); };
  document.getElementById('cancelNewScenario').onclick = ()=> document.getElementById('scenarioModal').hidden = true;
  document.getElementById('layerToggles').addEventListener('click', e=>{ const btn=e.target.closest('.toggle'); if(!btn || !btn.dataset.layer) return; state.selectedLayer=btn.dataset.layer; document.querySelectorAll('#layerToggles .toggle').forEach(t=>t.classList.toggle('active', t===btn)); drawMap(); });
  document.getElementById('zoomIn').onclick = ()=>{ state.map.zoom = clamp(state.map.zoom+0.1, 0.7, 1.8); drawMap(); };
  document.getElementById('zoomOut').onclick = ()=>{ state.map.zoom = clamp(state.map.zoom-0.1, 0.7, 1.8); drawMap(); };
  document.getElementById('zoomReset').onclick = ()=>{ state.map.zoom=1; state.map.offsetX=0; state.map.offsetY=0; drawMap(); };

  const canvas = document.getElementById('battlefield');
  canvas.addEventListener('click', ev=>{
    const rect=canvas.getBoundingClientRect(); const sx=(ev.clientX-rect.left)*(canvas.width/rect.width); const sy=(ev.clientY-rect.top)*(canvas.height/rect.height);
    const x = sx/state.map.zoom - state.map.offsetX; const y = sy/state.map.zoom - state.map.offsetY;
    if (state.pendingMapAction?.type === 'move') return moveOrder(state.pendingMapAction.unitId, x, y);
    if (state.pendingMapAction?.type === 'mission') {document.getElementById('newMissionX').value=Math.round(clamp(x,0,980));document.getElementById('newMissionY').value=Math.round(clamp(y,0,560));state.pendingMapAction=null;setView('missions');showToast('เลือกพิกัดภารกิจแล้ว');return;}
    // select nearest company
    let nearest=null, best=22;
    friendlyCompanies().forEach(u=>{ const d=distance(x,y,u.x,u.y); if(d<best){ best=d; nearest=u; }});
    if(nearest){ state.selectedUnitId = nearest.id; setView('operations'); renderAll(); }
  });
  // simple drag panning
  let dragging=false, prev={x:0,y:0};
  canvas.addEventListener('pointerdown', ev=>{ dragging=true; prev={x:ev.clientX,y:ev.clientY}; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointermove', ev=>{ if(!dragging) return; const dx=(ev.clientX-prev.x)/state.map.zoom; const dy=(ev.clientY-prev.y)/state.map.zoom; state.map.offsetX += dx; state.map.offsetY += dy; prev={x:ev.clientX,y:ev.clientY}; drawMap(); });
  canvas.addEventListener('pointerup', ()=> dragging=false);
  canvas.addEventListener('pointercancel', ()=> dragging=false);
}

let lastFrameAt=0, lastPaintAt=0, simulatedAccumulator=0;
const FIXED_STEP=.25;
function tickLoop(t){
  if(!lastFrameAt) lastFrameAt=t;
  const elapsedSec=clamp((t-lastFrameAt)/1000,0,.35);lastFrameAt=t;
  if(!state.paused && !document.hidden){
    simulatedAccumulator+=elapsedSec*state.speed;
    let n=0;
    while(simulatedAccumulator>=FIXED_STEP && n<24){simulateStep(FIXED_STEP);Nations.update(state,FIXED_STEP,rng);simulatedAccumulator-=FIXED_STEP;n++;}
    if(n>=24)simulatedAccumulator=Math.min(simulatedAccumulator,FIXED_STEP*24);
  }
  if(t-lastPaintAt>450){renderAll();lastPaintAt=t;}
  requestAnimationFrame(tickLoop);
}

function initialize(){
  createDefaultState(); rebuildChildren(); initializeSystems(false); Scenarios.apply(state,'sandbox'); Nations.initialize(state,false); setupEvents(); setupAdvancedEvents(); setupC2Events(); setupV08Events(); setView('overview'); renderAll(); requestAnimationFrame(tickLoop);
}

document.addEventListener('DOMContentLoaded', initialize);


// ─────────────────────────────────────────────────────────────────────────────
// BUILD 0.5 — Command relays, staged missions, staff-request workflow, depots, commander portrait studio
// and intelligence estimates. These are intentionally fictional game mechanics.
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(v) { return escapeHtml(v).replace(/`/g, '&#96;'); }
function initializeSystems(fromSave) {
  ensureCommanderSystem();
  applyCommanderLinks();
  C2.initialize(state, fromSave);
  World.initialize(state,fromSave);
  Sustain.initialize(state,fromSave);
  if(!fromSave) {
    state.missions=[];
    state.absMinutes=0;
    createMission({title:'รักษาเสถียรภาพพื้นที่ด้านเหนือ', unitId:'div1', type:'security', priority:'สูง', objective:'ตรวจสอบความพร้อมและรักษาพื้นที่', x:280, y:170},true);
    createMission({title:'คุ้มครองเส้นทางขนส่ง', unitId:'div2', type:'support', priority:'กลาง', objective:'จัดเวรและสนับสนุนเส้นทางส่งกำลัง', x:500, y:290},true);
    state.intelContacts = {
      e4:{id:'e4',name:'Red Spear 4',x:635,y:384,confidence:46,seenAt:0}
    };
  } else {
    state.absMinutes ??= Math.max(0,(state.day-1)*1440+state.timeMinutes-360);
    state.requests ??= []; state.convoys ??= []; state.relays ??= [];
    state.depots ??= [ {id:'depot-west',name:'คลังตะวันตก',x:260,y:240,stock:680}, {id:'depot-central',name:'คลังกลาง',x:600,y:215,stock:830} ];
    state.intelContacts ??= {}; state.reports ??= {}; state.lastAutoRequest ??= {};
    state.requestSerial ??= 0; state.orderSerial ??= 0; state.convoySerial ??= 0;
    state.missions.forEach(m=>{
      if (!m.phases) Object.assign(m, buildMissionPhases(m.type||'security'), {activePhase:0, status:'running',createdAt:state.absMinutes});
    });
  }
}
function phase(name, action, duration) {return {name,action,duration,status:'pending',progress:0,startedAt:null,issuedAt:null};}
function buildMissionPhases(type) {
  let phases;
  switch(type) {
    case 'relief': phases=[phase('ตรวจความพร้อม','PREP',18),phase('เคลื่อนย้ายกำลัง','MOVE',20),phase('ส่งมอบหน้าที่','EXEC',30),phase('ฟื้นสภาพหน่วย','RECOVER',20)]; break;
    case 'movement': phases=[phase('เตรียมทรัพยากร','PREP',16),phase('เคลื่อนย้าย','MOVE',22),phase('จัดหน่วยเข้าที่','EXEC',25),phase('สรุปสถานะ','RECOVER',12)]; break;
    case 'support': phases=[phase('ตรวจทรัพยากร','PREP',20),phase('ประสานหน่วย','MOVE',22),phase('สนับสนุนพื้นที่','EXEC',38),phase('ตรวจผลและฟื้นสภาพ','RECOVER',20)]; break;
    default: phases=[phase('เตรียมภารกิจ','PREP',18),phase('เข้าประจำพื้นที่','MOVE',24),phase('รักษาการณ์','EXEC',42),phase('ส่งรายงานและพักกำลัง','RECOVER',18)];
  }
  return {phases};
}
function createMission(info, silent=false) {
  const u=getUnit(info.unitId);
  if(!u || u.side!=='ally') return false;
  const m={
    id:`mission-${++state.missionSerial}`, unitId:u.id,
    title:String(info.title||'ภารกิจใหม่').slice(0,65),
    objective:String(info.objective||'ดำเนินงานตามภารกิจที่ได้รับ').slice(0,110),
    type:info.type||'security',priority:info.priority||'กลาง',
    x:clamp(Number(info.x)||0,0,980),y:clamp(Number(info.y)||0,0,560),
    status:'running',activePhase:0,createdAt:state.absMinutes,
    ...buildMissionPhases(info.type||'security')
  };
  state.missions.unshift(m);
  if(!silent) logEvent('S3',`รับแผน ${m.title} ให้ ${u.name} เริ่มจัดคำสั่งตามลำดับระยะ`);
  return m;
}
function missionCurrentPhase(m){return m.phases?.[m.activePhase] || null;}
function phaseOrder(ph){return {PREP:'HOLD',MOVE:'MOVE',EXEC:'HOLD',RECOVER:'REST'}[ph.action]||'HOLD';}
function issueMissionPhase(m,ph) {
  ph.status='dispatching'; ph.issuedAt=state.absMinutes;
  queueCommand(m.unitId,phaseOrder(ph), ph.action==='MOVE' ? {x:m.x,y:m.y} : {}, {missionId:m.id,phaseIndex:m.activePhase});
  logEvent('S3',`${m.title}: ส่งคำสั่งระยะ “${ph.name}” ผ่านสายการบังคับบัญชา`);
}
function commandPathToLeaf(originId, leafId){
  const leaf=getUnit(leafId);const chain=[];let cur=leaf;
  while(cur){chain.unshift(cur);if(cur.id===originId)break;cur=getUnit(cur.parentId);}
  if(!chain.length||chain[0].id!==originId) return [leaf].filter(Boolean);
  return chain;
}
function relayDelay(origin, leaf){
  const path=commandPathToLeaf(origin.id,leaf.id);
  let total=0;
  for (const u of path) total+= Math.max(1,(u.commandDelay||4)*0.37);
  return clamp(total * (110 / clamp(state.staff.communications,25,100)),2,34);
}
function queueCommand(unitId, order, opts={}, meta={}) {
  const origin=getUnit(unitId); if(!origin || origin.side!=='ally')return [];
  const leaves=leafCompaniesOf(unitId);
  // Explicit player commands take precedence over any overlapping mission automation.
  if(!meta?.missionId) {
    const targetIds=new Set(leaves.map(u=>u.id));
    for(const mission of state.missions) {
      if(mission.status!=='running')continue;
      if(leafCompaniesOf(mission.unitId).some(u=>targetIds.has(u.id))) {
        mission.status='paused'; mission.pauseReason='คำสั่งโดยตรงจากผู้เล่น';
        state.relays=state.relays.filter(r=>r.meta?.missionId!==mission.id);
        logEvent('C2',`พักแผน ${mission.title} เพื่อให้คำสั่งผู้เล่นมีสิทธิ์ก่อน`);
      }
    }
  }
  const offsets=radialOffsets(leaves.length, Math.min(55,18+leaves.length*4));
  const messages=leaves.map((leaf,i)=>{
    const msg={id:`ord-${++state.orderSerial}`, originId:unitId,targetId:leaf.id,
      kind:'order',order,meta:{...meta},
      destination: order==='MOVE' ? {
        x:clamp(opts.x + (leaves.length===1?0:offsets[i].x),20,MAP.w-20),
        y:clamp(opts.y + (leaves.length===1?0:offsets[i].y),20,MAP.h-20)
      }:null,
      issuedAt:state.absMinutes,dueAt:state.absMinutes+relayDelay(origin,leaf)};
    return C2.decorateOrder(state,msg,origin,leaf,commandPathToLeaf(unitId,leaf.id));
  });
  state.relays=state.relays.filter(r=>r.kind!=='order' || r.originId!==unitId || r.meta?.missionId);
  state.relays.push(...messages);
  logEvent('C2',`${origin.name}: ส่งคำสั่ง ${order} ถึง ${leaves.length} กองร้อย อยู่ระหว่างการถ่ายทอดคำสั่ง`);
  return messages;
}
function queueReport(unitId){
  const u=getUnit(unitId);if(!u)return;
  const report={ id:`ord-${++state.orderSerial}`,kind:'report',originId:unitId,targetId:unitId, issuedAt:state.absMinutes,
    dueAt:state.absMinutes + 3 + (100 - state.staff.communications)*0.11, snapshot:{...aggregateOf(unitId)} };
  C2.decorateReport(state,report,u);
  state.relays.push(report);
  logEvent('C2',`ขอรายงานจาก ${u.name}: รอการรวบรวมข้อมูลและสื่อสารกลับ`);
  showToast('ส่งคำขอรายงานแล้ว');
}
function completeRelay(msg){
  if(msg.kind==='report'){
    const snapshot={at:msg.issuedAt,receivedAt:state.absMinutes,...C2.reportSnapshot(state,msg)};
    state.reports[msg.targetId]=snapshot;
    logEvent('C2',`ได้รับรายงานจาก ${getUnit(msg.targetId)?.name||'หน่วย'} (ข้อมูล ณ ${fmtTime(state.timeMinutes)})`);
    return;
  }
  const leaf=getUnit(msg.targetId); if(!leaf)return;
  leaf.order=msg.order;leaf.lastOrderMinute=state.timeMinutes;
  if(msg.order==='MOVE' && msg.destination){leaf.targetX=msg.destination.x;leaf.targetY=msg.destination.y;World.issueMove(leaf,leaf.targetX,leaf.targetY);leaf.objective=leaf.nav.blocked?'เส้นทางไม่สามารถผ่านได้':'กำลังเคลื่อนย้ายตามคำสั่ง';}
  if(msg.order==='HOLD') leaf.objective='รักษาที่ตั้งและเฝ้าระวัง';
  if(msg.order==='REST') leaf.objective='พักกำลังและฟื้นสภาพ';
  if(msg.order==='DELEGATE') leaf.objective='มอบอำนาจให้ AI ผู้บัญชาการรอง';
  if(rng()<0.15) logEvent('C2',`คำสั่ง ${msg.order} ถึง ${leaf.name} และรับทราบแล้ว`);
}
function simulateSystems(dt) {
  const due=state.relays.filter(m=>m.dueAt<=state.absMinutes);
  state.relays=state.relays.filter(m=>m.dueAt>state.absMinutes);
  due.forEach(msg=>{
    if(C2.handleRelay(state,msg,{logEvent,rng,getUnit})) completeRelay(msg);
    else state.relays.push(msg);
  });
  C2.tick(state,dt,{rng,logEvent,getUnit,aggregateOf});
  for(const m of state.missions) progressMission(m,dt);
  progressSupport(dt);
  updateIntelContacts(dt);
  if(state.absMinutes>=60){
    const weak=friendlyCompanies().filter(u=>u.supply<37 && state.absMinutes-(state.lastAutoRequest[u.id]||-200)>95);
    if(weak.length){ const u=weak.sort((a,b)=>a.supply-b.supply)[0]; createStaffRequest(u.id,'supply',true); state.lastAutoRequest[u.id]=state.absMinutes; }
  }
}
function progressMission(m,dt){
  if(m.status!=='running')return;
  const ph=missionCurrentPhase(m);
  if(!ph){m.status='completed';return;}
  const leaves=leafCompaniesOf(m.unitId); if(!leaves.length){m.status='cancelled';return;}
  const supply=Math.min(...leaves.map(u=>u.supply));
  const ready=Math.min(...leaves.map(u=>u.readiness));
  if(ph.status==='pending')issueMissionPhase(m,ph);
  if(ph.status==='dispatching'){
    if(!state.relays.some(o=>o.meta?.missionId===m.id && o.meta.phaseIndex===m.activePhase)){
      ph.status='active';ph.startedAt=state.absMinutes;
      logEvent('S3',`${m.title}: เริ่มระยะ ${ph.name}`);
    }
  }
  if(ph.status==='blocked'){
    if(supply>=28 && ready>=26){ph.status='active';logEvent('S3',`${m.title}: ปัญหาทรัพยากรคลี่คลาย เดินหน้าต่อ`);}
    else return;
  }
  if(ph.status!=='active')return;
  if(supply<18 || ready<20){
    ph.status='blocked';logEvent('S3',`${m.title}: หยุดชั่วคราวเนื่องจากความพร้อมหรือเสบียงไม่เพียงพอ`);
    return;
  }
  const elapsed=state.absMinutes-ph.startedAt;
  let progress=clamp(elapsed/ph.duration,0,1);
  if(ph.action==='MOVE'){
    const distMean=leaves.reduce((sum,u)=>sum+distance(u.x,u.y,u.targetX,u.targetY),0)/leaves.length;
    if(distMean>12) progress=Math.min(progress,0.95);
    if(distMean<=12 && elapsed>=8)progress=1;
  }
  ph.progress=Math.round(progress*100);
  if(progress>=1){
    ph.status='done';ph.progress=100;m.activePhase++;
    logEvent('S3',`${m.title}: เสร็จระยะ “${ph.name}”`);
    if(m.activePhase>=m.phases.length){
      m.status='completed';
      logEvent('S3',`${m.title}: ภารกิจเสร็จสมบูรณ์`);
    }
  }
}
function pauseMission(id) {
  const m=state.missions.find(x=>x.id===id);if(!m)return;
  if(m.status==='running'){
    m.status='paused';state.relays=state.relays.filter(o=>o.meta?.missionId!==m.id);queueCommand(m.unitId,'HOLD');logEvent('S3',`พักภารกิจ ${m.title} ตามคำสั่ง`);
  } else if(m.status==='paused'){
    m.status='running';const ph=missionCurrentPhase(m); if(ph){ph.status='pending';ph.progress=0;}
    logEvent('S3',`ดำเนินภารกิจ ${m.title} ต่อ`);
  }
  renderAll();
}
function cancelMission(id){
  const m=state.missions.find(x=>x.id===id); if(!m || ['cancelled','completed'].includes(m.status))return;
  m.status='cancelled';
  state.relays=state.relays.filter(o=>o.meta?.missionId!==m.id);
  queueCommand(m.unitId,'HOLD'); logEvent('S3',`ยกเลิกภารกิจ ${m.title}`);renderAll();
}
function missionStatus(m){return {running:'กำลังดำเนินการ',paused:'พักชั่วคราว',cancelled:'ยกเลิก',completed:'เสร็จสิ้น'}[m.status]||m.status;}
function phaseStatus(p){return {pending:'รอเริ่ม',dispatching:'ถ่ายทอดคำสั่ง',active:'กำลังทำ',blocked:'ติดขัด',done:'สำเร็จ'}[p.status]||p.status;}
function renderMissionBrief(m){
  const phase=missionCurrentPhase(m);return `<div class="mission-card"><div class="row"><h3>${escapeHtml(m.title)}</h3><span class="priority-badge ${priorityClass(m.priority)}">${escapeHtml(m.priority)}</span></div><div class="muted">${escapeHtml(getUnit(m.unitId)?.name||'-')} • ${missionStatus(m)}</div><div class="muted">${phase?`ระยะ: ${escapeHtml(phase.name)} (${phaseStatus(phase)})`:'ครบทุกระยะ'}</div><div class="metric-bar"><div class="metric-fill" style="width:${Math.round((((m.activePhase||0)+(phase?.progress||0)/100)/(m.phases?.length||1))*100)}%"></div></div></div>`;
}
function renderMissionManager(){
  const select=document.getElementById('newMissionUnit');
  if(select){const old=select.value;select.innerHTML=state.units.filter(u=>u.side==='ally' && ['division','battalion'].includes(u.echelon)).map(u=>`<option value="${u.id}">${escapeHtml(u.name)} • ${labelEchelon(u.echelon)}</option>`).join('');
    if([...select.options].some(o=>o.value===old))select.value=old;}
  document.getElementById('missionCount').textContent=`ACTIVE ${state.missions.filter(m=>m.status==='running').length}`;
  document.getElementById('missionManager').innerHTML=state.missions.map(m=>{
    const ph=missionCurrentPhase(m);
    return `<article class="mission-detail"><div class="row"><div><div class="eyebrow">${escapeHtml(getUnit(m.unitId)?.name||'UNIT')} · ${escapeHtml(m.priority)}</div><h3>${escapeHtml(m.title)}</h3></div><span class="priority-badge ${m.status==='running'?'low':'medium'}">${missionStatus(m)}</span></div><p class="muted">${escapeHtml(m.objective)}</p><div class="phase-list">${m.phases.map((p,i)=>`<div class="phase-step ${p.status}"><span class="phase-index">${i+1}</span><div><strong>${escapeHtml(p.name)}</strong><small>${phaseStatus(p)} • ${p.progress||0}%</small></div></div>`).join('')}</div><div class="row mission-tools"><small class="muted">${ph?`ปัจจุบัน: ${phaseStatus(ph)}`:'ครบทุกระยะ'}</small><div class="button-line">${!['completed','cancelled'].includes(m.status)?`<button class="node-btn" data-pause-mission="${m.id}">${m.status==='paused'?'ดำเนินต่อ':'พัก'}</button><button class="node-btn danger" data-cancel-mission="${m.id}">ยกเลิก</button>`:''}</div></div></article>`;
  }).join('') || '<div class="helper-note">ยังไม่มีภารกิจ</div>';
  document.querySelectorAll('[data-pause-mission]').forEach(b=>b.onclick=()=>pauseMission(b.dataset.pauseMission));
  document.querySelectorAll('[data-cancel-mission]').forEach(b=>b.onclick=()=>cancelMission(b.dataset.cancelMission));
}
const requestSpecs={
  supply:{label:'เสบียง',stock:125,cost:28},
  medical:{label:'แพทย์',stock:65,cost:24},
  comms:{label:'การสื่อสาร',stock:55,cost:32},
  intel:{label:'ข่าวกรอง',stock:40,cost:22}
};
function createStaffRequest(unitId,type,automatic=false){
  const u=getUnit(unitId);const spec=requestSpecs[type];if(!u||!spec||u.side!=='ally')return;
  const open=state.requests.some(r=>r.unitId===unitId && r.type===type && ['pending','inTransit'].includes(r.status));
  if(open){if(!automatic)showToast('หน่วยนี้มีคำร้องประเภทเดียวกันอยู่แล้ว');return;}
  state.requests.unshift({id:`req-${++state.requestSerial}`,unitId,type,status:'pending',priority:type==='medical'?'สูง':'กลาง',createdAt:state.absMinutes,amount:spec.stock,cost:spec.cost,auto:automatic});
  logEvent('STAFF',`รับคำร้อง${spec.label}จาก ${u.name} • รออนุมัติ`);
  if(!automatic)showToast('ส่งคำร้องเข้าฝ่ายอำนวยการแล้ว');
}
function approveRequest(id){
  const r=state.requests.find(x=>x.id===id);if(!r||r.status!=='pending')return;
  const target=getUnit(r.unitId);if(!target)return;
  if(state.economy.budget<r.cost){showToast('งบประมาณไม่เพียงพอ');return;}
  const eligible=state.depots.filter(d=>d.stock>=r.amount).sort((a,b)=>distance(a.x,a.y,target.x||450,target.y||260)-distance(b.x,b.y,target.x||450,target.y||260));
  if(!eligible.length){showToast('คลังมีทรัพยากรไม่เพียงพอ');return;}
  const d=eligible[0];
  const route=World.route(d.x,d.y,target.x||450,target.y||260);
  if(!route.reachable){showToast('ไม่พบเส้นทางขนส่งที่สามารถผ่านได้');return;}
  d.stock-=r.amount;state.economy.budget-=r.cost;
  const eta=clamp(18+route.cost*1.6/Math.max(.45,World.modifiers(state).pace),20,145);
  const convoy={id:`conv-${++state.convoySerial}`,requestId:r.id,unitId:r.unitId,depotId:d.id,type:r.type,amount:r.amount,x:d.x,y:d.y,status:'inTransit',departsAt:state.absMinutes,arrivesAt:state.absMinutes+eta,path:route.points};
  state.convoys.unshift(convoy);r.status='inTransit';r.approvedAt=state.absMinutes;r.eta=eta;
  logEvent('S4',`อนุมัติ${requestSpecs[r.type].label}ถึง ${target.name} จัดขนส่งจาก ${d.name} ETA ${Math.round(eta)} นาที`);
  renderAll();showToast('อนุมัติและจัดการขนส่งแล้ว');
}
function rejectRequest(id){
  const r=state.requests.find(x=>x.id===id);if(!r||r.status!=='pending')return;
  r.status='rejected';logEvent('STAFF',`ปฏิเสธคำร้อง ${requestSpecs[r.type].label} ของ ${getUnit(r.unitId)?.name||'หน่วย'}`);renderAll();
}
function progressSupport(dt){
  for(const c of state.convoys.filter(x=>x.status==='inTransit')){
    const r=state.requests.find(x=>x.id===c.requestId); const u=getUnit(c.unitId);const d=state.depots.find(x=>x.id===c.depotId);
    if(!r||!u||!d)continue;
    const p=clamp((state.absMinutes-c.departsAt)/(c.arrivesAt-c.departsAt),0,1);
    const path=Array.isArray(c.path)&&c.path.length ? [{x:d.x,y:d.y},...c.path] : [{x:d.x,y:d.y},{x:u.x,y:u.y}];
    let length=0;for(let i=1;i<path.length;i++)length+=distance(path[i-1].x,path[i-1].y,path[i].x,path[i].y);
    let remaining=length*p;
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],part=distance(a.x,a.y,b.x,b.y);
      if(remaining<=part||i===path.length-1){const q=part?clamp(remaining/part,0,1):1;c.x=a.x+(b.x-a.x)*q;c.y=a.y+(b.y-a.y)*q;break;}
      remaining-=part;
    }
    if(p>=1){
      c.status='delivered';r.status='delivered';r.deliveredAt=state.absMinutes;
      const leaves=leafCompaniesOf(u.id);const targets=leaves.length?leaves:[u];
      targets.forEach(leaf=>{
        switch(r.type){
          case 'supply': {if(leaf.sustain){leaf.sustain.stocks.food+=80/targets.length;leaf.sustain.stocks.water+=110/targets.length;} leaf.supply=clamp(leaf.supply+(55/targets.length+12),0,100);break;}
          case 'medical': {let treated=0;for(const e of (leaf.establishment?.elements||[])){const recover=Math.min(e.wounded,Math.ceil(2/targets.length));e.wounded-=recover;e.resting+=recover;treated+=recover;if(treated>=6)break;}state.world.medicalTreated=(state.world.medicalTreated||0)+treated;leaf.morale=clamp(leaf.morale+4,0,100);World.initialize(state,true);break;}
          case 'comms': leaf.commandDelay=clamp(leaf.commandDelay-1,1,40);break;
          case 'intel': break;
        }
      });
      if(r.type==='comms')state.staff.communications=clamp(state.staff.communications+3,0,100);
      if(r.type==='intel')state.staff.intelligence=clamp(state.staff.intelligence+6,0,100);
      logEvent('S4',`ส่งมอบ ${requestSpecs[r.type].label} ถึง ${u.name} แล้ว`);
    }
  }
}
function renderStaffWorkflow(){
  const root=document.getElementById('staffRequests');if(!root)return;
  const pending=state.requests.filter(r=>r.status==='pending').sort((a,b)=>a.priority==='สูง'?-1:1);
  const others=state.requests.filter(r=>r.status!=='pending').slice(0,9);
  const requests=[...pending,...others];
  root.innerHTML=requests.length ? requests.map(r=>`<div class="request-card"><div class="row"><div><strong>${requestSpecs[r.type]?.label||'คำร้อง'} — ${escapeHtml(getUnit(r.unitId)?.name||'-')}</strong><div class="muted">รับเมื่อ ${Math.round(r.createdAt)} นาทีหลังเริ่มเกม • จำนวน ${r.amount} • งบ ${r.cost}</div></div><span class="priority-badge ${r.status==='pending'?'medium':'low'}">${{pending:'รออนุมัติ',inTransit:'กำลังส่ง',delivered:'ส่งถึงแล้ว',rejected:'ปฏิเสธ'}[r.status]||r.status}</span></div>${r.status==='pending'?`<div class="button-line"><button class="node-btn approve" data-approve-id="${r.id}">อนุมัติ</button><button class="node-btn danger" data-reject-id="${r.id}">ปฏิเสธ</button></div>`:''}</div>`).join('') : '<div class="helper-note">ยังไม่มีคำร้องจากหน่วยรอง</div>';
  document.querySelectorAll('[data-approve-id]').forEach(b=>b.onclick=()=>approveRequest(b.dataset.approveId));
  document.querySelectorAll('[data-reject-id]').forEach(b=>b.onclick=()=>rejectRequest(b.dataset.rejectId));
  const board=document.getElementById('depotBoard');
  board.innerHTML=state.depots.map(d=>`<div class="depot-card"><strong>${d.name}</strong><div class="muted">พิกัด ${d.x}, ${d.y}</div>${barRow('สต็อก',Math.round(100*d.stock/900))}<div class="muted">ทรัพยากรคงเหลือ ${Math.round(d.stock)} หน่วย</div></div>`).join('')+`<div class="depot-card"><strong>อยู่ระหว่างขนส่ง</strong><div class="big">${state.convoys.filter(c=>c.status==='inTransit').length}</div>${state.convoys.filter(c=>c.status==='inTransit').map(c=>`<div class="muted">${escapeHtml(getUnit(c.unitId)?.name||'หน่วย')} • ETA ${Math.max(0,Math.round(c.arrivesAt-state.absMinutes))} นาที</div>`).join('')}</div>`;
}
function updateIntelContacts(dt){
  for(const u of enemyCompanies()){
    const seenBy=friendlyCompanies().reduce((closest,v)=>Math.min(closest,distance(v.x,v.y,u.x,u.y)),10000);
    const quality=state.staff.intelligence;
    const range=(70+quality*.45)*World.modifiers(state).visibility;
    const contact=state.intelContacts[u.id];
    if(seenBy<range && rng()<Math.min(0.35,(range-seenBy)/range*.15*dt)){
      const noise=(100-quality)/2+8;
      state.intelContacts[u.id]={id:u.id,name:u.name,x:clamp(u.x+(rng()-.5)*noise,0,980),y:clamp(u.y+(rng()-.5)*noise,0,560),confidence:clamp(45+quality*.47-seenBy/5,20,96),seenAt:state.absMinutes};
    } else if(contact){
      contact.confidence=clamp(contact.confidence-dt*.28,0,100);
      if(contact.confidence<=1)delete state.intelContacts[u.id];
    }
  }
}
function drawContact(ctx,c){
  const alpha=clamp(c.confidence/100,.22,.92);
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#ff9898';ctx.lineWidth=1.8;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.arc(c.x,c.y,Math.max(16,(105-c.confidence)*.5),0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);ctx.fillStyle='#e38484';ctx.fillRect(c.x-6,c.y-6,12,12);
  ctx.fillStyle='#ffe3d9';ctx.font='11px sans-serif';ctx.fillText(`${c.name} ?`,c.x+12,c.y-5);ctx.restore();
}
function drawDepot(ctx,d){ctx.save();ctx.fillStyle='#cdbd87';ctx.fillRect(d.x-6,d.y-6,12,12);ctx.strokeStyle='#4a4026';ctx.strokeRect(d.x-6,d.y-6,12,12);ctx.fillStyle='#f6ead0';ctx.font='11px sans-serif';ctx.fillText('DEPOT',d.x+10,d.y+3);ctx.restore();}
function drawConvoy(ctx,c){ctx.save();ctx.fillStyle='#ecdc9b';ctx.beginPath();ctx.moveTo(c.x,c.y-7);ctx.lineTo(c.x+7,c.y+6);ctx.lineTo(c.x-7,c.y+6);ctx.closePath();ctx.fill();ctx.restore();}
function setupAdvancedEvents(){
  const f=document.getElementById('missionForm');
  f.addEventListener('submit',ev=>{
    ev.preventDefault();
    const title=document.getElementById('newMissionTitle').value.trim();
    if(!title){showToast('กรุณาระบุชื่อภารกิจ');return;}
    const success=createMission({
      title,unitId:document.getElementById('newMissionUnit').value,
      objective:document.getElementById('newMissionObjective').value.trim(),
      type:document.getElementById('newMissionType').value,
      priority:document.getElementById('newMissionPriority').value,
      x:document.getElementById('newMissionX').value,
      y:document.getElementById('newMissionY').value
    });
    if(success){f.reset();renderAll();showToast('สร้างแผนภารกิจแล้ว');}
  });
  document.getElementById('missionMapPick').onclick=()=>{
    state.pendingMapAction={type:'mission'};
    setView('operations');drawMap();showToast('คลิกตำแหน่งบนแผนที่เพื่อกำหนดจุดหมายภารกิจ');
  };
}

// Build 0.6: personnel / equipment dashboard and route context.
function renderPersonnel(){
  const roster=document.getElementById('personnelRoster'),board=document.getElementById('unitSystemsBoard');
  if(!roster||!board)return;
  const selected=getSelectedUnit(), leaves=selected.side==='ally'?leafCompaniesOf(selected.id):[];
  const selectedCompany=selected.echelon==='company'&&selected.side==='ally'?selected:(leaves[0]||friendlyCompanies()[0]);
  const o=World.modifiers(state),t=World.preview(state,selectedCompany.x,selectedCompany.y);
  const rosterHtml=friendlyCompanies().map(u=>{
    const total=World.totals(u),sel=u.id===selectedCompany.id;
    return `<button class="roster-line ${sel?'is-selected':''}" data-personnel-unit="${u.id}"><span class="roster-title">${escapeHtml(u.name)}<small>${escapeHtml(commanderNameForUnit(u))}</small></span><span><strong>${total.ready}</strong><small>พร้อม/${total.authorized}</small></span><span><strong>${u.establishment.vehicles.operational}</strong><small>ยานพาหนะ</small></span></button>`;
  }).join('');
  roster.innerHTML=`<div class="panel-mini-stats"><div><small>กองร้อยฝ่ายเรา</small><strong>${friendlyCompanies().length}</strong></div><div><small>พร้อมปฏิบัติ</small><strong>${friendlyCompanies().reduce((a,u)=>a+World.totals(u).ready,0)}</strong></div><div><small>บาดเจ็บทั้งหมด</small><strong>${friendlyCompanies().reduce((a,u)=>a+World.totals(u).wounded,0)}</strong></div></div><div class="personnel-scroll">${rosterHtml}</div>`;
  const e=selectedCompany.establishment, totals=World.totals(selectedCompany);
  const pct=Math.round(totals.ready/Math.max(1,totals.authorized)*100);
  const terrainName={road:'ถนน',hill:'พื้นที่สูง',forest:'ป่า',plain:'พื้นที่เปิด',river:'ลำน้ำ',outside:'นอกพื้นที่'}[t.terrain];
  board.innerHTML=`<div class="unit-dossier"><div class="eyebrow">UNIT ESTABLISHMENT / FICTIONAL</div><h3>${escapeHtml(selectedCompany.name)} — ${escapeHtml(commanderNameForUnit(selectedCompany))}</h3><div class="mini-line"><span>พร้อมปฏิบัติ / อัตราอนุมัติ</span><strong>${totals.ready} / ${totals.authorized}</strong></div>${barRow('ความพร้อมกำลังพล',pct)}<div class="panel-mini-stats three"><div><small>บาดเจ็บ</small><strong>${totals.wounded}</strong></div><div><small>เจ็บป่วย</small><strong>${totals.sick}</strong></div><div><small>พักฟื้น</small><strong>${totals.resting}</strong></div></div><div class="company-table"><div class="table-head">องค์ประกอบในกองร้อย</div>${e.elements.map(x=>`<div class="company-row"><span>${escapeHtml(x.name)}</span><span>${x.ready} / ${x.authorized}</span><span class="muted">บาดเจ็บ ${x.wounded}</span></div>`).join('')}</div><div class="company-table"><div class="table-head">ยุทโธปกรณ์และการซ่อม</div><div class="mini-line"><span>ยานพาหนะใช้งาน / อัตราอนุมัติ</span><strong>${e.vehicles.operational} / ${e.vehicles.authorized}</strong></div><div class="mini-line"><span>อยู่ระหว่างซ่อม</span><strong>${e.vehicles.underRepair}</strong></div>${barRow('การสึกหรอ',Math.round(e.equipmentWear),true)}</div><div class="company-table"><div class="table-head">สภาพแวดล้อม ณ ตำแหน่งหน่วย</div><div class="mini-line"><span>ประเภทพื้นที่</span><strong>${terrainName}</strong></div><div class="mini-line"><span>ผ่านได้</span><strong>${t.passable?'ได้':'ไม่ได้'}</strong></div><div class="mini-line"><span>เวลา</span><strong>${o.light.light==='day'?'กลางวัน':o.light.light==='night'?'กลางคืน':'พลบค่ำ'}</strong></div><div class="mini-line"><span>สภาพอากาศ</span><strong>${escapeHtml(state.weather)}</strong></div><div class="mini-line"><span>ทัศนวิสัยสัมพัทธ์</span><strong>${Math.round(o.visibility*100)}%</strong></div><div class="mini-line"><span>ต้นทุนพื้นที่</span><strong>${Number.isFinite(t.cost)?t.cost.toFixed(2):'ผ่านไม่ได้'}</strong></div><div class="helper-note">${escapeHtml(selectedCompany.statusCause||'พร้อมปฏิบัติงาน')} • ข้อมูลทั้งหมดเป็นค่าของระบบเกมสมมติ</div></div></div>`;
  roster.querySelectorAll('[data-personnel-unit]').forEach(btn=>btn.onclick=()=>{state.selectedUnitId=btn.dataset.personnelUnit;renderAll();setView('personnel');});
}

// — v0.7 Command & Staff console —
function renderC2Panel(){
  const page=document.getElementById('view-c2'); if(!page)return;
  if(!state.c2) C2.initialize(state,true);
  const commanderSelect=document.getElementById('c2CommanderSelect');
  if(!commanderSelect)return;
  // Preserve a dropdown while the user is interacting with it.
  if(state.activeView==='c2' && document.activeElement?.closest('#view-c2') && ['INPUT','SELECT'].includes(document.activeElement.tagName))return;
  if(!state.selectedC2CommanderId || !commanderById(state.selectedC2CommanderId)) state.selectedC2CommanderId='cmd-army';
  const officer=commanderById(state.selectedC2CommanderId)||state.commanders[0];if(!officer)return;
  const unit=getUnit(officer.assignedUnitId);
  const traitSpec=[['planning','การวางแผน'],['communication','การสื่อสาร'],['initiative','ความริเริ่ม'],['resilience','รับความกดดัน']];
  commanderSelect.innerHTML=`<label class="c2-label">ผู้บังคับบัญชาที่กำลังประเมิน<select id="c2OfficerSelect" class="text-input">${state.commanders.map(c=>`<option value="${c.id}" ${c.id===officer.id?'selected':''}>${escapeHtml(c.name)} — ${escapeHtml(getUnit(c.assignedUnitId)?.name||'')}</option>`).join('')}</select></label>`;
  document.getElementById('c2CommanderDetail').innerHTML=`<div class="c2-officer-header"><div class="portrait-frame small">${renderCommanderPortraitSVG(officer,110,128)}</div><div><strong>${escapeHtml(officer.name)}</strong><div class="muted">${escapeHtml(officer.rank)} · ${escapeHtml(unit?.name||'')}</div><div class="c2-metric-label">ประสบการณ์ ${Math.round(officer.c2Experience)} / 100</div><div class="c2-metric-label">ความเครียด ${Math.round(officer.c2Stress)} / 100</div></div></div>
   <label class="c2-label">แนวทางการมอบอำนาจ<select id="c2Style" class="text-input">${Object.entries(C2.STYLES).map(([value,name])=>`<option value="${value}" ${officer.commandStyle===value?'selected':''}>${name}</option>`).join('')}</select></label>
   <div class="c2-trait-grid">${traitSpec.map(([key,name])=>`<label class="c2-trait"><span>${name} <strong>${Math.round(C2.trait(officer,key))}</strong></span><input type="range" min="20" max="95" step="1" value="${C2.trait(officer,key)}" data-c2-trait="${key}" /></label>`).join('')}</div>
   <div class="helper-note">ทักษะและความเครียดเป็นค่าจำลองสมมติ ไม่ใช่การประเมินบุคคลจริง การปรับทักษะจะมีผลต่อเวลาคำสั่งที่ออกใหม่ และการตัดสินใจของ AI เมื่อมอบอำนาจ</div>`;
  const relays=state.relays.filter(r=>r.c2).sort((a,b)=>a.dueAt-b.dueAt);
  const stats=C2.metrics(state);
  document.getElementById('c2MessageBoard').innerHTML=`<div class="c2-numbers"><div><small>คำสั่ง/รายงานที่เดินทาง</small><strong>${stats.active}</strong></div><div><small>รายการที่ส่งถึงแล้ว</small><strong>${stats.delivered}</strong></div><div><small>ทักษะสื่อสารเฉลี่ย</small><strong>${stats.avg}</strong></div></div>
   <div class="c2-message-scroll">${relays.length?relays.slice(0,14).map(r=>{const stages=r.c2?.stages||[];const done=r.c2?.index||0;return `<article class="c2-message"><div class="c2-message-title"><strong>${r.kind==='report'?'รายงานสถานะ':escapeHtml(r.order)} → ${escapeHtml(getUnit(r.targetId)?.name||'-')}</strong><span>${Math.max(0,Math.ceil(r.dueAt-state.absMinutes))} นาที</span></div><div class="muted">${escapeHtml(r.c2.status)} · ${done}/${stages.length} ขั้น</div><div class="metric-bar"><div class="metric-fill" style="width:${Math.round(done/Math.max(1,stages.length)*100)}%"></div></div></article>`;}).join(''):'<div class="helper-note">ยังไม่มีคำสั่งค้างส่ง ลองเลือกหน่วยแล้วออกคำสั่งหรือขอรายงาน</div>'}</div>`;
  document.getElementById('c2DeskGrid').innerHTML=`<div class="c2-desks">${Object.entries(C2.DESKS).map(([id,spec])=>{const m=C2.staffPressure(state,id);return `<div class="c2-desk"><div class="row"><strong>${id}</strong><span>${m.load}%</span></div><small>${spec.name} · ค้าง ${m.pending} งาน</small><div class="metric-bar"><div class="metric-fill ${m.load>75?'danger':m.load>50?'warn':''}" style="width:${m.load}%"></div></div></div>`;}).join('')}</div>`;
  const unitSelect=document.getElementById('c2TaskUnit');const old=unitSelect.value;
  unitSelect.innerHTML=state.units.filter(u=>u.side==='ally').map(u=>`<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
  if([...unitSelect.options].some(o=>o.value===old)) unitSelect.value=old;
  document.getElementById('c2CaseList').innerHTML=`<div class="c2-case-list">${state.c2.cases.slice(0,18).map(c=>{const percent=Math.round(100*c.progress/Math.max(1,c.required));return `<div class="c2-case"><div class="row"><strong>${escapeHtml(c.desk)} — ${escapeHtml(c.title)}</strong><span class="priority-badge ${c.status==='done'?'low':'medium'}">${c.status==='queued'?'รอคิว':c.status==='active'?'กำลังทำ':'เสร็จ'}</span></div><div class="muted">${escapeHtml(getUnit(c.unitId)?.name||'-')}</div><div class="metric-bar"><div class="metric-fill" style="width:${percent}%"></div></div></div>`;}).join('')}</div>`;
  document.getElementById('c2DecisionLog').innerHTML=`<div class="c2-decision-log">${state.c2.history.map(entry=>`<div class="c2-log-item"><small>D${String(Math.floor(entry.time/1440)+1).padStart(2,'0')} ${fmtTime((entry.time+360)%1440)}</small><p>${escapeHtml(entry.text)}</p></div>`).join('')||'<div class="helper-note">ยังไม่มีบันทึกการตัดสินใจ</div>'}</div>`;
  const sel=document.getElementById('c2OfficerSelect');sel.onchange=e=>{state.selectedC2CommanderId=e.target.value;sel.blur();renderC2Panel();};
  document.getElementById('c2Style').onchange=e=>{officer.commandStyle=e.target.value;C2.note(state,`${officer.name}: ตั้งรูปแบบการมอบอำนาจเป็น ${C2.STYLES[e.target.value]}`);document.activeElement.blur();renderC2Panel();};
  document.querySelectorAll('[data-c2-trait]').forEach(input=>input.onchange=e=>{officer.c2Traits[e.target.dataset.c2Trait]=Number(e.target.value);e.target.blur();renderC2Panel();});
}
function setupC2Events(){
  document.getElementById('c2TaskForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const type=document.getElementById('c2TaskType').value;
    const id=document.getElementById('c2TaskUnit').value;
    const ticket=C2.createCase(state,type,id);
    if(!ticket)showToast('มีงานประเภทเดียวกันสำหรับหน่วยนี้ค้างอยู่แล้ว');
    else showToast('ส่งงานฝ่ายเสนาธิการแล้ว');
    renderAll();
  });
}

// ---------------------------------------------------------------------------
// v0.8: Historical scenario library and separate-resource sustainment console.
// ---------------------------------------------------------------------------
let selectedNextScenarioId='sandbox';
let scenarioEraFilter='all';
function updateScenarioLabels(){
  const p=Scenarios.byId(state.scenarioId||'sandbox');
  const label=document.getElementById('scenarioTheater');
  if(label)label.textContent=p.theater;
  const tag=document.getElementById('scenarioTopTag');
  if(tag)tag.textContent=`${p.tag} • ${p.date}`;
}
function scenarioCard(p){
  const active=state.scenarioId===p.id;
  return `<article class="scenario-card ${active?'selected':''}">
    <div class="scenario-card-top"><span class="tag">${escapeHtml(p.tag)}</span><span class="muted">${escapeHtml(p.date)}</span></div>
    <div class="theater-swatch" data-theater="${p.id}"></div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.intro)}</p>
    <div class="scenario-side"><span>ฝ่ายผู้เล่น: ${escapeHtml(p.side)}</span><span>ฝ่ายอื่น: ${escapeHtml(p.opposition)}</span></div>
    <div class="helper-note"><strong>เป้าหมายการจำลอง:</strong> ${escapeHtml(p.goal)}</div>
    <div class="scenario-card-actions"><button class="btn btn-primary" data-preview-scenario="${p.id}">${active?'เริ่ม Scenario นี้ใหม่':'เลือก Scenario'}</button>${p.source?`<a href="${p.source}" target="_blank" rel="noopener noreferrer">ที่มาประวัติศาสตร์ ↗</a>`:''}</div>
  </article>`;
}
function renderScenariosPage(){
  const root=document.getElementById('scenarioCards');if(!root)return;
  // This page has no text inputs; safely repaint on simulation ticks.
  root.innerHTML=Scenarios.presets.filter(p=>scenarioEraFilter==='all'||p.era===scenarioEraFilter).map(scenarioCard).join('');
  root.querySelectorAll('[data-preview-scenario]').forEach(b=>b.onclick=()=>showScenarioConfirm(b.dataset.previewScenario));
  document.querySelectorAll('[data-era]').forEach(b=>b.classList.toggle('active',b.dataset.era===scenarioEraFilter));
}
function showScenarioConfirm(id){
  selectedNextScenarioId=id;
  const p=Scenarios.byId(id),el=document.getElementById('scenarioModalChoice');
  el.innerHTML=`<strong>${escapeHtml(p.name)}</strong><div class="muted">${escapeHtml(p.date)} • ${escapeHtml(p.tag)}</div><p>${escapeHtml(p.goal)}</p><div class="helper-note">ยืนยันแล้วโลกจำลองและหน่วยทั้งหมดจะเริ่มต้นใหม่ ไฟล์บันทึกเดิมไม่ถูกลบ</div>`;
  document.getElementById('scenarioModal').hidden=false;
}
function renderSustainPage(){
  if(!state.sustain)return;
  const sum=document.getElementById('sustainSummary');if(!sum)return;
  const units=friendlyCompanies();
  const needy=units.filter(u=>u.supply<40).length;
  const wounded=units.reduce((t,u)=>t+(Sustain.unitSummary(u)?.wounded||0),0);
  const damaged=units.reduce((t,u)=>t+(Sustain.unitSummary(u)?.repair||0),0);
  const inTransit=state.sustain.transports.filter(t=>t.status==='moving').length;
  sum.innerHTML=[['หน่วยเสบียงต่ำ',needy,'กองร้อย'],['ผู้บาดเจ็บ',wounded,'คน'],['ยานพาหนะระหว่างซ่อม',damaged,'คัน'],['ขนส่งระหว่างทาง',inTransit,'เที่ยว']].map(([label,value,unit])=>`<div class="sustain-stat"><small>${label}</small><strong>${value}</strong><span>${unit}</span></div>`).join('');
  const select=document.getElementById('sustainUnit');const depot=document.getElementById('sustainDepot');const res=document.getElementById('sustainResource');
  // Avoid disrupting a form while the user is selecting amounts and destinations.
  if(!select.dataset.ready){
    select.innerHTML=units.map(u=>`<option value="${u.id}">${escapeHtml(u.name)} • ${escapeHtml(commanderNameForUnit(u))}</option>`).join('');
    depot.innerHTML=state.depots.map(d=>`<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
    res.innerHTML=Object.entries(Sustain.TYPES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
    select.dataset.ready='yes';
    select.value=units[0]?.id||'';
  }
  const selected=getUnit(select.value)||units[0];
  document.getElementById('sustainDepots').innerHTML=state.depots.map(d=>`<div class="sustain-depot"><strong>${escapeHtml(d.name)}</strong><div class="sustain-inventory">${Object.entries(Sustain.TYPES).map(([k,t])=>`<div><span>${t.label}</span><strong>${Math.round(d.resources?.[k]||0)}</strong></div>`).join('')}</div></div>`).join('');
  if(selected?.sustain){
    const r=selected.sustain, data=Sustain.unitSummary(selected);
    if(!(state.activeView==='sustain' && document.activeElement?.closest('#sustainUnitBoard'))) document.getElementById('sustainUnitBoard').innerHTML=`<div class="sustain-unit-card"><div class="row"><h3>${escapeHtml(selected.name)}</h3><span class="tag">${Math.round(selected.supply)}% เสบียง</span></div><div class="muted">${escapeHtml(commanderNameForUnit(selected))} • ${escapeHtml(selected.unitRole||'Fictional Unit')}</div>
      <div class="sustain-inventory">${Object.entries(Sustain.TYPES).map(([k,t])=>`<div><span>${t.label}</span><strong>${Math.round(r.stocks[k])}</strong></div>`).join('')}</div>
      <div class="sustain-mini-metrics"><span>บาดเจ็บ <strong>${data.wounded}</strong></span><span>ป่วย <strong>${data.sick}</strong></span><span>พักฟื้น <strong>${data.resting}</strong></span><span>รถระหว่างซ่อม <strong>${data.repair}</strong></span></div>
      ${barRow('ความขาดแคลนอาหาร',r.hunger)}${barRow('ความเสี่ยงขาดน้ำ',r.dehydration)}
      <div class="sustain-setters"><label>การแบ่งอาหาร<select id="rationSetting" class="text-input"><option value="normal">มาตรฐาน</option><option value="conserve">ประหยัด</option><option value="strict">จำกัด</option></select></label>
      <label>ลำดับความสำคัญรักษาพยาบาล<select id="medPriority" class="text-input"><option value="balanced">สมดุล</option><option value="urgent">เร่งด่วน</option><option value="conserve">ประหยัดทรัพยากร</option></select></label>
      <label>ลำดับงานซ่อม<select id="repairPriority" class="text-input"><option value="balanced">สมดุล</option><option value="urgent">เร่งด่วน</option><option value="conserve">ประหยัดอะไหล่</option></select></label></div></div>`;
    const ration=document.getElementById('rationSetting'),med=document.getElementById('medPriority'),repair=document.getElementById('repairPriority');
    ration.value=r.rationing;med.value=r.medicalPriority;repair.value=r.maintenancePriority;
    ration.onchange=e=>{r.rationing=e.target.value;showToast('เปลี่ยนนโยบายแบ่งอาหารแล้ว');};
    med.onchange=e=>{r.medicalPriority=e.target.value;showToast('ปรับงานแพทย์แล้ว');};
    repair.onchange=e=>{r.maintenancePriority=e.target.value;showToast('ปรับงานซ่อมแล้ว');};
  }
  const transports=state.sustain.transports.slice(0,10);
  document.getElementById('sustainTransit').innerHTML=`<div class="sustain-transit-grid"><div><h3>ขนส่งล่าสุด</h3>${transports.length?transports.map(t=>`<div class="sustain-transit-item"><strong>${escapeHtml(Sustain.TYPES[t.type]?.label||t.type)} ${t.amount}</strong><span>${escapeHtml(getUnit(t.unitId)?.name||'')}</span><small>${t.status==='moving'?`ระหว่างทาง • เหลือ ${Math.max(0,Math.ceil(t.endAt-state.absMinutes))} นาที`:'ถึงแล้ว'}</small></div>`).join(''):'<p class="muted">ยังไม่มีขบวนขนส่งใหม่</p>'}</div><div><h3>ประวัติการสนับสนุน</h3>${state.sustain.history.slice(0,10).map(h=>`<div class="sustain-transit-item"><small>+${Math.round(h.stamp)} นาทีในเกม</small><span>${escapeHtml(h.message)}</span></div>`).join('')||'<p class="muted">ยังไม่มีเหตุการณ์</p>'}</div></div>`;
}
function setupV08Events(){
  document.querySelectorAll('[data-era]').forEach(b=>b.onclick=()=>{scenarioEraFilter=b.dataset.era;renderScenariosPage();});
  document.getElementById('sustainDispatchForm')?.addEventListener('submit',ev=>{
    ev.preventDefault();
    const result=Sustain.dispatch(state,document.getElementById('sustainUnit').value,document.getElementById('sustainDepot').value,document.getElementById('sustainResource').value,document.getElementById('sustainAmount').value);
    showToast(result.message);renderAll();
  });
  document.getElementById('sustainUnit')?.addEventListener('change',()=>renderSustainPage());
}

// Build 0.9: era context and optional diagnostics for testing opponent NPC, off by default.
let showOpponentDiagnostics=false;
function renderEraPanel(){
  const root=document.getElementById('eraOverview');if(!root)return;
  const kit=Era.of(state),theater=Theaters.config();
  root.innerHTML=`<div class="era-hero"><div class="eyebrow">ACTIVE THEATER • ${escapeHtml(state.scenario?.era||'sandbox')}</div><h3>${escapeHtml(kit.label)}</h3><p>${escapeHtml(kit.description)}</p></div>
    <div class="theater-swatch" data-theater="${escapeHtml(Theaters.id())}"></div>
    <div class="era-metric"><span>ภูมิประเทศของ Scenario</span><strong>${escapeHtml(theater.name)}</strong></div>
    <div class="era-metric"><span>บริบทแผนที่</span><strong>${escapeHtml(theater.subtitle)}</strong></div>
    <div class="era-metric"><span>รูปแบบการสื่อสาร</span><strong>${escapeHtml(kit.radio)}</strong></div>
    <div class="era-metric"><span>อาวุธประจำยุค (หมวดจำลอง)</span><strong>${escapeHtml(kit.weapon)}</strong></div>
    <div class="era-metric"><span>ระบบขนส่ง</span><strong>${escapeHtml(kit.transport)}</strong></div>
    <div class="era-metric"><span>ฝ่ายซ่อมบำรุง</span><strong>${escapeHtml(kit.repair)}</strong></div>
    <div class="helper-note" style="margin-top:12px">กฎความพร้อมและการใช้ทรัพยากรแต่ละยุคเป็นสูตรที่ออกแบบสำหรับเกม ไม่ได้อ้างสเปกทางเทคนิคจริงของยุทโธปกรณ์</div>`;
  const opp=document.getElementById('opponentOverview');
  const stats=Opponent.stats(state);
  const diagnostics=showOpponentDiagnostics?`<div class="era-diagnostics"><strong>ข้อมูลสำหรับตรวจสอบแบบจำลอง (DEBUG)</strong><small>ส่วนนี้เปิดเผยข้อมูลที่ปกติซ่อนจากผู้เล่น ไม่ใช่ข่าวกรองที่หน่วยของคุณได้รับ</small>
    <div class="era-metric"><span>เป้าหมาย AI ล่าสุด</span><strong>${escapeHtml(stats.goal.label)}</strong></div>
    <div class="era-metric"><span>เหตุผลโดยทั่วไป</span><strong>${escapeHtml(stats.goal.description)}</strong></div>
    <div class="era-status-list">${stats.history.map(h=>`<div>+${h.time} นาที • ${escapeHtml(Opponent.goals[h.goal]?.label||h.goal)} • ความพร้อม ${h.readiness}% • เสบียง ${h.supply}%</div>`).join('')||'<div>รอรอบการประเมินแรก</div>'}</div></div>`:'';
  opp.innerHTML=`<div class="era-hero"><div class="eyebrow">PERSISTENT OPPONENT LOGIC</div><h3>AI ดำเนินงานอย่างต่อเนื่อง</h3><p>ปรับภารกิจตนเองเมื่อทรัพยากรลดลง ความเหนื่อยล้าสะสม หรือความพร้อมเปลี่ยน ไม่มีการสุ่มจุดหมายใหม่ทุกเฟรม</p></div>
    <div class="era-grid"><div class="stat-tile"><div class="muted">รอบประเมินของ AI</div><div class="big">${stats.decisionCount}</div></div><div class="stat-tile"><div class="muted">ครั้งล่าสุด</div><div class="big">${Math.round(stats.lastReview)} <small style="font-size:11px">นาที</small></div></div></div>
    <p class="muted" style="margin-top:10px">AI ที่แสดงบนแผนที่ยังอยู่ภายใต้ Fog of War ตามระบบข่าวกรอง</p>
    <button id="opponentDiagnosticsToggle" class="btn btn-ghost full" type="button">${showOpponentDiagnostics?'ปิดข้อมูลตรวจสอบ AI':'เปิดข้อมูลตรวจสอบ AI (Debug)'}</button>${diagnostics}`;
  opp.querySelector('#opponentDiagnosticsToggle').onclick=()=>{showOpponentDiagnostics=!showOpponentDiagnostics;renderEraPanel();};
  const units=document.getElementById('eraUnits');
  units.innerHTML=friendlyCompanies().map(u=>{
    const k=u.eraKit||{},v=u.establishment?.vehicles||{};
    return `<div class="era-unit"><span class="tag">${escapeHtml(k.era||'sandbox')}</span><h3>${escapeHtml(u.name)}</h3>
      <p>${escapeHtml(k.role||u.unitRole||'General Unit')}</p><p>${escapeHtml(commanderNameForUnit(u))}</p>
      <div class="era-metric"><span>วิทยุ/การสื่อสาร</span><strong>${escapeHtml(k.radio||'Field Network')}</strong></div>
      <div class="era-metric"><span>หมวดอาวุธ</span><strong>${escapeHtml(k.weapon||'Fictional Small Arms')}</strong></div>
      <div class="era-metric"><span>รถและยานพาหนะ</span><strong>${Number(v.operational||0)} / ${Number(v.authorized||0)} พร้อมใช้</strong></div>
      <div class="era-metric"><span>ระหว่างซ่อม</span><strong>${Number(v.underRepair||0)}</strong></div>
      <div class="era-metric"><span>สภาพอุปกรณ์</span><strong>${Math.max(0,Math.round(100-(u.establishment?.equipmentWear||0)))}%</strong></div>
      <button class="btn btn-ghost full" data-era-select="${u.id}">เลือกหน่วยบนแผนที่</button></div>`;
  }).join('');
  units.querySelectorAll('[data-era-select]').forEach(b=>b.onclick=()=>{state.selectedUnitId=b.dataset.eraSelect;setView('operations');renderAll();});
}
