/* THE ART OF COMMAND v0.9
   Theaters are deliberately schematic and NOT georeferenced historic/modern battle maps.
   No current military positions, routes or live operational data. */
const Theaters = (() => {
  const W=980,H=560;
  const defs = {
    sandbox:{name:'Northern Border',subtitle:'สมมติ • แนวแม่น้ำและทางผ่าน',color:'#263b2c',water:'#416f80',hill:[[170,140,100,83],[300,180,78,70],[765,112,99,70]],forest:[[128,250,86,65],[628,182,88,67],[832,220,82,71]],urban:[[480,270,48,38]],
      roads:[[[70,198],[275,210],[490,282],[868,250]],[[515,281],[735,125]],[[275,210],[278,338]]],bridges:[[275,300],[555,307]],landmarks:[[487,263,'เมืองหน้า'],[555,308,'สะพาน'],[276,166,'แนวเนิน']],waterType:'horizontal',river:(x)=>306-19*Math.sin(x/980*6.4)+14*Math.sin(x/980*13.5+.5)},
    normandy1944:{name:'Normandy Coast',subtitle:'6 JUN 1944 • แนวชายฝั่งและพุ่มไม้ Bocage',color:'#405743',water:'#335f79',hill:[[320,284,90,60],[720,302,75,65]],forest:[[130,300,77,62],[500,398,88,70],[785,436,100,60]],urban:[[285,225,44,30],[590,350,55,35],[815,260,34,28]],
      roads:[[[110,180],[285,224],[575,350],[865,415]],[[290,225],[435,400],[680,480]],[[560,180],[590,350],[785,260]]],bridges:[],landmarks:[[205,148,'ชายฝั่งตะวันตก'],[545,148,'ชายฝั่งกลาง'],[805,148,'ชายฝั่งตะวันออก'],[578,353,'ชุมชน']],waterType:'coast',coast:(x)=>104+10*Math.sin(x/88)+8*Math.sin(x/41)},
    ardennes1944:{name:'Ardennes Forest',subtitle:'16 DEC 1944 • พื้นที่ป่าและสภาพอากาศหนาว',color:'#354837',water:'#416e76',hill:[[185,155,135,93],[475,170,108,89],[789,145,115,98],[306,418,108,70]],forest:[[180,320,128,110],[415,375,120,95],[710,330,129,111],[830,450,100,88]],urban:[[275,190,35,23],[675,248,39,30]],
      roads:[[[82,130],[273,193],[480,244],[700,248],[914,370]],[[185,450],[400,341],[480,244],[620,145]],[[700,248],[675,410]]],bridges:[[478,244],[475,445]],landmarks:[[275,190,'หมู่บ้าน'],[698,248,'ชุมทาง'],[480,243,'ทางผ่าน']],waterType:'vertical',river:(y)=>472+17*Math.sin(y/93)},
    kyiv2022:{name:'Kyiv Periphery',subtitle:'24 FEB 2022 • เมือง ทางด่วน และแม่น้ำจำลอง',color:'#384644',water:'#477a86',hill:[[160,115,105,77],[835,450,89,63]],forest:[[159,290,82,94],[760,161,100,95]],urban:[[288,245,120,88],[700,285,134,104],[466,460,79,59]],
      roads:[[[70,145],[287,245],[480,285],[702,288],[920,345]],[[290,480],[289,245],[317,90]],[[700,70],[701,288],[700,512]],[[133,426],[480,415],[832,433]]],bridges:[[488,280],[483,413]],landmarks:[[296,242,'เขตเมืองฝั่งตะวันตก'],[699,286,'เขตเมืองฝั่งตะวันออก'],[485,280,'สะพานกลาง']],waterType:'vertical',river:(y)=>483+16*Math.sin(y/91+.4)},
    kharkiv2022:{name:'Kharkiv Region',subtitle:'SEP 2022 • ที่ราบ ชุมทางและลำน้ำจำลอง',color:'#4b523e',water:'#4c7981',hill:[[195,155,91,56],[806,133,103,60]],forest:[[145,330,77,67],[552,197,91,72],[890,412,61,60]],urban:[[290,230,47,37],[540,303,48,41],[765,226,60,42]],
      roads:[[[73,110],[290,230],[540,303],[814,223],[928,252]],[[220,475],[292,235],[342,80]],[[542,300],[678,398],[870,472]]],bridges:[[255,338],[680,350]],landmarks:[[291,230,'ชุมทางตะวันตก'],[539,304,'ศูนย์ขนส่ง'],[770,229,'เมืองจำลอง']],waterType:'horizontal',river:(x)=>339+22*Math.sin(x/119+.1)}
  };
  let active='sandbox';
  const dist=(x,y,a,b)=>Math.hypot(x-a,y-b);
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const segDist=(x,y,a,b,c,d)=>{const dx=c-a,dy=d-b;const p=clamp(((x-a)*dx+(y-b)*dy)/(dx*dx+dy*dy||1),0,1);return dist(x,y,a+dx*p,b+dy*p);};
  function def(){return defs[active]||defs.sandbox;}
  function activate(id){active=Object.hasOwn(defs,id)?id:'sandbox';}
  function id(){return active;}
  function onRoad(x,y){return def().roads.some(line=>line.some((pt,i)=>i>0 && segDist(x,y,line[i-1][0],line[i-1][1],pt[0],pt[1])<12));}
  function inEllipse(x,y,ellipse){const [cx,cy,rx,ry]=ellipse;return (((x-cx)/rx)**2+((y-cy)/ry)**2)<1;}
  function riverAt(x,y){const d=def();if(d.waterType==='coast')return y<d.coast(x);
    if(d.waterType==='horizontal') return Math.abs(y-d.river(x))<16 && !d.bridges.some(([bx,by])=>dist(x,y,bx,by)<27);
    return Math.abs(x-d.river(y))<16 && !d.bridges.some(([bx,by])=>dist(x,y,bx,by)<27);
  }
  function terrainAt(x,y){
    if(x<0||x>=W||y<0||y>=H)return 'outside';
    if(riverAt(x,y))return def().waterType==='coast'?'water':'river';
    if(onRoad(x,y))return 'road';
    if(def().urban.some(e=>inEllipse(x,y,e)))return 'urban';
    if(def().forest.some(e=>inEllipse(x,y,e)))return 'forest';
    if(def().hill.some(e=>inEllipse(x,y,e)))return 'hill';
    if(active==='normandy1944' && y<165)return 'beach';
    if(active==='kharkiv2022' && x>460 && (Math.sin(x*.044)*Math.cos(y*.032))>.57)return 'field';
    return 'plain';
  }
  function draw(ctx){
    const d=def();ctx.fillStyle=d.color;ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=20)for(let x=0;x<W;x+=20){
      const k=terrainAt(x+10,y+10);
      ctx.fillStyle={plain:'rgba(160,176,128,.07)',road:'#756b50',forest:'#21392d',hill:'#63705a',urban:'#56605c',beach:'#b3a47b',field:'#656b43',river:d.water,water:d.water}[k]||d.color;
      ctx.fillRect(x+.4,y+.4,19.4,19.4);
      if(k==='urban'){
        ctx.fillStyle='rgba(235,230,209,.11)';ctx.fillRect(x+3,y+3,6,6);ctx.fillRect(x+12,y+11,5,6);
      }
      if(k==='forest'){ctx.strokeStyle='rgba(156,188,131,.17)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+6,y+4);ctx.lineTo(x+11,y+13);ctx.stroke();}
      if(k==='hill'){ctx.strokeStyle='rgba(229,219,168,.18)';ctx.beginPath();ctx.arc(x+10,y+10,7,0,Math.PI);ctx.stroke();}
    }
    // Smooth stylized waterline independent of tile grid, retaining exact tile passability logic.
    ctx.lineCap='round';ctx.lineJoin='round';
    if(d.waterType==='coast'){
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);
      for(let x=W;x>=0;x-=5)ctx.lineTo(x,d.coast(x));ctx.closePath();ctx.fillStyle=d.water;ctx.fill();
      ctx.beginPath();for(let x=0;x<=W;x+=5)x===0?ctx.moveTo(x,d.coast(x)):ctx.lineTo(x,d.coast(x));ctx.strokeStyle='#c7bd8b';ctx.lineWidth=4;ctx.stroke();
    } else {
      ctx.beginPath();for(let i=0;i<= (d.waterType==='horizontal'?W:H);i+=6){const x=d.waterType==='horizontal'?i:d.river(i),y=d.waterType==='horizontal'?d.river(i):i;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
      ctx.strokeStyle=d.water;ctx.lineWidth=28;ctx.stroke();ctx.strokeStyle='rgba(174,210,209,.3)';ctx.lineWidth=2;ctx.stroke();
    }
    d.roads.forEach(line=>{
      ctx.beginPath();line.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.strokeStyle='#948a6c';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#4e493a';ctx.lineWidth=1;ctx.stroke();
    });
    if(d.waterType!=='coast')d.bridges.forEach(([x,y])=>{ctx.fillStyle='#c9b990';ctx.strokeStyle='#393e30';ctx.lineWidth=2;ctx.fillRect(x-17,y-9,34,18);ctx.strokeRect(x-17,y-9,34,18);});
    // Schematic planning grid, objective labels and compass.
    ctx.strokeStyle='rgba(220,226,206,.055)';ctx.lineWidth=.6;for(let x=0;x<W;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    d.landmarks.forEach(([x,y,label])=>{ctx.fillStyle='#d2c17e';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e6e7d5';ctx.font='11px sans-serif';ctx.fillText(label,x+9,y-8);});
    ctx.fillStyle='rgba(10,18,14,.76)';ctx.fillRect(10,506,306,42);ctx.fillStyle='#e2edcc';ctx.font='bold 13px sans-serif';ctx.fillText(d.name+' • FICTIONAL GRID',21,523);ctx.font='11px sans-serif';ctx.fillStyle='#a8bd9f';ctx.fillText(d.subtitle,21,539);
  }
  function config(){const d=def();return {id:active,name:d.name,subtitle:d.subtitle,landmarks:d.landmarks};}
  return {activate,id,def,draw,terrainAt,config,defs};
})();
