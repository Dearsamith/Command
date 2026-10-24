/* High-level fictional opponent NPC. Abstract goals only; no real-world operational doctrine. */
const Opponent = (() => {
  const goals={
    preserve:{label:'รักษาความพร้อม',description:'ลดการเดินทางที่ไม่จำเป็นและจัดกำลังใหม่',anchor:[805,425]},
    observe:{label:'ติดตามสถานการณ์',description:'ปรับสถานะหน่วยเพื่อสังเกตและรายงาน',anchor:[760,370]},
    reposition:{label:'จัดพื้นที่รับผิดชอบใหม่',description:'กระจายหน่วยไปยังเขตพื้นที่สมมติ',anchor:[710,405]},
    regroup:{label:'ฟื้นสภาพหน่วย',description:'ถอนกลับไปพื้นที่บริการและพักกำลัง',anchor:[875,466]}
  };
  const presets={sandbox:'observe',normandy1944:'reposition',ardennes1944:'preserve',kyiv2022:'observe',kharkiv2022:'reposition'};
  function reset(s){s.opponent={goal:presets[s.scenarioId]||'observe',nextReview:24,lastReview:0,decisionCount:0,morale:72,log:[],seed:s.rngSeed,unitGoals:{}};
    s.units.filter(u=>u.side==='enemy'&&u.echelon==='company').forEach(u=>{u.order='HOLD';u.nav={waypoints:[],next:0,destination:null,remaining:0,blocked:false};u.nextAiDecision=0;});
  }
  function initialize(s,fromSave=false){if(!fromSave||!s.opponent)reset(s);s.opponent.log||=[];s.opponent.unitGoals||={};}
  function decide(s){
    if(!s.opponent)return;
    const o=s.opponent,enemies=s.units.filter(u=>u.side==='enemy'&&u.echelon==='company');
    if(!enemies.length)return;
    const avgSupply=enemies.reduce((a,u)=>a+(u.supply||0),0)/enemies.length;
    const avgFatigue=enemies.reduce((a,u)=>a+(u.fatigue||0),0)/enemies.length;
    const avgReady=enemies.reduce((a,u)=>a+(u.readiness||0),0)/enemies.length;
    let goal=o.goal;
    // deliberate periodic assessment based on resources and fatigue rather than random roaming
    if(avgReady<52||avgSupply<34||avgFatigue>63)goal='regroup';
    else if(avgReady>71&&avgSupply>58&&avgFatigue<36)goal=s.scenarioId==='ardennes1944'?'preserve':'reposition';
    else if(avgSupply<48||avgFatigue>46)goal='preserve';
    else if(o.decisionCount%3===0)goal='observe';
    o.goal=goal;o.lastReview=s.absMinutes;o.decisionCount++;o.nextReview=s.absMinutes+40+(o.decisionCount%3)*16;
    const assigned=enemies.filter(u=>u.order!=='MOVE' || !(u.nav?.waypoints?.length));
    const unit=assigned[o.decisionCount%Math.max(1,assigned.length)];
    if(unit){
      const anchors={
        preserve:[[800,430],[840,385],[780,455],[860,420],[720,450]],
        observe:[[775,370],[712,398],[850,360],[645,390],[750,450]],
        reposition:[[700,392],[770,385],[825,407],[675,427],[790,444]],
        regroup:[[875,460],[900,426],[860,491],[820,460],[905,382]]
      };
      const seq=anchors[goal],idx=(enemies.indexOf(unit)+o.decisionCount)%seq.length;const target=seq[idx];
      if(goal==='regroup' && unit.fatigue>64){unit.order='REST';unit.statusCause='AI จัดการพักกำลัง';}
      else {World.issueMove(unit,target[0],target[1]); if(!unit.nav?.blocked)unit.order='MOVE';}
      o.unitGoals[unit.id]=goal;
    }
    const event={time:Math.round(s.absMinutes),goal,readiness:Math.round(avgReady),supply:Math.round(avgSupply),fatigue:Math.round(avgFatigue)};
    o.log.unshift(event);if(o.log.length>45)o.log.length=45;
  }
  function update(s){if(!s.opponent)initialize(s);if(s.absMinutes>=s.opponent.nextReview)decide(s);}
  function stats(s){const o=s.opponent||{};return {decisionCount:o.decisionCount||0,lastReview:o.lastReview||0,goal:goals[o.goal]||goals.observe,history:(o.log||[]).slice(0,8)};}
  return {initialize,reset,update,stats,goals};
})();
