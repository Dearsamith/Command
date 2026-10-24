/* v0.8 — Fictional logistics, maintenance and medical simulation.
 * Game abstractions; no historical/operational performance data.
 */
const Sustain = (() => {
  const TYPES = {
    food:{label:'อาหาร',unit:'ชุด'}, water:{label:'น้ำ',unit:'ลิตร'}, fuel:{label:'เชื้อเพลิง',unit:'หน่วย'},
    parts:{label:'อะไหล่',unit:'ชุด'}, medical:{label:'เวชภัณฑ์',unit:'ชุด'}
  };
  const C = (x,a,b)=>Math.min(b,Math.max(a,x));
  const depotSeed=(factor=1)=>({food:Math.round(5400*factor),water:Math.round(6800*factor),fuel:Math.round(3100*factor),parts:Math.round(460*factor),medical:Math.round(420*factor)});
  function initialize(s, fromSave=false){
    s.sustain ||= {transports:[],history:[],lastAlert:{},serial:0,delivered:0,totalConsumed:{food:0,water:0,fuel:0,parts:0,medical:0}};
    s.sustain.transports ||= []; s.sustain.history ||= [];s.sustain.lastAlert ||= {};s.sustain.totalConsumed ||= {food:0,water:0,fuel:0,parts:0,medical:0};
    s.sustain.serial ??= 0;s.sustain.delivered ??= 0;
    s.depots.forEach((d,i)=>{
      if(!d.resources) d.resources=depotSeed(i?0.85:1);
    });
    s.units.filter(u=>u.echelon==='company' && u.side==='ally').forEach((u,i)=>{
      if(!u.sustain){
        const n=u.strength||120;
        u.sustain={
          stocks:{food:Math.round(n*3.4),water:Math.round(n*4),fuel:Math.round(95+(i%4)*18),parts:Math.round(18+i%4),medical:Math.round(10+i%3)},
          hunger:0,dehydration:0,careBacklog:0,repairProgress:0,medicalProgress:0,
          consumption:{food:0,water:0,fuel:0}, lastMedical:0, lastRepair:0,
          medicalPriority:'balanced',maintenancePriority:'balanced',rationing:'normal'
        };
      }
      const r=u.sustain;r.stocks ||= {};Object.keys(TYPES).forEach(k=>r.stocks[k] ??= 0);
      r.hunger ??= 0;r.dehydration ??= 0;r.repairProgress ??= 0;r.medicalProgress ??= 0;r.rationing ||= 'normal';r.medicalPriority ||= 'balanced';r.maintenancePriority ||= 'balanced';
    });
  }
  function record(s,message){
    s.sustain.history.unshift({stamp:Math.round(s.absMinutes),message});
    if(s.sustain.history.length>35)s.sustain.history.length=35;
  }
  function consume(u,k,quantity,s){
    const inv=u.sustain.stocks;
    const used=Math.min(inv[k],Math.max(0,quantity));inv[k]=Math.max(0,inv[k]-used);
    s.sustain.totalConsumed[k]=(s.sustain.totalConsumed[k]||0)+used;
    return used;
  }
  function advanceUnit(u,dt,s){
    const z=u.sustain, crew=u.establishment, pop=Math.max(1,crew.elements.reduce((t,e)=>t+e.ready+e.wounded+e.sick+e.resting,0));
    const rationFactor=z.rationing==='strict'?.70:z.rationing==='conserve'?.86:1;
    const weather=String(s.weather);
    const cold=weather.includes('หิมะ')||weather.includes('หนาว')?1.22:1;
    const moving=u.order==='MOVE'?1.28:1;
    const foodNeed=pop*.00090*dt*rationFactor*moving;
    const waterNeed=pop*.00125*dt*rationFactor*moving*cold;
    const eraFactor=u.unitRole?.startsWith('Modern')?1.18:u.unitRole?.startsWith('WWII')?.83:1;
    const fuelNeed=(u.order==='MOVE'?1.3:.13)*dt*(.5+crew.vehicles.operational/12)*cold*eraFactor;
    const fd=consume(u,'food',foodNeed,s)/Math.max(.0001,foodNeed);
    const wd=consume(u,'water',waterNeed,s)/Math.max(.0001,waterNeed);
    const fl=consume(u,'fuel',fuelNeed,s)/Math.max(.0001,fuelNeed);
    z.hunger=C(z.hunger+(1-fd)*.065*dt-(fd>.99?.015*dt:0),0,100);
    z.dehydration=C(z.dehydration+(1-wd)*.085*dt-(wd>.99?.015*dt:0),0,100);
    if(z.rationing!=='normal')u.morale=C(u.morale-.005*dt,0,100);
    if(u.order==='MOVE'&&fl<.70){u.fatigue=C(u.fatigue+.05*dt,0,100);u.statusCause='เชื้อเพลิงไม่เพียงพอ — ประสิทธิภาพการเดินทางลดลง';}
    if(z.hunger>25 || z.dehydration>25){u.fatigue=C(u.fatigue+.022*dt,0,100);u.morale=C(u.morale-.026*dt,0,100);}
    // Real personnel ledger already exists. Medical resources move wounded -> resting -> ready.
    const treatmentCapacity=(z.medicalPriority==='urgent'?1.7:z.medicalPriority==='conserve'?.55:1) * (.3+s.staff.medical/130);
    z.medicalProgress += dt*treatmentCapacity;
    while(z.medicalProgress>=24 && z.stocks.medical>=.30){
      z.medicalProgress-=24;
      const e=crew.elements.find(x=>x.wounded>0);
      if(!e)break;
      e.wounded--;e.resting++;consume(u,'medical',.30,s);z.lastMedical=s.absMinutes;
      s.world.medicalTreated=(s.world.medicalTreated||0)+1;
    }
    // Repair blocked by missing parts, fuel or unavailable staff.
    const repairFactor=(z.maintenancePriority==='urgent'?1.6:z.maintenancePriority==='conserve'?.6:1) * (.3+s.staff.logistics/130);
    if(crew.vehicles.underRepair>0 && z.stocks.parts>=2){
      z.repairProgress += dt*repairFactor;
      while(z.repairProgress>=95 && crew.vehicles.underRepair>0 && z.stocks.parts>=2){
        z.repairProgress-=95;consume(u,'parts',2,s);
        crew.vehicles.underRepair--;crew.vehicles.operational++;
        crew.equipmentWear=C(crew.equipmentWear-8,0,100);z.lastRepair=s.absMinutes;
      }
    }
    const foodCap=pop*3.4,waterCap=pop*4.2;
    const vals=[C(z.stocks.food/Math.max(1,foodCap),0,1),C(z.stocks.water/Math.max(1,waterCap),0,1),C(z.stocks.fuel/170,0,1)];
    u.supply=C(Math.round((vals[0]*.4+vals[1]*.4+vals[2]*.2)*100),0,100);
    if(s.absMinutes-(s.sustain.lastAlert[u.id]||-999)>130 && (u.supply<30 || z.dehydration>50)){
      s.sustain.lastAlert[u.id]=s.absMinutes;
      record(s,`${u.name}: ทรัพยากรคงเหลือต่ำ ควรดำเนินการส่งกำลัง`);
    }
  }
  function update(s,dt){
    if(!s.sustain)return;
    s.units.filter(u=>u.side==='ally'&&u.echelon==='company'&&u.sustain&&u.establishment).forEach(u=>advanceUnit(u,dt,s));
    for(const tr of s.sustain.transports){
      if(tr.status!=='moving')continue;
      const p=C((s.absMinutes-tr.startAt)/Math.max(1,tr.endAt-tr.startAt),0,1);
      const u=s.units.find(x=>x.id===tr.unitId),d=s.depots.find(x=>x.id===tr.depotId);
      const route=tr.path||[];
      if(route.length){const index=Math.min(route.length-1,Math.floor(p*(route.length-1)));tr.x=route[index].x;tr.y=route[index].y;}
      if(p>=1){
        if(u?.sustain){u.sustain.stocks[tr.type]+=tr.amount;tr.status='arrived';tr.arrivedAt=s.absMinutes;s.sustain.delivered++;record(s,`ขนส่ง ${TYPES[tr.type].label} ${tr.amount} ถึง ${u.name}`);}
        else {d.resources[tr.type]+=tr.amount;tr.status='cancelled';}
      }
    }
  }
  function dispatch(s,unitId,depotId,type,amount){
    const u=s.units.find(x=>x.id===unitId),d=s.depots.find(x=>x.id===depotId);
    amount=Math.round(Number(amount));
    if(!u||u.side!=='ally'||u.echelon!=='company'||!u.sustain)return {ok:false,message:'เลือกกองร้อยฝ่ายเรา'};
    if(!d||!TYPES[type]||!Number.isFinite(amount)||amount<1||amount>2500)return {ok:false,message:'ตรวจสอบคลัง ประเภท และจำนวน'};
    if((d.resources[type]||0)<amount)return {ok:false,message:'ทรัพยากรในคลังไม่พอ'};
    const r=World.route(d.x,d.y,u.x,u.y);
    if(!r.reachable)return {ok:false,message:'ไม่มีเส้นทางส่งกำลังที่ผ่านได้'};
    const cost=Math.max(3,Math.ceil(amount/150)+6);
    if(s.economy.budget<cost)return {ok:false,message:'งบประมาณไม่เพียงพอ'};
    d.resources[type]-=amount;s.economy.budget-=cost;
    const eta=Math.max(12,Math.min(240,20+r.cost*1.8/Math.max(.45,World.modifiers(s).pace)));
    const tr={id:`supply-${++s.sustain.serial}`,unitId,depotId,type,amount,cost,status:'moving',startAt:s.absMinutes,endAt:s.absMinutes+eta,x:d.x,y:d.y,path:r.points};
    s.sustain.transports.unshift(tr);record(s,`สั่งขนส่ง ${TYPES[type].label} ${amount} จาก ${d.name} ถึง ${u.name}`);
    return {ok:true,message:`จัดขนส่งแล้ว ETA ${Math.round(eta)} นาทีในเกม`};
  }
  function unitSummary(u){
    if(!u?.sustain)return null;
    const e=u.establishment?.elements||[];
    return {stocks:u.sustain.stocks,wounded:e.reduce((n,x)=>n+x.wounded,0),sick:e.reduce((n,x)=>n+x.sick,0),resting:e.reduce((n,x)=>n+x.resting,0),repair:u.establishment?.vehicles?.underRepair||0};
  }
  return {TYPES,initialize,update,dispatch,unitSummary};
})();
