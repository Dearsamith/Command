/* Historical context presets only; force composition, grid and numbers are fictional.
   No live troop positions or current tactical intelligence. */
const Scenarios = (()=>{
  const presets=[
    {id:'sandbox',era:'sandbox',tag:'SANDBOX',name:'ชายแดนเหนือ — โลกสมมติ',date:'ไม่ระบุ',theater:'NORTH BORDER',season:'temperate',
     source:'',sourceLabel:'',intro:'สถานการณ์สร้างขึ้นเองสำหรับทดสอบระบบ ไม่มีเหตุการณ์ประวัติศาสตร์จริง',
     side:'กองทัพสมมติ',opposition:'กองทัพคู่ขัดแย้ง',goal:'บริหารเสบียง หน่วยและผู้บัญชาการโดยไม่สูญเสียความพร้อม',weather:'ท้องฟ้าโปร่ง',hour:6,mod:1,seed:68371,
     tasks:[]},
    {id:'normandy1944',era:'ww2',tag:'WWII · 1944',name:'Normandy — D-Day',date:'6 มิถุนายน 1944',theater:'NORMANDY 1944',season:'coast',
     source:'https://www.nationalww2museum.org/war/topics/d-day-and-normandy-campaign',sourceLabel:'National WWII Museum',
     intro:'อ้างอิงการยกพลขึ้นบกของฝ่ายสัมพันธมิตรเมื่อ 6 มิถุนายน 1944 โดยย่อพื้นที่ สภาพหน่วย และภูมิประเทศเป็นแผนที่สมมติสำหรับเล่น',
     side:'ฝ่ายสัมพันธมิตร (จำลอง)',opposition:'เยอรมัน (จำลอง)',goal:'รักษาความพร้อม การจัดกำลังสนับสนุน และการส่งรายงานระหว่างการตั้งหลัก',weather:'มีเมฆบาง',hour:6,mod:0.82,seed:19440606,
     tasks:[{title:'ประเมินเสบียงและจัดพื้นที่ตั้งหลัก',unit:'div1',type:'support',x:280,y:170},{title:'บริหารการสื่อสารพื้นที่ส่วนกลาง',unit:'div2',type:'security',x:520,y:280}]},
    {id:'ardennes1944',era:'ww2',tag:'WWII · 1944',name:'Ardennes — Battle of the Bulge',date:'16 ธันวาคม 1944',theater:'ARDENNES 1944',season:'forest',
     source:'https://www.nationalww2museum.org/war/topics/battle-bulge',sourceLabel:'National WWII Museum',
     intro:'อ้างอิงการเริ่มต้นยุทธการ Ardennes ในฤดูหนาว ค.ศ. 1944 โดยใช้แผนที่และหน่วยสมมติที่เน้นภาระการขนส่งและการดูแลกำลังพล',
     side:'ฝ่ายสัมพันธมิตร (จำลอง)',opposition:'เยอรมัน (จำลอง)',goal:'รักษาระบบขนส่งและความพร้อมของหน่วยในสภาพอากาศหนาวเย็น',weather:'หนาวจัด',hour:8,mod:0.55,seed:19441216,
     tasks:[{title:'จัดเสบียงฤดูหนาว',unit:'div1',type:'support',x:340,y:210},{title:'ประสานข้อมูลหน่วยรอง',unit:'div3',type:'security',x:720,y:160}]},
    {id:'kyiv2022',era:'modern',tag:'MODERN · 2022',name:'Kyiv — การป้องกันเมืองช่วงต้นปี 2022',date:'24 กุมภาพันธ์ 2022',theater:'KYIV 2022',season:'city',
     source:'https://www.cfr.org/global-conflict-tracker/conflict/conflict-ukraine',sourceLabel:'CFR Global Conflict Tracker',
     intro:'อ้างอิงช่วงเริ่มการรุกรานยูเครนเต็มรูปแบบในปี 2022 และการป้องกัน Kyiv: เกมเน้นการบริหารกำลังและการสนับสนุน โดยไม่ใช้พิกัดหรือตำแหน่งหน่วยจริง',
     side:'ฝ่ายป้องกัน (จำลอง)',opposition:'ฝ่ายรุก (จำลอง)',goal:'ดูแลกำลังพล โรงพยาบาล และเส้นทางจัดส่งสิ่งของในเมืองสมมติ',weather:'มีเมฆบาง',hour:7,mod:0.80,seed:20220224,
     tasks:[{title:'บริหารเวชภัณฑ์และความพร้อม',unit:'div1',type:'support',x:330,y:190},{title:'ประสานศูนย์ขนส่งพลเรือน',unit:'div2',type:'security',x:500,y:280}]},
    {id:'kharkiv2022',era:'modern',tag:'MODERN · 2022',name:'Kharkiv — กันยายน 2022',date:'กันยายน 2022',theater:'KHARKIV 2022',season:'plain',
     source:'https://www.cfr.org/global-conflict-tracker/conflict/conflict-ukraine',sourceLabel:'CFR Global Conflict Tracker',
     intro:'อ้างอิงสถานการณ์เปลี่ยนแปลงอย่างรวดเร็วในภูมิภาค Kharkiv ช่วงกันยายน 2022 ด้วยภารกิจจำลองด้านการสื่อสาร การซ่อมบำรุง และเสบียง',
     side:'ฝ่ายยูเครน (จำลอง)',opposition:'ฝ่ายรัสเซีย (จำลอง)',goal:'จัดระบบเสบียงและข้อมูลที่มีความล่าช้าให้ยังรองรับหน่วยเคลื่อนย้ายได้',weather:'ท้องฟ้าโปร่ง',hour:9,mod:1.06,seed:20220910,
     tasks:[{title:'บริหารการซ่อมอุปกรณ์เคลื่อนที่',unit:'div2',type:'support',x:540,y:245},{title:'ตรวจความพร้อมและรายงาน',unit:'div3',type:'relief',x:725,y:165}]}
  ];
  const byId=id=>presets.find(x=>x.id===id)||presets[0];
  function apply(s,id){
    const p=byId(id);Theaters.activate(p.id);s.scenarioId=p.id;
    s.scenario={id:p.id,era:p.era,title:p.name,date:p.date,theater:p.theater,side:p.side,opposition:p.opposition,goal:p.goal,source:p.source,sourceLabel:p.sourceLabel,intro:p.intro,season:p.season};
    s.rngSeed=p.seed;s.timeMinutes=p.hour*60;s.day=1;s.weather=p.weather;
    if(p.era!=='sandbox'){
      s.economy.budget=Math.round(820*p.mod);
      s.staff.logistics=Math.max(38,Math.round(s.staff.logistics*p.mod));
      s.staff.medical=Math.max(40,Math.round(s.staff.medical*(p.era==='modern'?1.10:0.76)));
      s.depots.forEach(d=>{
        d.stock=Math.round(d.stock*p.mod);
        Object.keys(d.resources||{}).forEach(k=>{d.resources[k]=Math.round(d.resources[k]*p.mod*(k==='medical' && p.era==='modern'?1.12:1));});
      });
      const friendly=s.units.filter(u=>u.side==='ally'&&u.echelon==='company');
      friendly.forEach((u,i)=>{
        if(!u.sustain)return;
        u.unitRole = p.era==='ww2' ? (i%4===0?'WWII Motor Transport':'WWII Infantry') : (i%4===0?'Modern Support':'Modern Motorized');
        const v=u.establishment?.vehicles;
        if(v){v.authorized=p.era==='ww2'?5:9;v.operational=Math.min(v.authorized-1, Math.max(2,Math.round((v.operational||4)*(p.era==='ww2'?.72:1.07))));v.underRepair=Math.min(v.authorized-v.operational, v.underRepair||1);}
        u.sustain.stocks.fuel=Math.round(u.sustain.stocks.fuel*(p.era==='ww2'?.90:1.15));
        const sf=(.74+(i%5)*.065)*p.mod;
        Object.keys(u.sustain.stocks).forEach(k=>u.sustain.stocks[k]=Math.max(0,Math.round(u.sustain.stocks[k]*sf)));
        u.fatigue=Math.min(100,u.fatigue + (p.season==='forest'?12:3));
        u.morale=Math.max(40,u.morale - (p.season==='forest'?7:3));
      });
      s.units.filter(u=>u.side==='enemy').forEach((u,i)=>{
        u.name=`${p.opposition} ${i+1}`;
      });
      s.missions=[];
      if(typeof createMission==='function') p.tasks.forEach(x=>createMission({title:x.title,unitId:x.unit,type:x.type,priority:'กลาง',objective:p.goal,x:x.x,y:x.y},true));
      s.intelContacts={};
    }
    if(typeof Era!=='undefined')Era.apply(s,false);
    if(typeof Opponent!=='undefined')Opponent.reset(s);
    if(typeof logEvent==='function') logEvent('SCENARIO',`${p.name} — เริ่มเล่นด้วยข้อมูลจำลองที่อิงบริบทประวัติศาสตร์`);
  }
  return {presets,byId,apply};
})();
