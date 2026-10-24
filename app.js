/* THE ART OF COMMAND — fictional continuous-time browser wargame prototype.
   All unit counts, rates, terrain and engagement rules are synthetic game values.
   There is no claim of military-model validity. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const W = 34, H = 22, T = 32;
  const UNIT_TYPES = {INF:'ทหารราบ', CAV:'หน่วยเคลื่อนที่', ENG:'ทหารช่าง', LOG:'ขนส่ง', MED:'การแพทย์', HQ:'กองบัญชาการ'};
  const UNIT_SIGNS = {INF:'X',CAV:'◈',ENG:'E',LOG:'S',MED:'+',HQ:'HQ'};
  const CITY_NAMES = ['ป้อมลำธาร','ทางผ่านกลาง','ทุ่งสน','เมืองตะวันออก','เหมืองเก่า'];
  const townBlueprint = [
    {x:6,y:7,name:CITY_NAMES[0]}, {x:16,y:8,name:CITY_NAMES[1]},
    {x:9,y:16,name:CITY_NAMES[2]}, {x:26,y:8,name:CITY_NAMES[3]},
    {x:23,y:16,name:CITY_NAMES[4]}
  ];
  const depotBlueprint = [{x:4,y:11,team:'blue',name:'คลังหลัก'}, {x:29,y:11,team:'red',name:'คลังตะวันออก'}];
  const defaultUnits = [
    {id:'B1',team:'blue',name:'กองพลที่ 1',code:'1 INF',type:'INF',x:7,y:7,men:3250,readiness:86,morale:82,supply:86,fatigue:12,view:6},
    {id:'B2',team:'blue',name:'กองพลที่ 2',code:'2 INF',type:'INF',x:7,y:15,men:2780,readiness:78,morale:75,supply:76,fatigue:20,view:6},
    {id:'B3',team:'blue',name:'หน่วยลาดตระเวน',code:'REC',type:'CAV',x:10,y:10,men:820,readiness:89,morale:83,supply:82,fatigue:16,view:8},
    {id:'B4',team:'blue',name:'กองพันทหารช่าง',code:'ENG',type:'ENG',x:6,y:5,men:540,readiness:82,morale:79,supply:85,fatigue:9,view:5},
    {id:'B5',team:'blue',name:'กองพันส่งกำลัง',code:'LOG',type:'LOG',x:5,y:12,men:690,readiness:84,morale:81,supply:91,fatigue:14,view:4},
    {id:'B6',team:'blue',name:'หน่วยสนับสนุนแพทย์',code:'MED',type:'MED',x:4,y:9,men:340,readiness:88,morale:88,supply:89,fatigue:7,view:4},
    {id:'R1',team:'red',name:'กองพลตะวันออก 1',code:'E 1',type:'INF',x:26,y:6,men:2940,readiness:82,morale:79,supply:86,fatigue:14,view:5},
    {id:'R2',team:'red',name:'กองพลตะวันออก 2',code:'E 2',type:'INF',x:26,y:16,men:2420,readiness:82,morale:81,supply:86,fatigue:16,view:5},
    {id:'R3',team:'red',name:'หน่วยลาดตระเวนตะวันออก',code:'E REC',type:'CAV',x:22,y:11,men:760,readiness:91,morale:85,supply:92,fatigue:11,view:7},
    {id:'R4',team:'red',name:'กองพันสำรองตะวันออก',code:'E RES',type:'INF',x:29,y:12,men:1760,readiness:83,morale:78,supply:86,fatigue:17,view:4},
    {id:'R5',team:'red',name:'กองพันส่งกำลังตะวันออก',code:'E LOG',type:'LOG',x:29,y:9,men:560,readiness:82,morale:80,supply:90,fatigue:10,view:4}
  ];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const fmt=(n)=>Math.round(n).toLocaleString('th-TH');
  const pct=(n)=>`${Math.round(clamp(n,0,100))}%`;
  const initUnit=(u)=>({...u,movePath:[],pending:null,mode:'hold',aiTimer:0,progress:0,engageTimer:0,wounded:0,injuryProgress:0,healProgress:0});
  function initialState(scenario='frontier'){
    const seed = scenario==='frontier' ? 190845 : Math.floor(Math.random()*900000)+10000;
    const offs = scenario==='sandbox' ? 2 : 0;
    return {version:1,scenario,seed,simHours:0,speed:1,paused:false,selectedId:'B1',rng:(seed|0)>>>0,weather:'clear',weatherNext:2.5,commandCount:0,engagementCount:0,lastAutosave:0,
      units:defaultUnits.map(u=>initUnit({...u,x:clamp(u.x+(offs?(hash(u.id.length*17+seed)>0.55?1:-1):0),1,W-2),y:clamp(u.y+(offs?(hash(u.men+seed)>0.5?1:-1):0),1,H-2)})),
      resources:{credits:1250,stock:670,fuel:440,medical:190,reinforcements:280,comms:78,transport:76,publicSupport:73,industry:69},
      laws:{ration:0,focus:'balanced'},
      reports:[],contacts:{},events:[],lastEventHour:0,lastEconomyReport:0,locations:townBlueprint.map(t=>({...t,owner:t.x<12?'blue':t.x>21?'red':'neutral'}))};
  }
  let state = initialState();
  let world = [];
  let currentPage='map', layer='terrain', targetMode=false, pointer=null;
  let camera={x:17,y:11,zoom:1};
  let canvas=$('#battlefield'), ctx=canvas.getContext('2d');
  let terrainCanvas=document.createElement('canvas');
  let mapFrame=$('#mapCanvasFrame'), toastTimeout=0, lastPaint=0, lastUi=0, lastTick=0;
  let drag=null;
  function hash(n){let x=Math.sin(n*127.1+78.233)*43758.5453123;return x-Math.floor(x)}
  function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy; const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);const h=(xx,yy)=>hash((xx*173+yy*239+seed*0.1337));return (h(ix,iy)*(1-a)+h(ix+1,iy)*a)*(1-b)+(h(ix,iy+1)*(1-a)+h(ix+1,iy+1)*a)*b}
  function inBounds(x,y){return x>=0&&y>=0&&x<W&&y<H}
  function roadAt(x,y){const onMain=(Math.abs(y-8)<.65&&x>3&&x<31),onLower=(Math.abs(y-16)<.60&&x>6&&x<27),onWest=(Math.abs(x-(5+0.30*y))<.55&&y>=5&&y<=16),onEast=(Math.abs(x-(30-.34*y))<.55&&y>=6&&y<=17);return onMain||onLower||onWest||onEast}
  function riverX(y){return 16.2+1.85*Math.sin(y*.41)+.45*Math.sin(y*.96)}
  function createWorld(seed){world=[];for(let y=0;y<H;y++){let row=[];for(let x=0;x<W;x++){
    const v=noise(x/4.0,y/4.0,seed),v2=noise(x/2.6,y/2.6,seed+53);
    let type=v>.69?'hill':v<.37?'forest':'plain';
    if(v2>.75&&type==='plain')type='forest';
    const road=roadAt(x,y),nearRiver=Math.abs(x-riverX(y))<.58;
    if(nearRiver && !(road && (Math.abs(y-8)<=1 || Math.abs(y-16)<=1)))type='water';
    if(nearRiver&&road)type='bridge';
    row.push({x,y,type,road,height:v});
  }world.push(row)}
    const points=[...state.locations,...depotBlueprint];
    for(const p of points){let cell=world[p.y]?.[p.x];if(cell)cell.type='plain'}
    for(const u of state.units){let cell=world[Math.round(u.y)]?.[Math.round(u.x)];if(cell&&cell.type==='water')cell.type='plain'}
    bakeTerrain();
  }
  function getTile(x,y){return world[Math.floor(y)]?.[Math.floor(x)]}
  function random(){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296}
  function log(message,type='info'){
    const time=clockString();state.events.unshift({time,simHours:state.simHours,text:message,type});
    if(state.events.length>180)state.events.length=180;
  }
  function toast(message){let el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2600)}
  function clockString(){const total=Math.floor(6*60+state.simHours*60);return `${String(Math.floor((total/60)%24)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
  function clockDay(){return Math.floor((6+state.simHours)/24)+1}
  function unit(id){return state.units.find(u=>u.id===id)}
  const friendly=()=>state.units.filter(u=>u.team==='blue');
  const adversaries=()=>state.units.filter(u=>u.team==='red');
  const avg=(arr,key)=>arr.length?arr.reduce((a,b)=>a+b[key],0)/arr.length:0;
  function passability(tile){if(!tile || tile.type==='water')return Infinity;return tile.road?0.68:tile.type==='hill'?1.9:tile.type==='forest'?1.48:1}
  function pathFind(from,to){const start=[clamp(Math.round(from.x),0,W-1),clamp(Math.round(from.y),0,H-1)];const goal=[clamp(Math.floor(to.x),0,W-1),clamp(Math.floor(to.y),0,H-1)];if(!Number.isFinite(passability(getTile(...goal))))return [];
    const key=(x,y)=>y*W+x,begin=key(...start),end=key(...goal),open=[begin],closed=new Set(),g=new Map([[begin,0]]),f=new Map([[begin,Math.abs(goal[0]-start[0])+Math.abs(goal[1]-start[1])]]),came=new Map();
    let runs=0;
    while(open.length&&runs++<1200){open.sort((a,b)=>(f.get(a)||Infinity)-(f.get(b)||Infinity));const cur=open.shift();if(cur===end){let out=[],n=cur;while(n!==begin&&came.has(n)){out.unshift({x:n%W,y:Math.floor(n/W)});n=came.get(n)}return out}
      closed.add(cur);const x=cur%W,y=Math.floor(cur/W);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!inBounds(nx,ny))continue;const nk=key(nx,ny);if(closed.has(nk))continue;const penalty=passability(getTile(nx,ny));if(!Number.isFinite(penalty))continue;
        const cost=(g.get(cur)||0)+penalty;if(cost<(g.get(nk)??Infinity)){came.set(nk,cur);g.set(nk,cost);f.set(nk,cost+Math.abs(goal[0]-nx)+Math.abs(goal[1]-ny));if(!open.includes(nk))open.push(nk)}
      }
    }return [];
  }
  function orderCommand(id,type,x,y){const u=unit(id);if(!u||u.team!=='blue')return false;
    if(type==='move'){const target=getTile(x,y);if(!target||!Number.isFinite(passability(target))){toast('ตำแหน่งนี้เคลื่อนที่ไปไม่ได้');return false};if(!pathFind(u,{x,y}).length){toast('ไม่พบเส้นทางที่ผ่านได้');return false}}
    if(type==='reinforce'&&state.resources.reinforcements<100){toast('ไม่มีกำลังพลทดแทนเพียงพอ');return false}
    const latency=(.10+(.88-state.resources.comms/100)*.55)*(1+.2*random());
    u.pending={type,x,y,arrives:state.simHours+latency};state.commandCount++;
    log(`ส่งคำสั่ง${type==='move'?'เคลื่อนที่':type==='hold'?'หยุดรักษาตำแหน่ง':type==='rest'?'พักและฟื้นฟู':type==='auto'?'มอบอำนาจให้ผู้บังคับบัญชารอง':'ขอกำลังพลทดแทน'}ไปยัง${u.name}`, 'info');toast('ส่งคำสั่งแล้ว • รอการรับคำสั่งตามระบบสื่อสาร');targetMode=false;updateUi();return true;
  }
  function activateOrder(u,p){if(p.type==='move'){
      const route=pathFind(u,{x:p.x,y:p.y});if(route.length){u.movePath=route;u.mode='move';u.progress=0;log(`${u.name}รับคำสั่งและเริ่มเคลื่อนพล`,'success')}else log(`${u.name}ไม่สามารถดำเนินคำสั่งได้ เนื่องจากเส้นทางไม่พร้อม`,'warning');
    }else if(p.type==='auto'){u.mode='auto';u.movePath=[];u.aiTimer=0;log(`${u.name}เริ่มทำงานตามอำนาจที่มอบหมาย`,'success');}
    else if(p.type==='reinforce'){const n=Math.min(130,state.resources.reinforcements);state.resources.reinforcements-=n;u.men+=n;u.readiness=clamp(u.readiness+2,0,100);log(`ส่งกำลังพลทดแทน ${fmt(n)} นาย ให้${u.name}`,'success')}
    else {u.mode=p.type;u.movePath=[];u.progress=0;log(`${u.name}เปลี่ยนสถานะเป็น${p.type==='rest'?'พักฟื้นกำลัง':'รักษาตำแหน่ง'}`,'success')}
  }
  function moveUnit(u,dt){if(!u.movePath?.length)return;const next=u.movePath[0];const tile=getTile(next.x,next.y);const mod=passability(tile);if(!Number.isFinite(mod)){u.movePath=[];u.mode='hold';return}
    const weatherMul=state.weather==='rain'?.79:state.weather==='fog'?.86:1;
    const base=u.type==='CAV'?3.5:u.type==='LOG'?2.6:2.8;
    const fatigueMul=clamp(1-u.fatigue*.005,.50,1);
    const speed=(base*weatherMul*fatigueMul*Math.max(.45,u.supply/100))/mod;
    u.progress+=dt*speed;
    while(u.progress>=1&&u.movePath.length){u.progress-=1;const step=u.movePath.shift();u.x=step.x;u.y=step.y;if(!u.movePath.length){u.progress=0;if(u.team==='blue'&&u.mode==='move')log(`${u.name}ถึงตำแหน่งหมายแล้ว`,'success');u.mode=u.mode==='auto'?'auto':'hold';break;}}
  }
  function discovered(u){const sight=state.weather==='fog'?.72:state.weather==='rain'?.86:1;return friendly().some(f=>dist(f,u)<=f.view*sight) || dist({x:4,y:11},u)<3.7}
  function visibleAt(x,y){const sight=state.weather==='fog'?.72:state.weather==='rain'?.86:1;return friendly().some(f=>dist(f,{x,y})<=f.view*sight)||dist({x:4,y:11},{x,y})<3.7}
  function enemyThinking(dt){for(const u of adversaries()){
    u.aiTimer-=dt;if(u.movePath.length||u.aiTimer>0)continue;
    const spots=[{x:17,y:8},{x:19,y:15},{x:22,y:10},{x:26,y:8},{x:23,y:16},{x:15,y:16},{x:24,y:5}];
    const target=spots[Math.floor(random()*spots.length)];const path=pathFind(u,target);if(path.length>1){u.movePath=path;u.mode='auto'}u.aiTimer=1.2+random()*2.2;
  }}
  function updateEncounters(dt){for(const b of friendly()){for(const r of adversaries()){
    if(dist(b,r)>1.7)continue;
    b.engageTimer=(b.engageTimer||0)+dt;
    const cost=dt*.45*(1+random()*.12);b.readiness=clamp(b.readiness-cost,0,100);r.readiness=clamp(r.readiness-cost*.9,0,100);
    b.fatigue=clamp(b.fatigue+cost*.7,0,100);r.fatigue=clamp(r.fatigue+cost*.7,0,100);
    // Abstract game-only personnel impacts: no calibrated weapons or casualty model.
    for(const f of [b,r]){f.injuryProgress=(f.injuryProgress||0)+dt*(f.men/1000)*.6;if(f.injuryProgress>=1){const n=Math.floor(f.injuryProgress);f.injuryProgress-=n;f.men=Math.max(0,f.men-n);f.wounded=(f.wounded||0)+n}}
    if(b.engageTimer>1.1){b.engageTimer=0;state.engagementCount++;log(`พบการเผชิญหน้าระหว่าง${b.name}และหน่วยฝ่ายตรงข้าม • ความพร้อมลดลง`,'warning')}
  }}}
  function updateSim(dt){if(state.paused)return;state.simHours+=dt;
    const r=state.resources;
    r.credits=clamp(r.credits+dt*(5.8*(r.industry/70)),0,99999);
    r.stock=clamp(r.stock+dt*(1.3*(r.transport/75)),0,9999);
    r.fuel=clamp(r.fuel+dt*(.8*(r.industry/70)),0,9999);
    for(const u of state.units){
      if(u.pending&&state.simHours>=u.pending.arrives){const p=u.pending;u.pending=null;activateOrder(u,p)}
      const moving=u.movePath.length>0;
      if(moving)moveUnit(u,dt);
      const burn=dt*(u.team==='blue'?1.0:.70)*(moving?1.5:1)*(u.type==='LOG'?.65:1);
      u.supply=clamp(u.supply-burn,0,100);
      const depot=depotBlueprint.find(d=>d.team===u.team&&dist(d,u)<4.6);
      if(depot && (u.team==='red'||r.stock>0)){
        const refill=dt*(u.type==='LOG'?8:5.5)*(r.transport/80);
        if(u.team==='blue')r.stock=Math.max(0,r.stock-refill*.15);
        u.supply=clamp(u.supply+refill,0,100);
      }
      const resting=u.mode==='rest';
      u.fatigue=clamp(u.fatigue+dt*(moving?2.4:resting?-5.3:-1.1),0,100);
      u.readiness=clamp(u.readiness+dt*(resting?1.1:.22)-(u.supply<25?dt*2.3:0)-(u.fatigue>75?dt*.85:0),0,100);
      u.morale=clamp(u.morale+dt*(u.supply<20?-1.0:resting?.4:.04),0,100);
      if(u.team==='blue' && (u.wounded||0)>0 && r.medical>0 && (friendly().some(m=>m.type==='MED'&&dist(m,u)<4) || dist({x:4,y:11},u)<3.5)){u.healProgress=(u.healProgress||0)+dt*(1.3+r.transport/100);const treated=Math.min(Math.floor(u.wounded),Math.floor(u.healProgress),Math.floor(r.medical/.55));if(treated>0){u.healProgress-=treated;u.wounded-=treated;u.men+=treated;r.medical-=treated*.55;}}
      if(u.mode==='auto' && !u.pending && !u.movePath.length && u.team==='blue'){
        u.aiTimer-=dt;if(u.aiTimer<=0){u.aiTimer=1.4+random()*1.5;let closest=state.locations.filter(t=>t.owner!=='blue').sort((a,b)=>dist(a,u)-dist(b,u))[0];if(closest){const route=pathFind(u,closest);u.movePath=route.slice(0,5);}}
      }
    }
    enemyThinking(dt);updateEncounters(dt);
    if(state.weatherNext<state.simHours){const weathers=['clear','clear','rain','fog'];const newW=weathers[Math.floor(random()*weathers.length)];if(newW!==state.weather){state.weather=newW;log(`สภาพอากาศเปลี่ยน: ${weatherName(newW)}`,'info')}state.weatherNext=state.simHours+3+random()*4}
    // Towns change control gradually whenever a non-supply formation occupies them uncontested.
    for(const p of state.locations){const blue=friendly().some(u=>u.type!=='LOG'&&u.type!=='MED'&&dist(u,p)<1.15);const red=adversaries().some(u=>u.type!=='LOG'&&dist(u,p)<1.15);
      if(blue&&!red&&p.owner!=='blue'){p.owner='blue';log(`ฝ่ายเรามีอิทธิพลควบคุมพื้นที่ ${p.name}`,'success');r.publicSupport=clamp(r.publicSupport+1.6,0,100)}
      if(red&&!blue&&p.owner!=='red'){p.owner='red';log(`ฝ่ายตรงข้ามมีอิทธิพลควบคุมพื้นที่ ${p.name}`,'warning');r.publicSupport=clamp(r.publicSupport-.8,0,100)}
    }
    if(state.simHours-state.lastEconomyReport>=8){state.lastEconomyReport=state.simHours;log(`ฝ่ายเศรษฐกิจรายงานงบประมาณ ${fmt(r.credits)} หน่วย และคลังเสบียง ${fmt(r.stock)} หน่วย`,'info')}
    if(state.simHours-state.lastEventHour>=2.6){state.lastEventHour=state.simHours;const roll=random();if(roll<.25){r.comms=clamp(r.comms-2.4,0,100);log('การส่งรายงานจากหน่วยบางส่วนล่าช้า • ประสิทธิภาพการสื่อสารลดลง','warning')}else if(roll<.48){r.transport=clamp(r.transport-1.5,0,100);log('ยานพาหนะบางส่วนเข้ารับการซ่อมตามรอบ','info')}else if(roll<.65){r.medical=clamp(r.medical-3,0,1000);log('หน่วยแพทย์รายงานการใช้ทรัพยากรเพิ่มเติม','info')}else{log('ฝ่ายอำนวยการส่งรายงานสถานการณ์ประจำช่วงเวลา','info')}}
    for(const en of adversaries()){if(discovered(en))state.contacts[en.id]={x:en.x,y:en.y,seen:state.simHours,type:en.type};}
  }
  function weatherName(w){return {clear:'ท้องฟ้าแจ่มใส',rain:'ฝนตก',fog:'หมอกหนา'}[w]||w}
  function prepareCache(){terrainCanvas.width=W*T;terrainCanvas.height=H*T;}
  function bakeTerrain(){prepareCache();let c=terrainCanvas.getContext('2d');c.clearRect(0,0,W*T,H*T);
    const cols={plain:['#475d50','#52695a'],hill:['#72705c','#817e66'],forest:['#364f43','#3b5648'],water:['#476b79','#507785'],bridge:['#6f7971','#677a70']};
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=world[y][x],p=x*T,q=y*T;
      c.fillStyle=cols[t.type][(x+y)%2];c.fillRect(p,q,T+1,T+1);
      let h=hash(x*41+y*19+state.seed);if(t.type==='forest'){c.fillStyle='#29493f';for(let i=0;i<4;i++){let px=p+5+i*7+(h*3),py=q+8+((i*13)%17);c.beginPath();c.moveTo(px,py-5);c.lineTo(px-3,py+3);c.lineTo(px+3,py+3);c.fill()}}
      if(t.type==='hill'){c.strokeStyle='#b5b09438';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.ellipse(p+T/2,q+T/2,6+i*5,3+i*4,-.35,0,Math.PI*2);c.stroke()}}
      if(t.type==='plain'){c.fillStyle='#a2ae8951';for(let i=0;i<3;i++){let j=hash((x+i*5)*57+y*389+state.seed);c.fillRect(p+4+(j*22),q+7+i*8,2,1)}}
      if(t.type==='water'){c.strokeStyle='#aad1d038';c.beginPath();c.moveTo(p+6,q+10);c.lineTo(p+23,q+10);c.moveTo(p+10,q+20);c.lineTo(p+30,q+20);c.stroke()}
      if(t.road){c.strokeStyle=t.type==='water'?'#c1bb99':'#b8a884';c.lineWidth=4;c.globalAlpha=.6;c.beginPath();c.moveTo(p,q+T/2);c.lineTo(p+T,q+T/2);c.stroke();c.globalAlpha=1}
      c.strokeStyle='#0b1d1b0c';c.strokeRect(p,q,T,T);
    }
    // Terrain labels and river are deliberately stylized, not geographic imagery.
    c.textAlign='center';c.textBaseline='middle';
    for(const t of state.locations){c.fillStyle='#e9d2a2';c.beginPath();c.arc((t.x+.5)*T,(t.y+.5)*T,5.5,0,Math.PI*2);c.fill();c.fillStyle='#23392f';c.beginPath();c.arc((t.x+.5)*T,(t.y+.5)*T,2.3,0,Math.PI*2);c.fill();}
    for(const d of depotBlueprint){c.fillStyle=d.team==='blue'?'#abc9d9':'#cfaaa0';c.fillRect(d.x*T+T/2-5,d.y*T+T/2-5,10,10);c.strokeStyle='#162d37';c.strokeRect(d.x*T+T/2-5,d.y*T+T/2-5,10,10)}
  }
  function metricsHtml(label,value,foot,cls=''){return `<div class="metric"><span class="metric-label">${label}</span><div class="metric-value">${value}</div><span class="metric-foot ${cls}">${foot}</span></div>`}
  function renderMetrics(){const u=friendly(),r=state.resources;$('#metrics').innerHTML=[
    metricsHtml('กำลังพลทั้งหมด',fmt(u.reduce((a,b)=>a+b.men,0)),'6 หน่วยประจำการ'),
    metricsHtml('ความพร้อมเฉลี่ย',pct(avg(u,'readiness')),'รวมทุกหน่วย'),
    metricsHtml('เสบียงส่วนกลาง',fmt(r.stock),'หน่วยทรัพยากร'),
    metricsHtml('งบประมาณ',fmt(r.credits),'รายได้เพิ่มตามเวลา','positive'),
    metricsHtml('เสถียรภาพ',pct(r.publicSupport),'ความเชื่อมั่นสาธารณะ')].join('');}
  function barHtml(name,value,cls=''){return `<div class="bar-title"><span>${name}</span><strong>${pct(value)}</strong></div><div class="bar"><i class="${cls}" style="width:${clamp(value,0,100)}%"></i></div>`}
  function setCommand(type){if(!state.selectedId){toast('เลือกหน่วยก่อนออกคำสั่ง');return}if(type==='move'){targetMode=true;$('#mapInstruction').textContent='โหมดกำหนดปลายทาง • แตะช่องบนแผนที่เพื่อส่งคำสั่ง';mapFrame.classList.add('command-target');toast('เลือกตำแหน่งปลายทางบนแผนที่');return}orderCommand(state.selectedId,type)}
  function renderCommand(){const el=$('#commandPanel'),u=unit(state.selectedId);if(!u){el.innerHTML='<div class="empty-order"><div class="empty-icon">⌖</div><strong>เลือกหน่วยบนแผนที่</strong><p>คลิกที่สัญลักษณ์หน่วยสีน้ำเงิน หรือเลือกจากหน้า "หน่วยและกำลังพล"</p></div>';return}
    const status=u.pending?`กำลังส่งคำสั่ง · เหลือ ${Math.max(0,(u.pending.arrives-state.simHours)*60).toFixed(0)} นาทีจำลอง`:u.movePath.length?`กำลังเคลื่อนที่ · เหลือ ${u.movePath.length} ช่อง`:u.mode==='rest'?'พักฟื้นกำลัง':u.mode==='auto'?'AI นายทหารรองกำลังบริหาร': 'รักษาตำแหน่ง';
    el.innerHTML=`<div class="unit-head"><div class="unit-emblem">${UNIT_SIGNS[u.type]}</div><div><strong>${u.name}</strong><p>${UNIT_TYPES[u.type]} • ${u.code}</p></div></div><div class="tag-row"><span class="status-chip">${fmt(u.men)} นาย</span><span class="status-chip alt">GRID ${Math.round(u.x)}-${Math.round(u.y)}</span></div><div class="unit-detail"><span>สถานะ</span><strong>${status}</strong></div>${barHtml('ความพร้อม',u.readiness)}<div class="unit-detail"><span>ผู้บาดเจ็บที่อยู่ระหว่างฟื้นฟู</span><strong>${fmt(u.wounded||0)} นาย</strong></div>${barHtml('กำลังใจ',u.morale,'blue')}${barHtml('เสบียงประจำหน่วย',u.supply,'gold')}${barHtml('ความเหนื่อยล้า',u.fatigue,'gold')}<div class="order-label">ออกคำสั่งผ่านระบบสื่อสาร</div><div class="orders"><button class="order-btn primary ${targetMode?'active':''}" data-order="move">➤ เคลื่อนที่</button><button class="order-btn" data-order="hold">□ ตั้งรับ</button><button class="order-btn" data-order="rest">☾ พักกำลัง</button><button class="order-btn" data-order="auto">⌘ มอบให้ AI</button></div><div class="orders" style="grid-template-columns:1fr;margin-top:7px"><button class="order-btn" data-order="reinforce">+ ขอกำลังพลทดแทน (100–130 นาย)</button></div>${u.pending?`<div class="pending-line">◷ คำสั่งอยู่ระหว่างส่งต่อ · ถึงหน่วยเวลาประมาณ ${formatHour(u.pending.arrives)}</div>`:''}<div class="note-order">การส่งคำสั่งมีความล่าช้าตามคุณภาพการสื่อสาร การเคลื่อนที่ขึ้นกับภูมิประเทศ สภาพอากาศ ความเหนื่อยล้า และเสบียง</div>`;
  }
  function formatHour(h){const z=Math.floor(360+h*60);return String(Math.floor(z/60)%24).padStart(2,'0')+':'+String(z%60).padStart(2,'0')}
  function renderEvents(){const html=(data)=>data.length?data.map(e=>`<div class="event-row"><span class="event-time">${e.time}</span><i class="event-dot ${e.type}"></i><span class="event-text">${e.text}</span></div>`).join(''):'<div class="event-row muted">ยังไม่มีเหตุการณ์</div>';
    $('#liveEvents').innerHTML=html(state.events.slice(0,8));$('#allEvents').innerHTML=html(state.events);
  }
  function renderSummary(){const seen=adversaries().filter(discovered).length, moving=friendly().filter(u=>u.movePath.length).length;$('#situationPanel').innerHTML=`<div class="summary-row"><span>หน่วยที่กำลังเคลื่อนที่</span><strong>${moving} / ${friendly().length}</strong></div><div class="summary-row"><span>ตรวจพบฝ่ายตรงข้าม</span><strong>${seen} หน่วย</strong></div><div class="summary-row"><span>เครือข่ายสื่อสาร</span><strong>${pct(state.resources.comms)}</strong></div><div class="summary-row"><span>ประสิทธิภาพการขนส่ง</span><strong>${pct(state.resources.transport)}</strong></div><div class="summary-row"><span>จุดยุทธศาสตร์ที่ควบคุม</span><strong>${state.locations.filter(l=>l.owner==='blue').length} / ${state.locations.length}</strong></div><div class="hint-note">ข้อมูลหน่วยฝ่ายตรงข้ามจะปรากฏเฉพาะพื้นที่ที่มีการตรวจพบ รายงานอาจเก่ากว่าสถานการณ์ปัจจุบัน</div>`}
  function intelPart(head,rows){return `<div class="intel-section"><div class="intel-section-head">${head}</div>${rows.map(v=>`<div class="intel-stat"><span>${v[0]}</span><strong>${v[1]}</strong></div>`).join('')}</div>`}
  function renderIntel(){const r=state.resources,seen=adversaries().filter(discovered).length,last=Object.keys(state.contacts).length;
    $('#intelSidebar').innerHTML=intelPart('FORCE STATUS',[["กำลังพลฝ่ายเรา",fmt(friendly().reduce((a,b)=>a+b.men,0))+' นาย'],['เคลื่อนที่อยู่',friendly().filter(u=>u.movePath.length).length+' หน่วย'],['ความพร้อมเฉลี่ย',pct(avg(friendly(),'readiness'))]])+intelPart('RECONNAISSANCE',[["ตรวจพบขณะนี้",seen+' หน่วย'],['เคยมีรายงาน',last+' หน่วย'],['สภาพอากาศ',weatherName(state.weather)]])+intelPart('SUPPORT & SYSTEMS',[["ความพร้อมการสื่อสาร",pct(r.comms)],['ประสิทธิภาพขนส่ง',pct(r.transport)],['เวชภัณฑ์ส่วนกลาง',fmt(r.medical)+' หน่วย'],['กำลังพลทดแทน',fmt(r.reinforcements)+' นาย']])+intelPart('NATIONAL PICTURE',[["อุตสาหกรรม",pct(r.industry)],['ประชาชนสนับสนุน',pct(r.publicSupport)],['รายได้โดยประมาณ','+'+fmt(5.8*(r.industry/70))+' / ชม.']]);
  }
  function renderForces(){const el=$('#forceList');el.innerHTML=friendly().map(u=>`<div class="force-row"><div class="force-icon">${UNIT_SIGNS[u.type]}</div><div class="force-name"><strong>${u.name}</strong><span>${UNIT_TYPES[u.type]} · ${u.code} · GRID ${Math.round(u.x)}-${Math.round(u.y)}</span></div><div class="force-value">${fmt(u.men)}<small>กำลังพล</small></div><div class="force-value">${pct(u.readiness)}<small>ความพร้อม</small><div class="mini-progress"><i style="width:${u.readiness}%"></i></div></div><div class="force-value">${pct(u.supply)}<small>เสบียง</small></div><button data-select-unit="${u.id}" class="ghost">เลือกหน่วย →</button></div>`).join('');}
  const staffDefs=[
    {id:'comms',title:'ฝ่ายสื่อสาร',icon:'⌁',desc:'ปรับปรุงโครงข่ายรายงาน ลดเวลาที่คำสั่งเดินทางถึงหน่วย',cost:85,field:'comms',add:9,max:100,label:'ประสิทธิภาพการสื่อสาร'},
    {id:'logistics',title:'ฝ่ายส่งกำลังบำรุง',icon:'⬡',desc:'จัดสรรรถบรรทุกและปรับปรุงระบบส่งกำลัง เพิ่มคลังกลางและความพร้อมขนส่ง',cost:125,field:'transport',add:6,max:100,label:'ประสิทธิภาพการขนส่ง'},
    {id:'medical',title:'ฝ่ายแพทย์',icon:'✚',desc:'เพิ่มกำลังสำรองเวชภัณฑ์สำหรับรักษาความพร้อมด้านสุขภาพของหน่วย',cost:90,field:'medical',add:90,max:1000,label:'เวชภัณฑ์'},
    {id:'stock',title:'บริหารคลังเสบียง',icon:'▧',desc:'จัดหาปริมาณเสบียงส่วนกลางเพิ่มเติม ซึ่งส่งผลต่อหน่วยที่อยู่ในรัศมีคลัง',cost:105,field:'stock',add:150,max:9999,label:'คลังเสบียง'}
  ];
  function staffAction(id){const d=staffDefs.find(x=>x.id===id);if(!d)return;const r=state.resources;if(r.credits<d.cost){toast('งบประมาณไม่เพียงพอ');return}if(r[d.field]>=d.max){toast('ทรัพยากรนี้อยู่ในระดับสูงสุดแล้ว');return}r.credits-=d.cost;r[d.field]=clamp(r[d.field]+d.add,0,d.max);log(`อนุมัติการดำเนินงาน: ${d.title} (ใช้งบ ${d.cost} หน่วย)`,'success');toast('อนุมัติการดำเนินงานแล้ว');updateUi()}
  function renderStaff(){const r=state.resources;$('#staffContent').innerHTML=staffDefs.map(d=>`<article class="panel feature-card"><div class="feature-icon">${d.icon}</div><h3>${d.title}</h3><p>${d.desc}</p><div class="feature-main">${fmt(r[d.field])}${d.max===100?'%':''}</div><div class="feature-meta">${d.label}</div>${d.max===100?barHtml('ประสิทธิภาพ',r[d.field]):''}<button class="primary wide" data-staff="${d.id}" ${r.credits<d.cost||r[d.field]>=d.max?'disabled':''}>ดำเนินการ · ${d.cost} งบประมาณ</button><div class="feature-foot">เพิ่ม +${d.add}${d.max===100?'%':' หน่วย'} · ผลเกิดทันทีในระบบเกม</div></article>`).join('')}
  const nationDefs=[
    {id:'production',title:'ขยายการผลิต',icon:'▤',desc:'ลงทุนกำลังการผลิต เพิ่มอุตสาหกรรมและรายได้ต่อชั่วโมงในระยะยาว',cost:180,field:'industry',add:7,max:100,help:'อุตสาหกรรม +7%'},
    {id:'recruit',title:'ฝึกกำลังพลทดแทน',icon:'♟',desc:'จัดสรรงบประมาณและทรัพยากรเพื่อเพิ่มกำลังพลสำรองสำหรับหน่วยต่าง ๆ',cost:150,field:'reinforcements',add:380,max:9999,help:'กำลังพลทดแทน +380 นาย'},
    {id:'relief',title:'โครงการช่วยเหลือพลเรือน',icon:'✦',desc:'ลงทุนด้านสาธารณูปโภคและการช่วยเหลือ ลดแรงกดดันจากภาวะความขัดแย้ง',cost:95,field:'publicSupport',add:6,max:100,help:'ความเชื่อมั่นประชาชน +6%'},
    {id:'emergency',title:'จัดหาเงินทุนฉุกเฉิน',icon:'◈',desc:'เพิ่มงบประมาณระยะสั้นโดยลดความเชื่อมั่นของประชาชนเล็กน้อย',cost:0,field:'credits',add:230,max:99999,help:'งบ +230 / ความเชื่อมั่น −4%'}
  ];
  function nationAction(id){const d=nationDefs.find(x=>x.id===id);if(!d)return;const r=state.resources;if(r.credits<d.cost){toast('งบประมาณไม่เพียงพอ');return}if(r[d.field]>=d.max){toast('ทรัพยากรนี้อยู่ในระดับสูงสุดแล้ว');return}if(id==='emergency'&&r.publicSupport<15){toast('ความเชื่อมั่นต่ำเกินไปที่จะอนุมัตินโยบายนี้');return}r.credits-=d.cost;r[d.field]=clamp(r[d.field]+d.add,0,d.max);if(id==='emergency')r.publicSupport=clamp(r.publicSupport-4,0,100);log(`รัฐบาลอนุมัตินโยบาย: ${d.title}`,'success');toast('นโยบายมีผลในโลกจำลองแล้ว');updateUi()}
  function renderNation(){const r=state.resources;$('#nationContent').innerHTML=nationDefs.map(d=>`<article class="panel feature-card"><div class="feature-icon">${d.icon}</div><h3>${d.title}</h3><p>${d.desc}</p><div class="feature-main">${fmt(r[d.field])}${d.max===100?'%':''}</div><div class="feature-meta">${d.field==='credits'?'งบประมาณปัจจุบัน':d.field==='publicSupport'?'ความเชื่อมั่นประชาชน':d.field==='industry'?'ขีดความสามารถอุตสาหกรรม':'กำลังพลทดแทน'}</div><button class="primary wide" data-nation="${d.id}" ${r.credits<d.cost||r[d.field]>=d.max?'disabled':''}>${idName(d.id)}${d.cost?' · '+d.cost+' งบประมาณ':''}</button><div class="feature-foot">${d.help}</div></article>`).join('')}
  function idName(id){return id==='emergency'?'ออกพันธบัตรฉุกเฉิน':'อนุมัตินโยบาย'}
  function renderAar(){const own=state.locations.filter(x=>x.owner==='blue').length,avgReady=avg(friendly(),'readiness');$('#aarContent').innerHTML=`<div class="aar-number">${Math.floor(state.simHours*60)} <span style="font-size:14px;color:#abc0cd">นาทีในโลกจำลอง</span></div><div class="aar-desc">ระบบบันทึกการตัดสินใจและเหตุการณ์อัตโนมัติ ไม่มีผู้ควบคุมการฝึก</div><div class="aar-grid"><div class="aar-cell"><strong>${state.commandCount}</strong><span>คำสั่งที่ออก</span></div><div class="aar-cell"><strong>${state.engagementCount}</strong><span>เหตุการณ์เผชิญหน้า</span></div><div class="aar-cell"><strong>${own}/${state.locations.length}</strong><span>จุดยุทธศาสตร์ฝ่ายเรา</span></div><div class="aar-cell"><strong>${pct(avgReady)}</strong><span>ความพร้อมเฉลี่ย</span></div></div><div class="aar-tips"><b>การประเมิน:</b> ${avgReady<60?'ความพร้อมกำลังพลลดต่ำ ควรตรวจสอบสาเหตุจากเสบียงและความเหนื่อยล้า':state.resources.comms<55?'ระบบสื่อสารมีความเสี่ยงต่อความล่าช้าของคำสั่ง':'ขณะนี้สามารถติดตามความพร้อม กำลังพล เสบียง และความล่าช้าในการสื่อสารได้จากข้อมูลบันทึก'}</div><div class="aar-tips">รายงานนี้สะท้อนกฎเกมสมมติเท่านั้น ไม่ใช้รับรองความสามารถของผู้บัญชาการหรือวางแผนการปฏิบัติการจริง</div>`}
  function switchPage(p){if(!['map','forces','staff','nation','reports'].includes(p))return;currentPage=p;$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===p));$$('.page').forEach(e=>e.classList.toggle('active',e.id==='view-'+p));const defs={map:['OPERATIONAL OVERVIEW / SECTOR 04','ศูนย์บัญชาการ','บริหารโลกจำลองแบบเวลาจริง เลือกหน่วยบนแผนที่เพื่อออกคำสั่ง'],forces:['PERSONNEL / ORDER OF BATTLE','หน่วยและกำลังพล','ติดตามกำลังพล ความพร้อม เสบียง และตำแหน่งของแต่ละหน่วย'],staff:['STAFF AND ADMINISTRATION','ฝ่ายอำนวยการ','บริหารระบบสื่อสาร โลจิสติกส์ การแพทย์ และทรัพยากร'],nation:['NATIONAL SYSTEMS','เศรษฐกิจประเทศ','การตัดสินใจระดับประเทศส่งผลต่อความพร้อมในพื้นที่จำลอง'],reports:['AFTER ACTION REVIEW','รายงานและการวิเคราะห์','ย้อนดูเหตุการณ์และส่งออกข้อมูลเพื่อประเมินการตัดสินใจ']};let d=defs[p];$('#pageKicker').textContent=d[0];$('#pageTitle').textContent=d[1];$('#pageDescription').textContent=d[2];renderPage();}
  function renderPage(){if(currentPage==='forces')renderForces();if(currentPage==='staff')renderStaff();if(currentPage==='nation')renderNation();if(currentPage==='reports'){renderAar();renderEvents()}}
  function updateUi(){const running=!state.paused;$('#clock').textContent=clockString();$('#clockDate').textContent=`DAY ${String(clockDay()).padStart(2,'0')}`;$('#runningBadge').innerHTML=running?'<span class="alive-dot"></span> LIVE SIMULATION':'● PAUSED';$('#runningBadge').style.color=running?'#9dd5b1':'#eac790';$('#pauseButton').innerHTML=running?'Ⅱ <span>หยุดเวลา</span>':'▶ <span>เดินเวลา</span>';$('#speedSelect').value=String(state.speed);$('#weatherLabel').textContent=(state.weather==='clear'?'☀':state.weather==='rain'?'☂':'☷')+' '+weatherName(state.weather);$('#theaterTitle').textContent=state.scenario==='sandbox'?'SANDBOX THEATRE':'NORTH BORDER';$('#campaignName').textContent=state.scenario==='sandbox'?'โลกสมมติแบบสุ่ม':'ชายแดนเหนือ';renderMetrics();renderCommand();renderEvents();renderSummary();renderIntel();renderPage();}
  function exportJson(){const payload={app:'The Art of Command',formatVersion:1,saved:new Date().toISOString(),warning:'Fictional, unvalidated game simulation; not an operational military tool.',campaign:{scenario:state.scenario,seed:state.seed,simHours:state.simHours},resources:state.resources,forces:state.units.map(u=>({id:u.id,team:u.team,name:u.name,men:u.men,x:u.x,y:u.y,readiness:u.readiness,morale:u.morale,supply:u.supply,fatigue:u.fatigue,mode:u.mode})),events:state.events.slice().reverse()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`art-of-command-aar-day-${clockDay()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);toast('ส่งออกรายงานแล้ว')}
  const SAVEKEY='aoc-fictitious-v1-manual',AUTO='aoc-fictitious-v1-auto';
  function save(key=SAVEKEY,notify=true){try{localStorage.setItem(key,JSON.stringify(state));if(notify)toast('บันทึกเกมบนอุปกรณ์นี้แล้ว');return true}catch(e){if(notify)toast('เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล');return false}}
  function load(){let s;try{s=localStorage.getItem(SAVEKEY)||localStorage.getItem(AUTO)}catch(e){}if(!s){toast('ยังไม่มีไฟล์บันทึกบนอุปกรณ์นี้');return}try{const data=JSON.parse(s);if(data.version!==1||!Array.isArray(data.units)||!data.resources)throw Error('bad save');state=data;state.paused=false;state.speed=state.speed||1;state.lastAutosave=0;state.contacts=state.contacts||{};createWorld(state.seed);targetMode=false;camera={x:17,y:11,zoom:1};log('โหลดข้อมูลสถานการณ์จากอุปกรณ์แล้ว','success');updateUi();toast('โหลดเกมสำเร็จ')}catch(err){toast('ไฟล์บันทึกใช้ไม่ได้หรือเป็นคนละเวอร์ชัน')}}
  function reset(scenario){state=initialState(scenario);world=[];createWorld(state.seed);camera={x:17,y:11,zoom:1};targetMode=false;$('#mapInstruction').textContent='คลิกหน่วยสีน้ำเงินเพื่อเลือก • ลากแผนที่เพื่อเลื่อน';mapFrame.classList.remove('command-target');log('สถานการณ์ใหม่เริ่มต้น • โลกจำลองกำลังดำเนินต่อเนื่อง','success');log('รายงาน: หน่วยฝ่ายเรากระจายกำลังบริเวณพื้นที่ฝั่งตะวันตก','info');log('หัวหน้าฝ่ายอำนวยการ: เสบียงและการสื่อสารพร้อมระดับเริ่มต้น','info');state.units.filter(u=>u.team==='red').forEach(u=>{u.aiTimer=.6+random()*1.8});switchPage('map');updateUi();}
  function screenTransform(){const w=mapFrame.clientWidth,h=mapFrame.clientHeight;const size=Math.max(w/W,h/H)*camera.zoom;return {w,h,size,ox:w/2-(camera.x+.5)*size,oy:h/2-(camera.y+.5)*size}}
  function worldToScreen(x,y){const z=screenTransform();return {x:z.ox+(x+.5)*z.size,y:z.oy+(y+.5)*z.size}}
  function screenToWorld(px,py){const z=screenTransform();return {x:(px-z.ox)/z.size-.5,y:(py-z.oy)/z.size-.5}}
  function resize(){const w=mapFrame.clientWidth,h=mapFrame.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(w*dpr));canvas.height=Math.max(1,Math.floor(h*dpr));}
  function draw(now){const dpr=canvas.width/Math.max(1,mapFrame.clientWidth);let {w,h,size,ox,oy}=screenTransform();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#233d3e';ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(ox,oy);ctx.scale(size/T,size/T);ctx.drawImage(terrainCanvas,0,0);
    if(layer==='supply'){
      for(const d of depotBlueprint.filter(d=>d.team==='blue')){const x=(d.x+.5)*T,y=(d.y+.5)*T;const g=ctx.createRadialGradient(x,y,3,x,y,T*5.3);g.addColorStop(0,'#9cecc766');g.addColorStop(1,'#78dc9f00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,5.3*T,0,Math.PI*2);ctx.fill()}
    }
    // Subtle geographic grid. Purely fictional terrain.
    ctx.lineWidth=.45;ctx.strokeStyle='#d8e1d824';for(let x=0;x<=W;x+=2){ctx.beginPath();ctx.moveTo(x*T,0);ctx.lineTo(x*T,H*T);ctx.stroke()}for(let y=0;y<=H;y+=2){ctx.beginPath();ctx.moveTo(0,y*T);ctx.lineTo(W*T,y*T);ctx.stroke()}
    // Fog of war reveals only rough sectors reported by friendly formations.
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const vis=visibleAt(x,y);ctx.fillStyle=vis?'#0e1c2408':'#101c29a8';ctx.fillRect(x*T,y*T,T+.5,T+.5);if(layer==='intel'&&!vis){ctx.fillStyle='#10203388';ctx.fillRect(x*T,y*T,T,T)}}
    const selected=unit(state.selectedId);
    if(selected?.movePath.length){ctx.strokeStyle='#e2cf8a';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo((selected.x+.5)*T,(selected.y+.5)*T);for(let p of selected.movePath){ctx.lineTo((p.x+.5)*T,(p.y+.5)*T)}ctx.stroke();ctx.setLineDash([])}
    if(selected?.pending?.type==='move'){ctx.strokeStyle='#efd393';ctx.lineWidth=1.8;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo((selected.x+.5)*T,(selected.y+.5)*T);ctx.lineTo((selected.pending.x+.5)*T,(selected.pending.y+.5)*T);ctx.stroke();ctx.setLineDash([])}
    for(const p of state.locations){const posx=(p.x+.5)*T,posy=(p.y+.5)*T;ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#101d23d9';const width=ctx.measureText(p.name).width+10;ctx.fillRect(posx-width/2,posy+10,width,14);ctx.fillStyle=p.owner==='blue'?'#b4dcee':p.owner==='red'?'#e6b6a6':'#f0d4a0';ctx.fillText(p.name,posx,posy+20)}
    // Last contact positions are time-stamped approximations, never truth when out of sight.
    for(const e of adversaries()){if(discovered(e))continue;const c=state.contacts[e.id];if(!c||state.simHours-c.seen>9)continue;const x=(c.x+.5)*T,y=(c.y+.5)*T;ctx.strokeStyle='#e9a29277';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.strokeRect(x-10,y-9,20,18);ctx.setLineDash([]);ctx.fillStyle='#e8c2b5bb';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('?',x,y+3)}
    for(const u of state.units){if(u.team==='red'&&!discovered(u))continue;const goal=u.movePath?.[0];const displayX=goal?u.x+(goal.x-u.x)*clamp(u.progress,0,1):u.x;const displayY=goal?u.y+(goal.y-u.y)*clamp(u.progress,0,1):u.y;const x=(displayX+.5)*T,y=(displayY+.5)*T,chosen=u.id===state.selectedId;
      if(chosen){ctx.strokeStyle='#f3d4a0';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,19+Math.sin(now/250)*1.5,0,Math.PI*2);ctx.stroke()}
      ctx.fillStyle=u.team==='blue'?'#203b53':'#603831';ctx.strokeStyle=u.team==='blue'?'#91c8ef':'#eca194';ctx.lineWidth=1.5;ctx.fillRect(x-17,y-11,34,22);ctx.strokeRect(x-17,y-11,34,22);
      ctx.fillStyle=u.team==='blue'?'#e1f5fc':'#ffded6';ctx.font='bold 10px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(UNIT_SIGNS[u.type],x,y+.5);
      ctx.fillStyle='#0e222a';ctx.fillRect(x-17,y+13,34,3);ctx.fillStyle=u.team==='blue'?'#b6d7a5':'#f0b3a2';ctx.fillRect(x-17,y+13,34*clamp(u.readiness/100,0,1),3);
    }
    if(targetMode&&pointer&&inBounds(Math.floor(pointer.x),Math.floor(pointer.y))){const x=(Math.floor(pointer.x)+.5)*T,y=(Math.floor(pointer.y)+.5)*T;ctx.strokeStyle='#f2d79b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,11,0,2*Math.PI);ctx.moveTo(x-15,y);ctx.lineTo(x+15,y);ctx.moveTo(x,y-15);ctx.lineTo(x,y+15);ctx.stroke()}
    ctx.restore();lastPaint=now;
  }
  function pickFriendly(x,y){const list=friendly().map(u=>({u,d:dist({x,y},u)})).sort((a,b)=>a.d-b.d);return list[0]?.d<.9?list[0].u:null}
  function handlePointerClick(x,y){if(targetMode){const u=unit(state.selectedId);if(u)orderCommand(u.id,'move',Math.floor(x+.5),Math.floor(y+.5));targetMode=false;mapFrame.classList.remove('command-target');$('#mapInstruction').textContent='คลิกหน่วยสีน้ำเงินเพื่อเลือก • ลากแผนที่เพื่อเลื่อน';return}
    const found=pickFriendly(x,y);if(found){state.selectedId=found.id;updateUi();toast('เลือก '+found.name)}else{const spot=state.locations.find(p=>dist(p,{x,y})<1);if(spot)toast(`${spot.name} • สถานะ ${spot.owner==='blue'?'ฝ่ายเรา':spot.owner==='red'?'ฝ่ายตรงข้าม':'เป็นกลาง'}`)}
  }
  function zoomAt(factor){camera.zoom=clamp(camera.zoom*factor,.75,2.8);$('#mapScale').textContent=`ZOOM ${camera.zoom.toFixed(1)}× · FICTIONAL`}
  function initEvents(){
    $('#nav').addEventListener('click',(ev)=>{const b=ev.target.closest('[data-page]');if(b)switchPage(b.dataset.page)});
    $$('.layer').forEach(b=>b.addEventListener('click',()=>{layer=b.dataset.layer;$$('.layer').forEach(c=>c.classList.toggle('active',c===b))}));
    $('#zoomIn').addEventListener('click',()=>zoomAt(1.3));$('#zoomOut').addEventListener('click',()=>zoomAt(1/1.3));$('#zoomReset').addEventListener('click',()=>{camera={x:17,y:11,zoom:1};zoomAt(1)});
    $('#pauseButton').addEventListener('click',()=>{state.paused=!state.paused;updateUi();toast(state.paused?'หยุดเวลาจำลองแล้ว':'เดินเวลาจำลองต่อแล้ว')});
    $('#speedSelect').addEventListener('change',ev=>{state.speed=Number(ev.target.value)||1;toast('ปรับความเร็วเป็น '+state.speed+'×')});
    $('#saveButton').addEventListener('click',()=>save());$('#loadButton').addEventListener('click',load);
    $('#newGameButton').addEventListener('click',()=>{$('#newGameModal').hidden=false});$('#mobileNewGameButton').addEventListener('click',()=>{$('#newGameModal').hidden=false});$('#mobileLoadButton').addEventListener('click',load);const close=()=>{$('#newGameModal').hidden=true};$('#modalClose').onclick=close;$('#cancelNewGame').onclick=close;$('#newGameModal').addEventListener('click',ev=>{if(ev.target.id==='newGameModal')close()});$('#confirmNewGame').onclick=()=>{reset($('#scenarioSelect').value);close();toast('เริ่มโลกจำลองใหม่แล้ว')};
    $('#viewAllReports').addEventListener('click',()=>switchPage('reports'));$('#exportButton').addEventListener('click',exportJson);
    document.addEventListener('click',ev=>{const b=ev.target.closest('[data-order]');if(b){setCommand(b.dataset.order);return}const f=ev.target.closest('[data-select-unit]');if(f){state.selectedId=f.dataset.selectUnit;targetMode=false;switchPage('map');toast('เลือกหน่วยแล้ว');return}const s=ev.target.closest('[data-staff]');if(s){staffAction(s.dataset.staff);return}const n=ev.target.closest('[data-nation]');if(n){nationAction(n.dataset.nation);return}});
    mapFrame.addEventListener('pointerdown',ev=>{if(ev.target!==canvas)return;mapFrame.setPointerCapture(ev.pointerId);drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,moved:false,cx:camera.x,cy:camera.y}});
    mapFrame.addEventListener('pointermove',ev=>{const rect=canvas.getBoundingClientRect();const sx=ev.clientX-rect.left,sy=ev.clientY-rect.top;pointer=screenToWorld(sx,sy);$('#mapCoords').textContent=`GRID ${Math.floor(pointer.x+0.5)} / ${Math.floor(pointer.y+0.5)}`;
      if(drag&&drag.id===ev.pointerId){let dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){const sz=screenTransform().size;camera.x=clamp(drag.cx-dx/sz,-2,W+1);camera.y=clamp(drag.cy-dy/sz,-2,H+1)}}
      const e=adversaries().find(u=>discovered(u)&&dist(u,pointer)<.7);const t=state.locations.find(t=>dist(t,pointer)<.65);const el=$('#cursorTooltip');if(!targetMode && !drag?.moved && (e||t)){el.hidden=false;el.textContent=e?'ตรวจพบ '+UNIT_TYPES[e.type]+' (ข้อมูลโดยประมาณ)':t.name;el.style.left=Math.min(rect.width-160,sx+12)+'px';el.style.top=Math.max(10,sy-10)+'px'}else el.hidden=true;
    });
    mapFrame.addEventListener('pointerup',ev=>{if(!drag||drag.id!==ev.pointerId)return;let wasDrag=drag.moved;drag=null;try{mapFrame.releasePointerCapture(ev.pointerId)}catch(e){}if(wasDrag)return;const rect=canvas.getBoundingClientRect();const p=screenToWorld(ev.clientX-rect.left,ev.clientY-rect.top);if(inBounds(p.x,p.y))handlePointerClick(p.x,p.y)});
    mapFrame.addEventListener('pointercancel',()=>{drag=null});mapFrame.addEventListener('pointerleave',()=>{$('#cursorTooltip').hidden=true});
    mapFrame.addEventListener('wheel',ev=>{ev.preventDefault();zoomAt(ev.deltaY>0?1/1.12:1.12)},{passive:false});
    window.addEventListener('keydown',ev=>{if(ev.key==='Escape'){targetMode=false;$('#newGameModal').hidden=true;mapFrame.classList.remove('command-target');$('#mapInstruction').textContent='คลิกหน่วยสีน้ำเงินเพื่อเลือก • ลากแผนที่เพื่อเลื่อน'}if(ev.code==='Space'&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement?.tagName)){ev.preventDefault();state.paused=!state.paused;updateUi()}});
    window.addEventListener('resize',resize);new ResizeObserver(resize).observe(mapFrame);
    document.addEventListener('visibilitychange',()=>{lastTick=performance.now()});
  }
  function loop(now){const elapsed=Math.min(lastTick?(now-lastTick)/1000:0,.15);lastTick=now;if(!state.paused)updateSim(elapsed*.10*state.speed);draw(now);if(now-lastUi>700){updateUi();lastUi=now}if(now-state.lastAutosave>20000){state.lastAutosave=now;save(AUTO,false)}requestAnimationFrame(loop)}
  initEvents();reset('frontier');resize();requestAnimationFrame(loop);
})();
