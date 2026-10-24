/* Fictional macro-economic model. No real-world national data or operational intelligence. */
const Nations = (() => {
  const templates = [
    {id:'alden',name:'สาธารณรัฐอัลเดน',short:'ALDEN',tone:'#b5ce87',population:12.4,industry:67,agriculture:74,energy:61,treasury:920,debt:110,stability:74,prices:100,stocks:{food:650,fuel:460,materials:500,medicine:310}},
    {id:'nord',name:'สหพันธรัฐนอร์ด',short:'NORD',tone:'#c99b72',population:16.8,industry:77,agriculture:53,energy:80,treasury:1040,debt:260,stability:63,prices:109,stocks:{food:520,fuel:740,materials:760,medicine:260}},
    {id:'meris',name:'สหภาพเมริส',short:'MERIS',tone:'#84b8cc',population:8.6,industry:56,agriculture:84,energy:49,treasury:740,debt:90,stability:82,prices:92,stocks:{food:900,fuel:280,materials:420,medicine:350}},
    {id:'highlands',name:'ราชรัฐไฮแลนด์',short:'HIGHLANDS',tone:'#c5b682',population:5.9,industry:48,agriculture:62,energy:73,treasury:610,debt:70,stability:77,prices:97,stocks:{food:490,fuel:570,materials:330,medicine:180}}
  ];
  const policies={
    industry:{label:'ลงทุนอุตสาหกรรม',cost:72,description:'ใช้เงินลงทุน เพิ่มผลิตภาพในระยะยาว'},
    welfare:{label:'สนับสนุนประชาชน',cost:48,description:'ใช้เงินและอาหารเพื่อเพิ่มเสถียรภาพ'},
    energy:{label:'ลงทุนพลังงาน',cost:58,description:'ปรับปรุงการผลิตเชื้อเพลิง'},
    trade:{label:'เปิดข้อตกลงการค้า',cost:18,description:'ค้าสิ่งของกับประเทศพันธมิตรโดยไม่ใช้กำลัง'},
    medical:{label:'พัฒนาระบบแพทย์',cost:46,description:'เพิ่มคลังเวชภัณฑ์ของประเทศ'},
    conservation:{label:'มาตรการประหยัดทรัพยากร',cost:5,description:'ลดการบริโภคแต่กระทบความนิยม'}
  };
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const round=n=>Math.round(n*10)/10;
  function initialize(s,fromSave=false){
    if(!fromSave||!Array.isArray(s.nations)||!s.nations.length){
      s.nations=JSON.parse(JSON.stringify(templates));
      const names=s.scenarioId==='normandy1944'||s.scenarioId==='ardennes1944'
        ? [['สหรัฐอเมริกา (จำลอง)','USA'],['เยอรมนี (จำลอง)','GERMANY'],['สหราชอาณาจักร (จำลอง)','UK'],['ฝรั่งเศส (จำลอง)','FRANCE']]
        : s.scenarioId==='kyiv2022'||s.scenarioId==='kharkiv2022'
        ? [['ยูเครน (จำลอง)','UKRAINE'],['รัสเซีย (จำลอง)','RUSSIA'],['โปแลนด์ (จำลอง)','POLAND'],['สหราชอาณาจักร (จำลอง)','UK']]
        : null;
      if(names) s.nations.forEach((n,i)=>{n.name=names[i][0];n.short=names[i][1];});
      s.diplomacy=[
        {a:'alden',b:'meris',relation:72,trade:true},
        {a:'alden',b:'nord',relation:31,trade:false},
        {a:'alden',b:'highlands',relation:56,trade:true},
        {a:'nord',b:'meris',relation:44,trade:false},
        {a:'nord',b:'highlands',relation:37,trade:false},
        {a:'meris',b:'highlands',relation:64,trade:true}
      ];
      s.market={food:100,fuel:100,materials:100,medicine:100,cycles:0,lastCycle:0};
      s.nationEvents=[];
      s.nationActions=[];
    }else{
      s.diplomacy ||= [];
      s.market ||= {food:100,fuel:100,materials:100,medicine:100,cycles:0,lastCycle:Math.floor(s.absMinutes/60)*60};
      s.nationEvents ||= [];
      s.nationActions ||= [];
    }
  }
  function record(s,text){
    const e={minute:Math.round(s.absMinutes),day:s.day,text};
    s.nationEvents.unshift(e); if(s.nationEvents.length>250)s.nationEvents.length=250;
    s.events?.unshift({id:`e${s.eventSerial++}`,stamp:`D${String(s.day).padStart(2,'0')} ${String(Math.floor(s.timeMinutes/60)).padStart(2,'0')}:${String(Math.floor(s.timeMinutes%60)).padStart(2,'0')}`,source:'ECON',message:text});
    if(s.events?.length>180)s.events.length=180;
  }
  function cycle(s,rng){
    const worldPrices={food:0,fuel:0,materials:0,medicine:0};let pop=0;
    for(const n of s.nations){
      const economy=Math.max(.2,n.stability/100),marketDemand=(n.population*2.1)*(n.prices/100);
      const yields={
        food:n.agriculture*.8*economy,
        fuel:n.energy*.57*economy,
        materials:n.industry*.62*economy,
        medicine:n.industry*.23*economy
      };
      const use={food:n.population*4.2,fuel:n.population*2.3,materials:n.population*2.1,medicine:n.population*.83};
      for(const k of Object.keys(n.stocks))n.stocks[k]=round(clamp(n.stocks[k]+yields[k]-use[k],0,6000));
      const exported=Object.values(s.diplomacy||[]).filter(r=>r.trade && (r.a===n.id||r.b===n.id));
      for(const deal of exported){
        const other=s.nations.find(m=>m.id===(deal.a===n.id?deal.b:deal.a));
        if(!other||other.id<n.id)continue; // settle each agreement once
        for(const k of ['food','fuel','materials','medicine']){
          const spread=n.stocks[k]-other.stocks[k];
          if(Math.abs(spread)<90)continue;
          const transfer=round(Math.min(Math.abs(spread)*.045,15));
          if(spread>0){n.stocks[k]-=transfer;other.stocks[k]+=transfer;}else{other.stocks[k]-=transfer;n.stocks[k]+=transfer;}
        }
      }
      n.treasury=round(clamp(n.treasury+(n.industry*.19+n.agriculture*.1)-(n.population*1.25)-(n.debt*.016),0,50000));
      n.debt=round(clamp(n.debt+(n.treasury<120?6:0),0,90000));
      n.stability=round(clamp(n.stability+(.08-(n.stocks.food<90?.65:0)-(n.treasury<90?.42:0))+(rng()-.5)*.35,5,100));
      const shortage=Object.entries(n.stocks).filter(([k,v])=>v < ({food:130,fuel:100,materials:90,medicine:40}[k]||80)).length;
      n.prices=round(clamp(n.prices+(shortage*.75)-.15+(rng()-.5)*.9,40,250));
      n.production=Object.fromEntries(Object.entries(yields).map(([k,v])=>[k,round(v)]));
      n.consumption=Object.fromEntries(Object.entries(use).map(([k,v])=>[k,round(v)]));
      pop+=n.population;
      for(const k of Object.keys(worldPrices))worldPrices[k]+=n.stocks[k];
      if(shortage>=2 && s.market.cycles%4===0)record(s,`${n.name}: ตลาดขาดแคลนทรัพยากร ${shortage} หมวด ราคาเพิ่มขึ้น`);
    }
    for(const k of Object.keys(worldPrices)) s.market[k]=round(clamp(150- worldPrices[k]/38,45,190));
    s.market.cycles++;
    // The player nation feeds the old logistics system; not a direct injection into field units.
    const home=s.nations[0];
    s.economy.industry=round(clamp((s.economy.industry*.85+home.industry*.15),0,100));
    s.economy.publicSupport=round(clamp((s.economy.publicSupport*.85+home.stability*.15),0,100));
    if(s.market.cycles%3===0){
      const depot=s.depots?.[0];
      if(depot?.resources){
        const transfer={food:4,water:6,fuel:3,parts:2,medical:1};
        for(const [kind,amount] of Object.entries(transfer)){
          const stockType=kind==='parts'?'materials':kind==='water'?'food':kind;
          const taken=Math.min(amount,Math.floor((home.stocks[stockType]||0)/10));
          if(taken>0){home.stocks[stockType]-=taken;depot.resources[kind]=(depot.resources[kind]||0)+taken;}
        }
      }
    }
    if(s.market.cycles%6===0){
      const r=s.diplomacy[s.market.cycles/6%s.diplomacy.length|0];
      if(r){r.relation=round(clamp(r.relation+(rng()-.5)*4,0,100));}
      record(s,'รายงานเศรษฐกิจรอบ 6 ชั่วโมงเกม: ปรับการผลิต การบริโภคและตลาดการค้า');
    }
  }
  function update(s,dt,rng){
    if(!s.market||!s.nations)initialize(s,true);
    const interval=60;
    let n=0;
    while(s.absMinutes-s.market.lastCycle>=interval && n<200){s.market.lastCycle+=interval;cycle(s,rng);n++;}
  }
  function action(s,policy,targetId='alden'){
    const p=policies[policy],n=s.nations?.find(x=>x.id===targetId);
    if(!p||!n)return {ok:false,error:'ไม่พบนโยบายหรือประเทศ'};
    if(n.id!=='alden')return {ok:false,error:'ผู้เล่นกำหนดนโยบายได้เฉพาะประเทศหลัก'};
    if(n.treasury<p.cost)return {ok:false,error:'เงินคลังไม่เพียงพอ'};
    n.treasury-=p.cost;
    if(policy==='industry')n.industry=clamp(n.industry+5,0,100);
    if(policy==='energy')n.energy=clamp(n.energy+7,0,100);
    if(policy==='welfare'){n.stability=clamp(n.stability+5,0,100);n.stocks.food=Math.max(0,n.stocks.food-35);}
    if(policy==='medical')n.stocks.medicine+=85;
    if(policy==='conservation'){n.stocks.food+=20;n.stocks.fuel+=12;n.stability=clamp(n.stability-2,0,100);}
    if(policy==='trade'){
      const link=s.diplomacy.find(d=>(d.a==='alden'&&d.b==='nord')||(d.b==='alden'&&d.a==='nord'));
      if(link){link.trade=true;link.relation=clamp(link.relation+7,0,100);}
    }
    const text=`${n.name}: ${p.label} (งบ ${p.cost})`;
    s.nationActions.unshift({at:Math.round(s.absMinutes),nation:n.id,policy,label:p.label,cost:p.cost});
    if(s.nationActions.length>150)s.nationActions.length=150;
    record(s,text);
    return {ok:true,text};
  }
  function summary(s){return (s.nations||[]).map(n=>({id:n.id,name:n.name,population:n.population,treasury:n.treasury,industry:n.industry,agriculture:n.agriculture,energy:n.energy,stability:n.stability,debt:n.debt,prices:n.prices,stocks:{...n.stocks}}));}
  return {initialize,update,action,summary,policies,templates};
})();
