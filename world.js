/* THE ART OF COMMAND v0.6 — Fictional world physics / unit establishment.
   All distances, times and rates are game abstractions, not real-world military data. */
const World = (()=>{
  const W=980,H=560,S=20,COLS=W/S,ROWS=H/S;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
  const hash=(x,y)=>{let k=Math.imul((x+51),1664525)^Math.imul((y+17),1013904223);k^=k>>>13;return (k>>>0)/4294967295;};
  const terrainAt=(x,y)=>Theaters.terrainAt(x,y);
  function tile(x,y){const k=terrainAt(x,y);const cost={road:.56,plain:1,field:1.15,beach:1.4,hill:2.45,forest:1.8,urban:1.25,river:Infinity,water:Infinity,outside:Infinity}[k];return {kind:k,passable:Number.isFinite(cost),cost};}
  const riverY=x=>Theaters.def().river?.(x)??null;
  const toCell=(x,y)=>({c:clamp(Math.floor(x/S),0,COLS-1),r:clamp(Math.floor(y/S),0,ROWS-1)});
  const center=(c,r)=>({x:(c+.5)*S,y:(r+.5)*S});
  const index=(c,r)=>r*COLS+c;
  function nearestFree(cell){
    if(tile(center(cell.c,cell.r).x,center(cell.c,cell.r).y).passable)return cell;
    for(let rad=1;rad<12;rad++)for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){
      const c=cell.c+dx,r=cell.r+dy;if(c<0||r<0||c>=COLS||r>=ROWS)continue;
      const p=center(c,r);if(tile(p.x,p.y).passable)return {c,r};
    }return cell;
  }
  function route(sx,sy,tx,ty){
    const a=nearestFree(toCell(sx,sy)),b=nearestFree(toCell(tx,ty));
    const goal=index(b.c,b.r),start=index(a.c,a.r);
    const count=COLS*ROWS, best=new Float64Array(count).fill(Infinity),came=new Int32Array(count).fill(-1),visited=new Uint8Array(count),open=[start];
    best[start]=0;
    const heuristic=(i)=>{const c=i%COLS,r=Math.floor(i/COLS);return Math.hypot(c-b.c,r-b.r)*.55;};
    let found=false;
    while(open.length){
      let top=0,lowest=Infinity;
      for(let j=0;j<open.length;j++){const v=best[open[j]]+heuristic(open[j]);if(v<lowest){lowest=v;top=j;}}
      const current=open.splice(top,1)[0];if(visited[current])continue;
      if(current===goal){found=true;break;}
      visited[current]=1;const c=current%COLS,r=Math.floor(current/COLS);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;const nc=c+dx,nr=r+dy;if(nc<0||nr<0||nc>=COLS||nr>=ROWS)continue;
        const np=center(nc,nr),tt=tile(np.x,np.y);if(!tt.passable)continue;
        if(dx&&dy){const p1=center(c+dx,r),p2=center(c,r+dy);if(!tile(p1.x,p1.y).passable||!tile(p2.x,p2.y).passable)continue;}
        const ni=index(nc,nr);if(visited[ni])continue;
        const cp=center(c,r), ct=tile(cp.x,cp.y);
        const score=best[current]+(dx&&dy?Math.SQRT2:1)*((tt.cost+ct.cost)/2);
        if(score<best[ni]){best[ni]=score;came[ni]=current;open.push(ni);}
      }
    }
    if(!found)return {points:[],cost:Infinity,reachable:false};
    let nodes=[goal],cur=goal,guard=0;
    while(cur!==start && guard++<count){cur=came[cur];if(cur===-1)break;nodes.push(cur);}
    nodes.reverse();
    const raw=nodes.map(i=>center(i%COLS,Math.floor(i/COLS)));
    // adjacent waypoints are kept to honor impassable cells; smoother rendering via polyline
    return {points:raw,cost:Math.round(best[goal]*10)/10,reachable:true};
  }
  function dayInfo(s){const h=((s.timeMinutes%1440)+1440)%1440/60;return {hour:h,daylight:h>=6&&h<18,light:h>=7&&h<=17?'day':h>=5&&h<7||h>17&&h<=19?'twilight':'night'};}
  const weatherDefs={
    'ท้องฟ้าโปร่ง':{pace:1,visibility:1,fatigue:1},'มีเมฆบาง':{pace:.98,visibility:.92,fatigue:1},
    'หมอกเช้า':{pace:.83,visibility:.49,fatigue:1.1},'ฝนเบา':{pace:.76,visibility:.65,fatigue:1.25},
    'ฝนหนัก':{pace:.55,visibility:.37,fatigue:1.48},
    'หนาวจัด':{pace:.66,visibility:.70,fatigue:1.34},'หิมะตก':{pace:.52,visibility:.41,fatigue:1.55}
  };
  function modifiers(s){
    const w=weatherDefs[s.weather]||weatherDefs['ท้องฟ้าโปร่ง'],light=dayInfo(s);
    return {...w,light,visibility:w.visibility*(light.light==='day'?1:light.light==='twilight'?.66:.34),pace:w.pace*(light.light==='night'?.80:1)};
  }
  const initialStructure=(u,i)=>{
    const strength=Math.max(0,Math.round(u.strength||0));
    const allocations=[.28,.27,.27,.18], labels=['หมวดที่ 1','หมวดที่ 2','หมวดที่ 3','ชุดสนับสนุน'];let used=0;
    const elements=allocations.map((ratio,idx)=>{const num=idx===3?strength-used:Math.round(strength*ratio);used+=num;return {name:labels[idx],authorized:idx===3?28:43,ready:num,wounded:0,sick:0,resting:0};});
    return {elements,vehicles:{authorized:8,operational:5+i%4,underRepair:1+i%2},equipmentWear:clamp(8+i%8,0,100),maintenanceHours:0,skill: Math.round(56+u.training*36),restDebt:8+i%13};
  };
  function totals(u){
    if(!u.establishment)return {authorized:u.strength||0,ready:u.strength||0,wounded:0,sick:0,resting:0};
    const e=u.establishment.elements;
    return {authorized:e.reduce((a,x)=>a+x.authorized,0),ready:e.reduce((a,x)=>a+x.ready,0),wounded:e.reduce((a,x)=>a+x.wounded,0),sick:e.reduce((a,x)=>a+x.sick,0),resting:e.reduce((a,x)=>a+x.resting,0)};
  }
  function syncStrength(u){if(u.establishment)u.strength=totals(u).ready;}
  function initialize(state,fromSave=false){
    const all=state.units.filter(u=>u.echelon==='company');
    all.forEach((u,i)=>{
      if(!u.establishment)u.establishment=initialStructure(u,i);
      u.nav ||= {waypoints:[],next:0,destination:null,remaining:0,blocked:false};
      u.statusCause ||= '';
      syncStrength(u);
    });
    state.world ||= {};
    state.world.lastWeatherShift ??= 0;
    state.world.travelKm ??= 0;
    state.world.medicalTreated ??= 0;
    state.world.lastMaintenance ??= 0;
    state.world.rulesVersion='v0.6-fictional';
    if(!fromSave){state.weather='ท้องฟ้าโปร่ง';state.world.lastWeatherShift=0;}
  }
  function updateWeather(state,rng){
    if(state.absMinutes-state.world.lastWeatherShift < 210)return;
    state.world.lastWeatherShift=state.absMinutes;
    const d=dayInfo(state),choices=state.scenario?.season==='forest' ? ['หนาวจัด','หิมะตก','มีเมฆบาง'] : d.light==='twilight'?['ท้องฟ้าโปร่ง','มีเมฆบาง','หมอกเช้า','ฝนเบา']:['ท้องฟ้าโปร่ง','มีเมฆบาง','ฝนเบา','ฝนหนัก'];
    const next=choices[Math.floor(rng()*choices.length)];
    if(next!==state.weather){state.weather=next;state.events.unshift({id:`e${state.eventSerial++}`,stamp:`D${String(state.day).padStart(2,'0')} ${String(Math.floor(state.timeMinutes/60)).padStart(2,'0')}:${String(Math.floor(state.timeMinutes%60)).padStart(2,'0')}`,source:'METEO',message:`อากาศเปลี่ยนเป็น ${next} — กระทบการเดินทางและทัศนวิสัย`});}
  }
  function issueMove(u,x,y){
    if(!u?.nav)return;
    const adjusted=nearestFree(toCell(x,y)),finish=center(adjusted.c,adjusted.r);
    const reachable=tile(x,y).passable;
    const goal=reachable?{x,y}:finish;
    const r=route(u.x,u.y,goal.x,goal.y);
    if(r.reachable && reachable)r.points.push(goal);
    u.targetX=goal.x;u.targetY=goal.y;
    u.nav={waypoints:r.points,next:0,destination:goal,remaining:r.cost,blocked:!r.reachable};
    u.statusCause=r.reachable?'กำลังเดินทางบนเส้นทางที่เลือก':'ไม่มีเส้นทางที่ผ่านได้';
    if(!r.reachable)u.order='HOLD';
  }
  function advanceMovement(u,dt,s){
    if(!u.nav?.waypoints?.length)return {distance:0,completed:true};
    const m=modifiers(s),mech=u.establishment;
    const functional=mech.vehicles.operational / Math.max(1,mech.vehicles.authorized),fuelFactor=u.sustain?clamp(u.sustain.stocks.fuel/30,.32,1):1;
    const speed=8*(u.eraKit?.vehicleFactor||1)*(.7+functional*.3)*(1-u.fatigue/170)*m.pace*fuelFactor;
    let effort=clamp(speed,.8,15)*dt,travel=0;
    while(effort>0 && u.nav.next<u.nav.waypoints.length){
      const p=u.nav.waypoints[u.nav.next],t=tile(u.x,u.y);const cost=t.cost||1;
      const d=dist(u.x,u.y,p.x,p.y),step=Math.min(d,effort/cost);
      if(d>0){u.x+=((p.x-u.x)/d)*step;u.y+=((p.y-u.y)/d)*step;travel+=step;effort-=step*cost;}
      if(d<=step+.01)u.nav.next++;
      if(d===0 && u.nav.next>=u.nav.waypoints.length)break;
    }
    const complete=u.nav.next>=u.nav.waypoints.length;
    if(complete){u.nav.waypoints=[];u.nav.next=0;u.nav.remaining=0;u.order='HOLD';u.statusCause='ถึงจุดหมายและจัดกำลังเข้าที่';}
    else {let remain=dist(u.x,u.y,u.nav.waypoints[u.nav.next].x,u.nav.waypoints[u.nav.next].y);for(let i=u.nav.next+1;i<u.nav.waypoints.length;i++)remain+=dist(u.nav.waypoints[i-1].x,u.nav.waypoints[i-1].y,u.nav.waypoints[i].x,u.nav.waypoints[i].y);u.nav.remaining=Math.round(remain/20*10)/10;}
    return {distance:travel,completed:complete};
  }
  function applyCasualty(u,count){
    if(!u?.establishment)return;
    let n=count;
    for(const e of [...u.establishment.elements].sort((a,b)=>b.ready-a.ready)){
      const amount=Math.min(e.ready,n);e.ready-=amount;e.wounded+=amount;n-=amount;if(n<=0)break;
    }
    syncStrength(u);
  }
  function updateUnit(u,dt,s,rng){
    if(!u?.establishment)return;
    const es=u.establishment,mod=modifiers(s),t=tile(u.x,u.y);
    es.equipmentWear=clamp(es.equipmentWear+(u.order==='MOVE'?.018:.004)*dt*mod.fatigue*(u.eraKit?.maintenanceDemand||1),0,100);
    if(u.order==='MOVE'){
      const travel=advanceMovement(u,dt,s);s.world.travelKm+=travel.distance/50;
      u.supply=clamp(u.supply-.035*dt,0,100);
      u.fatigue=clamp(u.fatigue+.065*dt*mod.fatigue*(t.kind==='hill'?1.35:1),0,100);
    }else if(u.order==='REST'){
      u.fatigue=clamp(u.fatigue-.11*dt,0,100);
      u.morale=clamp(u.morale+.035*dt,0,100);
    }else if(u.order==='DELEGATE'){
      u.fatigue=clamp(u.fatigue-.015*dt,0,100);
    }else{
      u.fatigue=clamp(u.fatigue-.016*dt,0,100);
    }
    u.supply=clamp(u.supply-.008*dt,0,100);
    if(u.supply<35)u.morale=clamp(u.morale-.026*dt,0,100);
    if(es.equipmentWear>65 && es.vehicles.operational>1 && rng()<.004*dt){es.vehicles.operational--;es.vehicles.underRepair++;u.statusCause='อุปกรณ์ต้องเข้ารับการซ่อม';}
    if(!u.sustain && u.order==='REST' && es.vehicles.underRepair>0){
      es.maintenanceHours+=dt;
      if(es.maintenanceHours>=70){es.maintenanceHours-=70;es.vehicles.underRepair--;es.vehicles.operational++;es.equipmentWear=clamp(es.equipmentWear-12,0,100);}
    }
    if((s.weather==='ฝนหนัก'||s.weather==='ฝนเบา') && u.supply<50 && u.fatigue>55 && rng()<.002*dt){
      const e=es.elements.find(x=>x.ready>0);
      if(e){e.ready--;e.sick++;u.statusCause='สุขอนามัยและความเหนื่อยล้ากระทบกำลังพล';}
    }
    if(!u.sustain && u.order==='REST'){
      for(const e of es.elements){
        // simple gradual recovery: injured move to resting first
        if(e.wounded>0 && rng()<.006*dt){e.wounded--;e.resting++;s.world.medicalTreated++;}
        if(e.resting>0 && rng()<.009*dt){e.resting--;e.ready++;}
        if(e.sick>0 && rng()<.003*dt){e.sick--;e.resting++;}
      }
    }
    const total=totals(u),eq=es.vehicles.operational/Math.max(1,es.vehicles.authorized);
    const avail=total.ready/Math.max(1,total.authorized);
    // readiness follows the condition of people and equipment instead of spontaneous improvement
    const target=clamp((avail*.34+eq*.19+u.morale/100*.20+(1-u.fatigue/100)*.17+u.supply/100*.10)*100,0,100);
    u.readiness=clamp(u.readiness+(target-u.readiness)*Math.min(.02*dt,1),0,100);
    syncStrength(u);
  }
  function preview(state,x,y){const t=tile(x,y),m=modifiers(state);return {terrain:t.kind,cost:t.cost,passable:t.passable,pace:m.pace,visibility:m.visibility,light:m.light.light};}
  return {terrainAt,tile,route,toCell,nearestFree,dayInfo,modifiers,initialize,updateWeather,issueMove,updateUnit,applyCasualty,totals,preview,riverY};
})();
