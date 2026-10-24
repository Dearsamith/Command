/* THE ART OF COMMAND v1.0 LOCAL — single-player, no server and no background world ticks.
   IndexedDB stores deep history; localStorage keeps a synchronous current-world recovery copy. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'art_of_command_v10_offline';
  const DB_NAME = 'art_of_command_local_v10';
  const LEGACY = ['art_of_command_v10','art_of_command_v09','art_of_command_v08','art_of_command_v07','art_of_command_v06','art_of_command_v05','art_of_command_v04'];
  const AUTOSAVE_MS = 4500, SNAPSHOT_EVERY = 360;
  const clone = x => JSON.parse(JSON.stringify(x));
  let db = null, fallback = false, initialized = false, lastSnapshotAt = -1, lastCycle = -1;
  let knownEvents = new Set(), historyOffset = 0, busy = false, lastPersisted = 0;
  let archive = { timeline: [], snapshots: [], economy: [] };
  let statusError = false;
  const campaignKey = () => String(state.offlineCampaignId || 'default');
  const nowISO = () => new Date().toISOString();
  const campaignId = () => 'campaign-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
  const safeStore = (key, value) => { try { localStorage.setItem(key,value); return true; } catch { return false; } };
  const safeRead = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const fmt = n => Math.round(Number(n)||0).toLocaleString('th-TH');

  function status(message) {
    $('offlineStatus').textContent = message;
    $('offlineMeta').textContent = fallback ? 'ใช้โหมดจัดเก็บสำรองในเบราว์เซอร์ • ประวัติอาจเก็บได้จำกัด' : 'บันทึกอัตโนมัติทุก 4.5 วินาที • ประวัติ/ภาพ ผบช. เก็บในเครื่องนี้';
  }
  function failure(message) {
    if(!statusError){ showToast(message); statusError = true; }
    status('LOCAL MODE — ตรวจสอบพื้นที่จัดเก็บ');
  }
  function openDb() {
    return new Promise((resolve,reject) => {
      if(!window.indexedDB) return reject(Error('IndexedDB ไม่พร้อมใช้งาน'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if(!d.objectStoreNames.contains('state')) d.createObjectStore('state',{keyPath:'key'});
        if(!d.objectStoreNames.contains('timeline')) d.createObjectStore('timeline',{keyPath:'pk'});
        if(!d.objectStoreNames.contains('economy')) d.createObjectStore('economy',{keyPath:'pk'});
        if(!d.objectStoreNames.contains('snapshots')) d.createObjectStore('snapshots',{keyPath:'id',autoIncrement:true});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error||Error('เปิด IndexedDB ไม่สำเร็จ'));
    });
  }
  function getOne(store,key) {
    return new Promise((resolve,reject) => {
      if(!db) return resolve(null);
      const t=db.transaction(store,'readonly');const req=t.objectStore(store).get(key);
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
    });
  }
  function getAll(store) {
    return new Promise((resolve,reject) => {
      if(!db) return resolve(archive[store]||[]);
      const t=db.transaction(store,'readonly');const req=t.objectStore(store).getAll();
      req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
    });
  }
  function batchPut(store, records) {
    if(!records.length || !db) return Promise.resolve();
    return new Promise((resolve,reject) => {
      const tx=db.transaction(store,'readwrite'), os=tx.objectStore(store);
      for(const record of records) os.put(record);
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
    });
  }
  function batchDelete(store, keys) {
    if(!keys.length || !db) return Promise.resolve();
    return new Promise((resolve,reject) => {
      const tx=db.transaction(store,'readwrite'), os=tx.objectStore(store);
      keys.forEach(k=>os.delete(k));
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
    });
  }
  function fallbackLoad(){
    try {
      const raw=safeRead(DB_NAME+'_fallback');
      if(raw) archive={...archive,...JSON.parse(raw)};
    } catch { /* ignore corrupt archive, current save remains available */ }
  }
  function fallbackSave(){
    archive.timeline=archive.timeline.slice(-380);
    archive.snapshots=archive.snapshots.slice(-5);
    archive.economy=archive.economy.slice(-220);
    // Do not allow a fallback archive quota error to affect the current game.
    safeStore(DB_NAME+'_fallback',JSON.stringify(archive));
  }
  function loadJsonCandidate(){
    for(const key of [SAVE_KEY,...LEGACY]) {
      const raw=safeRead(key); if(!raw)continue;
      try {const value=JSON.parse(raw);if(Array.isArray(value.units)) return value;} catch { /* try next */ }
    }
    return null;
  }
  function hydrate(saved) {
    // Match previous game's migration logic without simulation of real-world elapsed time.
    if(!saved || !Array.isArray(saved.units))return false;
    if(!Object.prototype.hasOwnProperty.call(saved,'nations')){
      delete state.nations;delete state.diplomacy;delete state.market;delete state.nationEvents;delete state.nationActions;
    }
    Object.assign(state,clone(saved));
    const preset=Scenarios.byId(state.scenarioId||'sandbox');
    if(!state.scenario || state.scenario.id!==preset.id) state.scenario={...preset,title:preset.name};
    else state.scenario.era=preset.era;
    rebuildChildren();Theaters.activate(state.scenarioId||'sandbox');World.initialize(state,true);
    initializeSystems(true);C2.initialize(state,true);Era.apply(state,true);Opponent.initialize(state,true);Nations.initialize(state,true);
    state.scenarioId ||= 'sandbox';
    state.offlineCampaignId ||= campaignId();
    // A previous version may have been paused by the user: preserve it.
    simulatedAccumulator=0;lastFrameAt=0;
    setView(uiMeta[state.activeView] ? state.activeView : 'overview');
    renderAll();
    return true;
  }
  function saveCurrent() {
    if(!initialized)return;
    const snapshot=JSON.stringify(state);
    const ok=safeStore(SAVE_KEY,snapshot);
    if(!ok){failure('พื้นที่จัดเก็บเบราว์เซอร์เต็ม กรุณาสำรองไฟล์ JSON');return;}
    lastPersisted=Date.now();
    if(db) batchPut('state',[{key:'current',value:state,updated_at:nowISO()}]).catch(()=>failure('บันทึก IndexedDB ไม่สำเร็จ'));
    if(fallback)fallbackSave();
    if(!statusError)status(document.hidden?'LOCAL SAVE — หยุดเวลาเมื่อไม่ได้เปิดเล่น':state.paused?'LOCAL SAVE — หยุดเวลา':'LOCAL SAVE — โลกกำลังดำเนินอยู่');
  }
  function addEventRows(){
    if(!state.offlineCampaignId)return;
    const events=(state.events||[]).slice().reverse();
    const newRows=[];
    for(const e of events){
      const pk=campaignKey()+'/'+String(e.id);
      if(knownEvents.has(pk))continue;
      knownEvents.add(pk);
      const match=/D(\d+)\s+(\d{1,2}):(\d{2})/.exec(String(e.stamp||''));
      const relative=match ? ((state.day-Number(match[1]))*1440+(state.timeMinutes-(Number(match[2])*60+Number(match[3])))) : 0;
      const at=Math.max(0,(Number(state.absMinutes)||0)-Math.max(0,relative));
      newRows.push({pk,campaign:campaignKey(),category:String(e.source||'EVENT'),description:String(e.message||''),stamp:String(e.stamp||''),game_minute:at,created_at:nowISO()});
    }
    if(newRows.length){
      if(db)batchPut('timeline',newRows).catch(()=>failure('บันทึกประวัติเหตุการณ์ไม่สำเร็จ'));
      else {archive.timeline.push(...newRows);fallbackSave();}
    }
  }
  function addEconomyRows(){
    const cycle=Math.round(Number(state.market?.cycles)||0);
    if(cycle<=0 || cycle===lastCycle)return;
    lastCycle=cycle;
    const entries=(state.nations||[]).map(n=>({
      pk:campaignKey()+'/'+cycle+'/'+n.id,campaign:campaignKey(),game_minute:Number(state.absMinutes)||0,
      cycle,nation_id:n.id,treasury:n.treasury,stability:n.stability,industry:n.industry,prices:n.prices,created_at:nowISO()
    }));
    if(db)batchPut('economy',entries).catch(()=>failure('บันทึกประวัติเศรษฐกิจไม่สำเร็จ'));
    else {archive.economy.push(...entries);fallbackSave();}
  }
  async function makeSnapshot(reason='manual'){
    if(!initialized)return;
    const snap={campaign:campaignKey(),reason,game_minute:Number(state.absMinutes)||0,created_at:nowISO(),state:clone(state)};
    if(db){
      await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').add(snap);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    } else {snap.id=Date.now();archive.snapshots.push(snap);fallbackSave();}
    lastSnapshotAt=Number(state.absMinutes)||0;
  }
  function harvest(){
    if(!initialized)return;
    addEventRows();addEconomyRows();
    const elapsed=Number(state.absMinutes)||0;
    if(lastSnapshotAt<0 || elapsed-lastSnapshotAt>=SNAPSHOT_EVERY){
      lastSnapshotAt=elapsed;
      makeSnapshot('automatic').catch(()=>failure('ไม่สามารถเก็บ Snapshot ได้'));
    }
  }
  const localFormat={food:'อาหาร',fuel:'เชื้อเพลิง',materials:'วัสดุ',medicine:'เวชภัณฑ์'};
  function renderNations(){
    const root=$('nationWorldPanel');if(!root)return;
    if(!state.nations?.length) Nations.initialize(state,true);
    const data=state.nations||[];
    const cards=data.map(n=>`<div class="nation-tile"><div class="nation-title"><span class="nation-flag" style="background:${n.tone||'#8b9d78'}"></span><div><strong>${escapeHtml(n.name)}</strong><div class="muted">${escapeHtml(n.short||n.id)} · ประชากร ${n.population} ล้านคน</div></div></div><div class="country-stats"><span>คลัง <b>${fmt(n.treasury)}</b></span><span>หนี้ <b>${fmt(n.debt)}</b></span><span>อุตสาหกรรม <b>${fmt(n.industry)}%</b></span><span>เสถียรภาพ <b>${fmt(n.stability)}%</b></span><span>ราคาสินค้า <b>${fmt(n.prices)}</b></span><span>พลังงาน <b>${fmt(n.energy)}%</b></span></div><div class="stocks-grid">${Object.entries(n.stocks).map(([k,v])=>`<div>${localFormat[k]||k}<b>${fmt(v)}</b></div>`).join('')}</div></div>`).join('');
    const rel=(state.diplomacy||[]).map(d=>`<div class="diplomacy-item"><b>${escapeHtml(state.nations.find(x=>x.id===d.a)?.short||d.a)}</b> ↔ <b>${escapeHtml(state.nations.find(x=>x.id===d.b)?.short||d.b)}</b> <span>ความสัมพันธ์ ${fmt(d.relation)}%</span><small>${d.trade?'● ค้าขาย':'○ ไม่มีข้อตกลง'}</small></div>`).join('');
    root.innerHTML=`<div class="nation-grid">${cards}</div><div class="grid-2"><div class="panel inner-panel"><div class="eyebrow">DIPLOMACY & TRADE</div>${rel}</div><div class="panel inner-panel"><div class="eyebrow">POLICY — ${escapeHtml(data[0]?.short||'HOME')}</div><p class="muted">บริหารประเทศหลักโดยตรง ประเทศอื่นดำเนินเศรษฐกิจด้วยแบบจำลอง</p><div class="national-actions">${Object.entries(Nations.policies).map(([k,p])=>`<button class="btn btn-secondary" data-national-policy="${k}">${p.label} · ${p.cost}</button>`).join('')}</div></div></div><div class="panel inner-panel"><div class="eyebrow">GLOBAL COMMODITY PRICES</div><div class="market-grid">${['food','fuel','materials','medicine'].map(k=>`<div><span>${localFormat[k]}</span><b>${fmt(state.market?.[k]||100)}</b></div>`).join('')}</div><div class="muted">เศรษฐกิจอัปเดตทุก 60 นาทีในเกม เฉพาะตอนเปิดเล่น</div></div>`;
    root.querySelectorAll('[data-national-policy]').forEach(btn=>btn.onclick=()=>{const r=Nations.action(state,btn.dataset.nationalPolicy);showToast(r.text||r.error);harvest();renderAll();saveCurrent();});
  }
  function timelineHtml(rows){return rows.map(e=>`<div class="timeline-row"><div><b>${escapeHtml(e.category)}</b><small>GAME +${fmt(e.game_minute)} นาที · ${escapeHtml(e.stamp||'')}</small></div><div>${escapeHtml(e.description)}</div><time>${new Date(e.created_at).toLocaleString('th-TH')}</time></div>`).join('');}
  async function loadHistory(reset=true){
    if(!initialized)return;
    harvest();
    if(reset)historyOffset=0;
    const category=$('historyCategory')?.value||'';
    const all=(await getAll('timeline')).filter(e=>e.campaign===campaignKey() && (!category||e.category===category));
    all.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.pk.localeCompare(a.pk));
    const rows=all.slice(historyOffset,historyOffset+70),html=timelineHtml(rows);
    if(reset)$('historyTimeline').innerHTML=html||'<div class="helper-note">ยังไม่มีเหตุการณ์ในโลกนี้</div>';
    else $('historyTimeline').insertAdjacentHTML('beforeend',html);
    historyOffset+=rows.length;$('historyMore').disabled=historyOffset>=all.length;
    renderSnapshotList((await getAll('snapshots')).filter(x=>x.campaign===campaignKey()).slice().sort((a,b)=>b.id-a.id).slice(0,50));
    renderEconomy((await getAll('economy')).filter(x=>x.campaign===campaignKey()).slice(-1500));
  }
  function renderSnapshotList(rows){
    $('historySnapshots').innerHTML=rows.map(s=>`<button class="snapshot-item" data-snapshot="${s.id}"><strong>#${s.id}</strong><span>${escapeHtml(s.reason)}</span><small>เกมนาที ${fmt(s.game_minute)} · ${new Date(s.created_at).toLocaleString('th-TH')}</small></button>`).join('')||'<div class="helper-note">ยังไม่มี Snapshot</div>';
    $('historySnapshots').querySelectorAll('[data-snapshot]').forEach(btn=>btn.onclick=()=>showSnapshot(btn.dataset.snapshot));
  }
  async function showSnapshot(id){
    try{
      const row=db?await getOne('snapshots',Number(id)):archive.snapshots.find(s=>String(s.id)===String(id));
      if(!row)throw Error('ไม่พบ Snapshot');
      const s=row.state,units=(s.units||[]).filter(u=>u.side==='ally'&&u.echelon==='company');
      const ready=units.length?Math.round(units.reduce((a,u)=>a+(u.readiness||0),0)/units.length):0;
      const date=`DAY ${s.day} · ${String(Math.floor(s.timeMinutes/60)).padStart(2,'0')}:${String(Math.floor(s.timeMinutes%60)).padStart(2,'0')}`;
      $('historySnapshotDetail').innerHTML=`<h3>Snapshot #${row.id}</h3><div class="muted">${date} · ${escapeHtml(s.scenarioId||'sandbox')}</div><div class="subgrid"><div class="small-box">กำลังพร้อม <b>${fmt(units.reduce((a,u)=>a+(u.strength||0),0))}</b></div><div class="small-box">ความพร้อมเฉลี่ย <b>${ready}%</b></div><div class="small-box">ประเทศ <b>${s.nations?.length||0}</b></div><div class="small-box">ภารกิจ <b>${s.missions?.length||0}</b></div></div><div class="snapshot-nations">${(s.nations||[]).map(n=>`<div>${escapeHtml(n.short||n.name)} <b>${fmt(n.treasury)}</b></div>`).join('')}</div><button id="downloadSnapshot" class="btn btn-ghost">ดาวน์โหลด JSON Snapshot</button>`;
      $('downloadSnapshot').onclick=()=>downloadJSON(s,`art-of-command-snapshot-${id}.json`);
    }catch(e){$('historySnapshotDetail').textContent=e.message;}
  }
  function renderEconomy(rows){
    const grouped={};for(const r of rows.slice().sort((a,b)=>a.cycle-b.cycle)){(grouped[r.nation_id] ||= []).push(r);}
    const series=Object.entries(grouped),width=660,height=230,pad=27;
    const max=Math.max(1,...rows.map(r=>Number(r.treasury)||0));
    const paths=series.map(([id,arr],idx)=>{
      const coords=arr.map((r,i)=>`${(pad+(width-pad*2)*i/Math.max(1,arr.length-1)).toFixed(1)},${(height-pad-r.treasury/max*(height-pad*2)).toFixed(1)}`).join(' ');
      const color=(state.nations||[]).find(n=>n.id===id)?.tone||['#9bbd78','#c5aa82','#7db7c0','#c4c179'][idx%4];
      return `<polyline points="${coords}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round"/>`;
    }).join('');
    $('historyEconomy').innerHTML=rows.length?`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="กราฟเงินคลังย้อนหลังของประเทศ" class="history-graph"><path d="M${pad} ${pad}V${height-pad}H${width-pad}" stroke="#586d52" fill="none"/>${paths}</svg><div class="econ-legend">${series.map(([id])=>{const n=state.nations?.find(x=>x.id===id);return `<span><i style="background:${n?.tone||'#a3ae96'}"></i>${escapeHtml(n?.short||id)}</span>`;}).join('')}</div><p class="muted">ข้อมูลเงินคลังบันทึกตามเวลาเกม ไม่ใช่ข้อมูลจริง</p>`:'<div class="helper-note">กราฟจะปรากฏหลังผ่านเวลาในเกมครบ 60 นาที</div>';
  }
  function downloadJSON(body,file){
    const blob=new Blob([JSON.stringify(body,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function backupAll(){
    harvest();saveCurrent();
    const [timeline,snapshots,economy]=await Promise.all(['timeline','snapshots','economy'].map(getAll));
    downloadJSON({format:'aoc-offline-backup-v1',savedAt:nowISO(),state:clone(state),history:{timeline:timeline.filter(x=>x.campaign===campaignKey()),snapshots:snapshots.filter(x=>x.campaign===campaignKey()),economy:economy.filter(x=>x.campaign===campaignKey())}},`the-art-of-command-offline-backup-${state.scenarioId||'sandbox'}.json`);
    showToast('ส่งออกไฟล์สำรองโลกและประวัติแล้ว');
  }
  async function importBackup(raw){
    const data=JSON.parse(raw), imported=data?.state&&Array.isArray(data.state.units)?data.state:data;
    if(!Array.isArray(imported.units))throw Error('ไฟล์ JSON นี้ไม่ใช่เซฟเกมที่รองรับ');
    if(!confirm('นำเข้าไฟล์และแทนที่โลกที่กำลังเล่นอยู่ใช่หรือไม่? แนะนำให้สำรองเกมปัจจุบันก่อน'))return;
    if(!hydrate(imported))throw Error('โหลดข้อมูลไม่สำเร็จ');
    if(!data?.history)state.offlineCampaignId=campaignId();
    knownEvents=new Set();lastCycle=Math.floor(Number(state.market?.cycles)||0);lastSnapshotAt=-1;
    if(data.history){
      const arch=data.history;
      const oldKey=String(imported.offlineCampaignId||'default');
      const rekey=obj=>{const x=clone(obj);x.campaign=campaignKey();if(x.pk) x.pk=x.pk.replace(oldKey+'/',campaignKey()+'/');return x;};
      if(db){
        const timeline=(arch.timeline||[]).map(rekey),econ=(arch.economy||[]).map(rekey);
        await batchPut('timeline',timeline);await batchPut('economy',econ);
        for(const s of (arch.snapshots||[])){const next=rekey(s);delete next.id;await new Promise((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').add(next);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
      }else{
        archive.timeline.push(...(arch.timeline||[]).map(rekey));archive.economy.push(...(arch.economy||[]).map(rekey));archive.snapshots.push(...(arch.snapshots||[]).map(rekey));fallbackSave();
      }
    }
    const oldTimeline=(await getAll('timeline')).filter(e=>e.campaign===campaignKey());
    oldTimeline.forEach(e=>knownEvents.add(e.pk));
    saveCurrent();renderAll();await loadHistory(true);showToast('นำเข้าเซฟและประวัติสำเร็จ');
  }
  function newCampaign(){
    state.offlineCampaignId=campaignId();knownEvents.clear();lastSnapshotAt=-1;lastCycle=-1;
    harvest();saveCurrent();
    if(state.activeView==='history')loadHistory(true);
  }
  function afterLoad(){
    state.offlineCampaignId ||= campaignId();
    knownEvents.clear();lastSnapshotAt=-1;lastCycle=-1;
    harvest();saveCurrent();
    if(state.activeView==='history')loadHistory(true);
  }
  function afterSave(){harvest();saveCurrent();}
  async function boot(){
    $('offlineImportButton').onclick=()=>$('offlineImportFile').click();
    $('offlineImportFile').onchange=async ev=>{const f=ev.target.files?.[0];if(!f)return;try{await importBackup(await f.text());}catch(e){showToast('นำเข้าไฟล์ไม่สำเร็จ: '+e.message);}finally{ev.target.value='';}};
    $('offlineBackupButton').onclick=()=>backupAll().catch(e=>showToast('ส่งออกข้อมูลไม่สำเร็จ: '+e.message));
    document.getElementById('mainNav').addEventListener('click',ev=>{if(ev.target.closest('[data-view="history"]'))setTimeout(()=>loadHistory(true),0);});
    $('historyCategory').onchange=()=>loadHistory(true);
    $('historyReload').onclick=()=>loadHistory(true);
    $('historyMore').onclick=()=>loadHistory(false);
    $('historySaveSnapshot').onclick=async()=>{try{await makeSnapshot('manual');await loadHistory(true);showToast('บันทึก Snapshot ในเครื่องแล้ว');}catch(e){showToast('เก็บ Snapshot ไม่สำเร็จ: '+e.message);}};
    try {db=await openDb();} catch {fallback=true;fallbackLoad();}
    let saved=loadJsonCandidate();
    if(!saved && db){try{saved=(await getOne('state','current'))?.value||null;}catch{ /* create new world */ }}
    if(saved)hydrate(saved);
    state.offlineCampaignId ||= campaignId();
    const previous=(await getAll('timeline')).filter(e=>e.campaign===campaignKey());
    previous.forEach(e=>knownEvents.add(e.pk));
    const allSnapshots=(await getAll('snapshots')).filter(s=>s.campaign===campaignKey());
    lastSnapshotAt=allSnapshots.length?Math.max(...allSnapshots.map(s=>Number(s.game_minute)||0)):-1;
    lastCycle=Math.floor(Number(state.market?.cycles)||0);
    initialized=true;
    harvest();saveCurrent();
    setInterval(()=>{if(!document.hidden){harvest();saveCurrent();}},AUTOSAVE_MS);
    document.addEventListener('visibilitychange',()=>{
      // No catch-up after returning from an invisible tab.
      lastFrameAt=0;simulatedAccumulator=0;
      if(document.hidden){harvest();saveCurrent();}
      else {status(state.paused?'LOCAL SAVE — หยุดเวลา':'LOCAL SAVE — โลกกำลังดำเนินอยู่');renderAll();}
    });
    window.addEventListener('pagehide',()=>{harvest();saveCurrent();});
    $('loadButton').onclick=()=>{loadGame();};
    $('saveButton').onclick=()=>{saveGame();};
    await loadHistory(true);
  }
  window.OfflineWorld={newCampaign,afterLoad,afterSave,loadHistory,saveCurrent,makeSnapshot,backupAll,importBackup};
  document.addEventListener('DOMContentLoaded',boot);
  const oldRender=renderAll;
  renderAll=function(){oldRender();renderNations();};
})();
