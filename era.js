/* Era-specific equipment is a simplified game taxonomy, NOT a catalogue of exact historical force holdings. */
const Era = (() => {
  const profiles={
    sandbox:{id:'sandbox',label:'Sandbox · อุปกรณ์สมมติ',description:'ใช้ชุดอุปกรณ์สมมติมาตรฐานเพื่อทดสอบกลไก',radio:'Field Network',support:'Mixed Motor Pool',transport:'Utility Transport',repair:'General Workshop',weapon:'Fictional Small Arms',supportWeapon:'Generic Support Group',vehicleFactor:1,commsFactor:1,fuelFactor:1,wearFactor:1,icon:'◎'},
    ww2:{id:'ww2',label:'World War II · 1939–1945',description:'ใช้แนวคิดการสื่อสารผ่านวิทยุภาคสนาม รถบรรทุกและโรงซ่อมยุคสงครามโลกครั้งที่ 2',radio:'Field Radio / Dispatch',support:'Supply Lorries',transport:'Period Motor Transport',repair:'Field Maintenance',weapon:'WWII-era Infantry Arms',supportWeapon:'WWII Field Support',vehicleFactor:.84,commsFactor:.86,fuelFactor:.88,wearFactor:1.20,icon:'✠'},
    modern:{id:'modern',label:'Modern Warfare · 2022',description:'ชุดจำลองรถยนต์อเนกประสงค์ ระบบสื่อสารยุคใหม่ และการส่งกำลังเชื่อมโยงหลายฝ่าย (ไม่ใช้สเปกอาวุธจริง)',radio:'Digital Tactical Link',support:'Utility & Armored Support',transport:'Motorized Logistics',repair:'Mobile Workshop',weapon:'Modern Infantry Arms',supportWeapon:'Modern Support Elements',vehicleFactor:1.07,commsFactor:1.08,fuelFactor:1.12,wearFactor:.92,icon:'◇'}
  };
  const roleNames={ww2:['WWII Infantry','WWII Motor Transport','WWII Field Support'],modern:['Modern Motorized','Modern Support','Modern Field Service'],sandbox:['Fictional Infantry','Fictional Transport','Fictional Support']};
  function of(s){return profiles[s.scenario?.era]||profiles.sandbox;}
  function apply(s,fromSave=false){
    const p=of(s);
    s.eraModel ||= {};
    s.eraModel.id=p.id;s.eraModel.initialized=true;
    if(!fromSave){
      s.eraModel.totalServiceActions=0;
      // Use a simplified era-specific starting communication condition (not exact real-world performance).
      s.staff.communications=Math.min(96,Math.max(32,Math.round(s.staff.communications*p.commsFactor)));
    }
    s.units.filter(u=>u.echelon==='company').forEach((u,i)=>{
      const role=roleNames[p.id][i%roleNames[p.id].length];
      if(!fromSave || u.eraKit?.era!==p.id){
        u.unitRole=role;
        u.eraKit={era:p.id,role,radio:p.radio,transport:p.transport,support:p.support,repair:p.repair,weapon:p.weapon,supportWeapon:p.supportWeapon,
          communications:Math.max(35,Math.min(96,Math.round(56+(i%5)*6)*p.commsFactor)),
          durability:Math.max(35,Math.min(96,Math.round(80-(i%4)*6)/p.wearFactor)),
          maintenanceDemand:p.wearFactor,vehicleFactor:p.vehicleFactor,fuelFactor:p.fuelFactor};
        const veh=u.establishment?.vehicles;
        if(veh){veh.authorized=p.id==='ww2'?6:p.id==='modern'?9:8;veh.operational=Math.min(veh.authorized, Math.max(2,Math.round(veh.operational*p.vehicleFactor)));veh.underRepair=Math.min(Math.max(0,veh.authorized-veh.operational),veh.underRepair);}
      }
    });
  }
  function factorFor(u){return profiles[u?.eraKit?.era]||profiles.sandbox;}
  return {profiles,of,apply,factorFor};
})();
