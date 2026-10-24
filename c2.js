/* THE ART OF COMMAND 0.7 — fictional command-and-staff simulation.
   Game-balancing coefficients are invented; this is not an operational military model. */
const C2 = (() => {
  const DESKS = {
    S1: {name:'กำลังพล', attribute:'medical'},
    S2: {name:'ข่าวกรอง', attribute:'intelligence'},
    S3: {name:'ยุทธการ', attribute:'operations'},
    S4: {name:'ส่งกำลังบำรุง', attribute:'logistics'},
    S6: {name:'สื่อสาร', attribute:'communications'}
  };
  const CASES = {
    personnel:{title:'ตรวจสอบยอดกำลังพล',desk:'S1',minutes:16,cost:0,description:'ตรวจสอบความสอดคล้องของบัญชีกำลังพล'},
    intel:{title:'รวบรวมข่าวสารล่าสุด',desk:'S2',minutes:22,cost:0,description:'ปรับความทันสมัยของสรุปข่าวกรอง'},
    ops:{title:'ทบทวนความคืบหน้าภารกิจ',desk:'S3',minutes:18,cost:0,description:'สรุปข้อขัดข้องในแผนภารกิจ'},
    sustain:{title:'ตรวจแผนจัดสรรทรัพยากร',desk:'S4',minutes:24,cost:0,description:'จัดทำรายงานความพร้อมด้านสนับสนุน'},
    comms:{title:'ตรวจเครือข่ายสื่อสาร',desk:'S6',minutes:20,cost:0,description:'ลดภาระงานค้างด้านการติดต่อ'}
  };
  const STYLES = {cautious:'รอบคอบ',balanced:'สมดุล',initiative:'ริเริ่ม'};
  const MIN=20, MAX=95;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const esc=(x)=>String(x??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const commander=(s,u)=>s.commanders.find(c=>c.id===u?.commanderId);
  const hash=(s)=>Array.from(String(s)).reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))|0,97)>>>0;
  const trait=(c,k,def=65)=>clamp(Number(c?.c2Traits?.[k]??def),MIN,MAX);
  function seedCommander(c){
    if(!c.c2Traits){const h=hash(c.id);c.c2Traits={planning:45+h%41, communication:48+(h>>>5)%39, initiative:40+(h>>>11)%48, resilience:46+(h>>>17)%40};}
    c.commandStyle=STYLES[c.commandStyle] ? c.commandStyle : 'balanced';
    c.c2Stress=clamp(Number(c.c2Stress??24),0,100);
    c.c2Experience=clamp(Number(c.c2Experience??25+(hash(c.id)%55)),0,100);
    c.c2LastDecision=Number(c.c2LastDecision??-1);
  }
  function initialize(s,fromSave=false){
    s.c2 ??= {cases:[],history:[],caseSerial:0,messagesSent:0,messagesReceived:0,lastDeskUpdate:0};
    s.c2.cases ??=[];s.c2.history??=[];s.c2.caseSerial??=0;s.c2.messagesSent??=0;s.c2.messagesReceived??=0;
    s.commanders.forEach(seedCommander);
    if(!fromSave && !s.c2.cases.length){
      createCase(s,'personnel','army',true);
      createCase(s,'comms','div2',true);
    }
  }
  function staffPressure(s,desk){
    const pending=s.c2.cases.filter(c=>c.desk===desk && c.status!=='done' && c.status!=='cancelled').length;
    const attrib=DESKS[desk]?.attribute;
    const efficacy=clamp(Number(s.staff?.[attrib]??65),20,100);
    return {pending,efficacy,load:clamp(Math.round(pending*22+(100-efficacy)*0.6),0,100)};
  }
  function createCase(s,type,unitId,silent=false){
    const spec=CASES[type];if(!spec)return false;
    if(!s.units.some(u=>u.id===unitId && u.side==='ally'))return false;
    if(s.c2.cases.some(c=>c.type===type && c.unitId===unitId && !['done','cancelled'].includes(c.status)))return false;
    const entry={id:`staff-${++s.c2.caseSerial}`,type,unitId,desk:spec.desk,title:spec.title,
      status:'queued',progress:0,createdAt:s.absMinutes,required:spec.minutes,assignedAt:null,completedAt:null};
    s.c2.cases.unshift(entry);s.c2.cases=s.c2.cases.slice(0,70);
    if(!silent){note(s,`${entry.desk}: รับงาน ${entry.title} (${s.units.find(u=>u.id===unitId)?.name})`);}
    return entry;
  }
  function note(s,msg){s.c2.history.unshift({time:s.absMinutes,text:String(msg).slice(0,175)});s.c2.history=s.c2.history.slice(0,45);}
  function tick(s,dt,{rng,logEvent,getUnit,aggregateOf}={}){
    for(const c of s.commanders){
      seedCommander(c);
      const u=getUnit(c.assignedUnitId);
      const stressEffect=u && u.side==='ally' && u.echelon==='company' ? (u.fatigue>55?0.02:-0.012) : -0.018;
      c.c2Stress=clamp(c.c2Stress+(stressEffect-(trait(c,'resilience')-60)*0.00018)*dt,0,100);
    }
    // Each desk can work one queued case at a time. Capacity scales with the simulated staff quality.
    for(const desk of Object.keys(DESKS)){
      let active=s.c2.cases.find(c=>c.desk===desk && c.status==='active');
      if(!active){active=s.c2.cases.filter(c=>c.desk===desk&&c.status==='queued').sort((a,b)=>a.createdAt-b.createdAt)[0];if(active){active.status='active';active.assignedAt=s.absMinutes;}}
      if(!active)continue;
      const k=DESKS[desk].attribute;
      active.progress=clamp(active.progress+dt*(0.48+Number(s.staff[k]??60)/100),0,active.required);
      if(active.progress>=active.required){
        active.status='done';active.completedAt=s.absMinutes;
        // modest bounded changes, not instant resources or factual intelligence
        if(desk==='S6')s.staff.communications=clamp(s.staff.communications+1.2,20,100);
        if(desk==='S3')s.staff.operations=clamp(s.staff.operations+0.9,20,100);
        if(desk==='S1')s.staff.medical=clamp(s.staff.medical+0.6,20,100);
        note(s,`${desk}: ปิดงาน ${active.title}`);
        logEvent(desk,`รายงานงานเสนาธิการ: ${active.title} สำเร็จ`);
      }
    }
  }
  function estimateTime(s,origin,leaf,path){
    const officers=path.map(u=>commander(s,u));
    const quality=officers.reduce((t,c)=>t+trait(c,'communication'),0)/Math.max(1,officers.length);
    const pressure=staffPressure(s,'S6').load;
    const skillFactor=clamp((122-quality)/75,.35,1.42);
    const delayBase=path.reduce((t,u)=>t+Math.max(1,(u.commandDelay??4)*.31),0);
    const stageList=[{key:'review',label:'ฝ่ายเสนาธิการตรวจสอบ',duration:clamp(2.1+staffPressure(s,'S3').load*.055,2,13)},
      ...path.map((u,i)=>({key:'relay',label:`ส่งต่อถึง ${u.name}`,duration:clamp((i===0?2:2.5)+Math.max(1,u.commandDelay*.26)*skillFactor,2,15)})),
      {key:'ack',label:'หน่วยรองยืนยันการรับ',duration:clamp(2+pressure*.045+(100-trait(commander(s,leaf),'communication'))*.04,2,13)}];
    return stageList;
  }
  function decorateOrder(s,msg,origin,leaf,path){
    const stages=estimateTime(s,origin,leaf,path);
    msg.c2={stages,index:0,status:'กำลังตรวจคำสั่ง',notes:[],clarity:clamp(Math.round((trait(commander(s,origin),'planning')+trait(commander(s,leaf),'communication'))/2-staffPressure(s,'S6').load*.08),25,98)};
    msg.dueAt=s.absMinutes+stages[0].duration;
    s.c2.messagesSent++;
    return msg;
  }
  function decorateReport(s,msg,u){
    const c=commander(s,u);
    const quality=clamp(Math.round(trait(c,'communication')*.4+trait(c,'planning')*.25+Number(s.staff.intelligence??60)*.35-(c?.c2Stress??20)*.08),25,95);
    msg.c2={stages:[{key:'collect',label:'กำลังรวบรวมข้อมูล',duration:clamp(4+(100-quality)*.12,4,15)},
      {key:'send',label:'ส่งรายงานกลับ',duration:clamp(3+staffPressure(s,'S6').load*.1,3,15)}],index:0,status:'กำลังรวบรวม',quality,notes:[]};
    msg.dueAt=s.absMinutes+msg.c2.stages[0].duration;
    s.c2.messagesSent++;
  }
  function handleRelay(s,msg,{logEvent,rng,getUnit}={}){
    if(!msg.c2)return true; // migrate old save deliveries safely
    const d=msg.c2;
    const curr=d.stages[d.index];
    if(!curr)return true;
    d.notes.push({at:s.absMinutes,label:curr.label});
    if(d.notes.length>16)d.notes.shift();
    d.index++;
    if(d.index<d.stages.length){
      const next=d.stages[d.index];
      d.status=next.label;
      msg.dueAt=s.absMinutes+next.duration;
      return false;
    }
    d.status='ดำเนินการแล้ว';d.completedAt=s.absMinutes;
    s.c2.messagesReceived++;
    const who=getUnit(msg.targetId)?.name||'หน่วย';
    if(msg.kind==='order')note(s,`คำสั่ง ${msg.order} ถึง ${who} พร้อมการตอบรับ`);
    if(msg.kind==='report')note(s,`ได้รับรายงานจาก ${who} (ความเชื่อมั่น ${d.quality}%)`);
    return true;
  }
  function reportSnapshot(s,msg){
    const snap={...msg.snapshot};
    const quality=msg.c2?.quality??65;
    const deviation=(100-quality)/100;
    const mod=(hash(msg.id+Math.floor(s.absMinutes))%200-100)/100;
    snap.strength=Math.max(0,Math.round((snap.strength??0)*(1+mod*deviation*.16)));
    for(const key of ['readiness','supply','morale','fatigue'])snap[key]=clamp(Math.round((snap[key]??0)+mod*deviation*8),0,100);
    snap.confidence=quality;
    snap.estimate=true;
    return snap;
  }
  function assessDelegation(s,u,c){
    if(!c)return {kind:u.fatigue>62||u.supply<34?'rest':'hold',why:'เกณฑ์ประจำหน่วย'};
    seedCommander(c);
    const cautious=c.commandStyle==='cautious';
    const initiative=c.commandStyle==='initiative';
    const limit=cautious?51:initiative?77:64;
    if(u.supply<(cautious?48:34))return {kind:'rest',why:'เสบียงต่ำกว่าที่รับได้ตามบุคลิก ผบช.'};
    if(u.fatigue>limit)return {kind:'rest',why:'ความล้าสะสม'};
    if(u.readiness<(cautious?57:39))return {kind:'rest',why:'ความพร้อมกำลังพลต่ำ'};
    if(c.c2Stress>80)return {kind:'hold',why:'ความเครียดของผู้บังคับบัญชา'};
    return {kind:'hold',why:initiative?'พร้อมปฏิบัติงานภายในขอบเขตที่ได้รับมอบอำนาจ':'รักษาสภาพพร้อมรับภารกิจ'};
  }
  function metrics(s){
    const open=s.c2.cases.filter(c=>!['done','cancelled'].includes(c.status)).length;
    const active=s.relays.filter(r=>r.c2).length;
    const avg=Math.round(s.commanders.reduce((sum,c)=>sum+trait(c,'communication'),0)/Math.max(1,s.commanders.length));
    return {open,active,avg,delivered:s.c2.messagesReceived};
  }
  return {initialize,tick,estimateTime,decorateOrder,decorateReport,handleRelay,reportSnapshot,assessDelegation,createCase,note,staffPressure,metrics,STYLES,DESKS,CASES,trait,seedCommander};
})();
