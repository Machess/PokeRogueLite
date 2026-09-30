/* Move-specific, bounded canvas effects. One animation loop; no downloaded assets. */
const AttackFX = {
  style(name,type) {
    const n=(name||'').toLowerCase().replace(/[-–]/g,' ');
    if(/twister|tornado|hurricane/.test(n))return 'twister';
    if(/gust|\bwind\b|whirlwind|air slash|air cutter|aeroblast/.test(n))return 'wind';
    if(/bubble/.test(n))return 'bubbles';
    if(/beam|ray|cannon|laser/.test(n))return 'beam';
    if(/flamethrower|fire blast|inferno/.test(n))return 'flame';
    if(/whip/.test(n))return 'whip';
    if(/scratch|slash|cut|fury swipes/.test(n))return 'claws';
    if(/kick/.test(n))return 'kick';
    if(/punch/.test(n)||type==='fighting')return 'punch';
    if(/tackle|slam|headbutt|take down|double edge/.test(n))return 'tackle';
    if(type==='electric')return 'lightning';
    if(type==='ghost')return 'ghost';
    if(type==='psychic'&&!/recover|barrier|rest|calm|amnesia|reflect|agility/.test(n))return 'psychic';
    return null;
  },
  play(atkId,defId,type,cost,name) {
    const kind=this.style(name,type),a=document.getElementById(atkId),b=document.getElementById(defId);
    if(!kind||!a||!b)return false;
    this.cancel();
    const screen=b.closest('.screen'),ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    const ax=ar.left+ar.width*.5,ay=ar.top+ar.height*.5,bx=br.left+br.width*.5,by=br.top+br.height*.5;
    const dx=bx-ax,dy=by-ay,dist=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),dir=dx>=0?1:-1;
    const energy=Math.max(1,Math.min(4,Number(cost)||1));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas=document.createElement('canvas');canvas.className='move-fx';canvas.dataset.effect=kind;canvas.dataset.energy=energy;canvas.setAttribute('aria-hidden','true');
    const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*ratio;canvas.height=innerHeight*ratio;
    canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';document.body.appendChild(canvas);
    const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);this.canvas=canvas;
    const colors={fire:['#ff762a','#ffce62'],water:['#279edc','#c0faff'],ice:['#74cde9','#f1ffff'],grass:['#369440','#c7ff7c'],ghost:['#341057','#9954cf'],psychic:['#ed459a','#ffd0eb'],electric:['#e9b529','#ffffba']};
    const [dark,light]=colors[type]||['#cc8947','#fff1b4'];
    const duration=reduced?240:850,start=performance.now();let hit=false;
    const circle=(x,y,r,color,stroke=false)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){ctx.strokeStyle=color;ctx.stroke();}else{ctx.fillStyle=color;ctx.fill();}};
    const line=(x,y,xx,yy,width,color)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();};
    const animate=(el,frames,options)=>{const animation=el.animate(frames,options);this.animations.push(animation);};
    this.animations=[];
    if(!reduced&&['tackle','punch','kick','claws'].includes(kind))animate(a,[{translate:'0 0'},{translate:`${dir*32}px -8px`,offset:.55},{translate:'0 0'}],{duration:300,easing:'ease-in-out'});
    const frame=now=>{
      const t=Math.min(1,(now-start)/duration);
      if(!canvas.isConnected||!b.isConnected||(screen&&!screen.classList.contains('active'))){this.cancel();return;}
      ctx.clearRect(0,0,innerWidth,innerHeight);ctx.globalAlpha=Math.min(1,(1-t)*5);ctx.lineCap='round';
      if(t>=.47&&!hit){hit=true;if(!reduced)animate(b,[{translate:'0 0',filter:'brightness(1)'},{translate:`${dir*18}px -6px`,filter:'brightness(1.8)'},{translate:`${-dir*9}px 3px`},{translate:`${dir*5}px 0`},{translate:'0 0',filter:'brightness(1)'}],{duration:310});}
      const travel=Math.min(1,t/.48),x=ax+dx*travel,y=ay+dy*travel;
      if(kind==='lightning'){
        this.lightning(ctx,{t,bx,by,energy,reduced});
      }else if(kind==='wind'||kind==='twister'){
        this.wind(ctx,{t,ax,ay,bx,by,angle,energy,reduced,twister:kind==='twister'});
      }else if(kind==='beam'){
        circle(ax,ay,10+Math.sin(t*14)*4,light);
        if(t>.16){const end=Math.min(1,(t-.16)/.30);line(ax,ay,ax+dx*end,ay+dy*end,20+Math.max(1,cost)*3,dark);line(ax,ay,ax+dx*end,ay+dy*end,10,light);line(ax,ay,ax+dx*end,ay+dy*end,3,'#fff9eb');}
      }else if(kind==='flame'){
        ctx.save();ctx.translate(ax,ay);ctx.rotate(angle);
        for(let i=0;i<24;i++){const u=((t*1.8+i/24)%1),reach=Math.min(1,t*2.6);if(u>reach)continue;const r=8+u*27,px=u*dist,py=Math.sin(i*2+t*22)*u*13;
          ctx.fillStyle=['#d93424','#f97923','#ffd064'][i%3];ctx.beginPath();ctx.moveTo(px-r,py);ctx.lineTo(px-r*.5,py-r*.7);ctx.lineTo(px+r*.3,py-r);ctx.lineTo(px+r*.1,py-r*.35);ctx.lineTo(px+r*1.7,py+Math.sin(t*28+i)*r*.4);ctx.lineTo(px+r*.2,py+r*.5);ctx.lineTo(px-r*.5,py+r*.8);ctx.closePath();ctx.fill();}
        ctx.restore();
      }else if(kind==='bubbles'){
        for(let i=0;i<11;i++){const u=Math.max(0,Math.min(1,(t-i*.026)/.48));if(t<i*.026)continue;const xx=ax+dx*u+Math.sin(i*4)*22,yy=ay+dy*u-Math.sin(u*Math.PI)*(25+i*3);ctx.lineWidth=3;circle(xx,yy,9+i%4*4,'#76e1fa',true);circle(xx-3,yy-4,3,'#eaffff');}
      }else if(kind==='whip'){
        const reach=Math.min(1,t*2.7);for(const [width,color] of [[10,'#234b2c'],[5,'#8acb49']]){ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(ax+dx*.35,ay-100*Math.sin(t*Math.PI),ax+dx*reach,ay+dy*reach);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
      }else if(kind==='ghost'){
        for(let i=5;i>=0;i--)circle(x-dir*i*7,y+Math.sin(t*14+i)*9,25-i*2,i%2?'#391356':'#652795');circle(x-6,y-4,3,'#d0a1ff');circle(x+7,y-4,3,'#d0a1ff');
        if(t>.4){ctx.lineWidth=8;circle(bx,by,30+(t-.4)*75,'#57227f',true);}
      }else if(kind==='psychic'){
        for(let i=0;i<4;i++){const u=Math.max(0,Math.min(1,(t-i*.06)/.45));ctx.save();ctx.translate(ax+dx*u,ay+dy*u);ctx.rotate(angle);ctx.scale(.42,1);ctx.lineWidth=5;circle(0,0,20+i*9,i%2?'#ffd0eb':'#ed459a',true);ctx.restore();}
        if(t>.45){ctx.lineWidth=4;circle(bx,by,35+(t-.45)*35,'#ff90c6',true);}
      }else if(kind==='claws'){
        if(t>.2)for(let i=0;i<3;i++){const u=Math.min(1,(t-.2-i*.04)*5);if(u<0)continue;const xx=bx-38+i*22;line(xx,by-48,xx+48*u,by-48+90*u,9,'#812c45');line(xx,by-48,xx+48*u,by-48+90*u,4,'#fff2d5');}
      }else if(kind==='punch'||kind==='kick'){
        if(t>.25){ctx.save();ctx.translate(bx,by);ctx.rotate(-dir*.35);const s=Math.min(1,(t-.25)*8)*(kind==='kick'?1.3:1.1);ctx.scale(dir*s,s);ctx.fillStyle='#ffd399';ctx.strokeStyle='#71352e';ctx.lineWidth=5;ctx.beginPath();
          const points=kind==='punch'?[[-30,20],[-35,-10],[-25,-28],[-14,-30],[-7,-35],[5,-30],[17,-29],[27,-18],[29,7],[15,25]]:[[-14,-40],[12,-40],[13,8],[39,18],[40,32],[-24,32],[-26,16]];
          points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.fill();ctx.stroke();if(kind==='punch')for(let i=0;i<3;i++)line(-21+i*14,-20,-18+i*14,-3,3,'#ac6043');ctx.restore();}
      }
      // Electric contact and beam moves retain their shape plus a strike.
      if(type==='electric'&&kind!=='lightning')this.lightning(ctx,{t,bx,by,energy,reduced});
      if(t>.45&&['tackle','punch','kick','claws','whip','beam'].includes(kind)){
        const p=(t-.45)/.55;ctx.globalAlpha=1-p;ctx.lineWidth=4;circle(bx,by,20+p*58,light,true);
        for(let i=0;i<8;i++){const r=i*Math.PI/4;line(bx+Math.cos(r)*(30+p*35),by+Math.sin(r)*(30+p*35),bx+Math.cos(r)*(45+p*65),by+Math.sin(r)*(45+p*65),5,light);}
        if(kind==='tackle'&&p<.5){ctx.save();ctx.translate(bx,by);ctx.beginPath();for(let i=0;i<16;i++){const r=i%2?20:52;const q=i*Math.PI/8;i?ctx.lineTo(Math.cos(q)*r,Math.sin(q)*r):ctx.moveTo(r,0);}ctx.closePath();ctx.fillStyle='#fff0ab';ctx.fill();ctx.restore();}
      }
      ctx.globalAlpha=1;if(t<1)this.raf=requestAnimationFrame(frame);else this.cancel();
    };this.raf=requestAnimationFrame(frame);return true;
  },
  // Stable zigzags reveal once, rather than random full-screen flashing.
  lightning(ctx,{t,bx,by,energy,reduced}) {
    if(t<.16&&!reduced)return;
    const p=reduced?.64:t,reach=reduced?1:Math.min(1,(p-.16)/.31);
    const height=90+energy*48,top=Math.max(48,by-height),width=4+energy*3;
    const zigzag=(x0,y0,x1,y1,spread,seed)=>{
      const points=[[x0,y0]];
      for(let i=1;i<8;i++){const u=i/8;points.push([x0+(x1-x0)*u+(i%2?1:-1)*spread*(.5+.5*Math.sin(i*2+seed)**2),y0+(y1-y0)*u]);}
      points.push([x1,y1]);return points;
    };
    const stroke=(points,w,alpha=1)=>{
      ctx.save();ctx.globalAlpha*=alpha;ctx.lineJoin='miter';ctx.lineCap='square';
      for(const [thick,color] of [[w*2.1,'#b7762090'],[w,'#ffcf39'],[Math.max(2,w*.35),'#fffde3']]){
        ctx.beginPath();ctx.moveTo(...points[0]);const end=reach*(points.length-1);
        for(let i=1;i<=Math.floor(end);i++)ctx.lineTo(...points[i]);
        if(end%1){const i=Math.floor(end),a=points[i],b=points[i+1],f=end-i;ctx.lineTo(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f);}
        ctx.lineWidth=thick;ctx.strokeStyle=color;ctx.stroke();
      }ctx.restore();
    };
    stroke(zigzag(bx-10,top,bx,by,10+energy*5,1),width);
    for(let i=0;i<energy-1;i++){
      const side=i%2?1:-1,startY=top+(by-top)*(.24+i*.15);
      stroke(zigzag(bx+side*(25+energy*13),startY,bx+side*5,by-8,6+energy*2,i+3),width*.52,.8);
    }
    if(p>.47){
      const burst=reduced?.35:Math.min(1,(p-.47)/.4),radius=(18+energy*13)*(1+burst*.65);
      ctx.save();ctx.globalAlpha*=1-burst*.65;ctx.strokeStyle='#ffeb83';ctx.lineWidth=2+energy;
      ctx.beginPath();ctx.ellipse(bx,by+12,radius,radius*.35,0,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<6+energy*2;i++){const q=i*Math.PI*2/(6+energy*2),r=radius*.65;
        const x=bx+Math.cos(q)*r,y=by+Math.sin(q)*r;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(q+.3)*12,y+Math.sin(q+.3)*12);ctx.lineTo(x+Math.cos(q)*(16+energy*4),y+Math.sin(q)*(16+energy*4));ctx.stroke();}
      ctx.restore();
    }
  },
  wind(ctx,{t,ax,ay,bx,by,angle,energy,reduced,twister}) {
    const travel=reduced?1:Math.min(1,t/.48),x=ax+(bx-ax)*travel,y=ay+(by-ay)*travel;
    const spin=reduced?1.3:t*13,scale=.75+energy*.27;
    ctx.save();ctx.translate(x,y);ctx.lineCap='round';
    if(twister){
      // Broad top, narrow base and orbiting particles make a readable funnel.
      const h=100*scale,base=h*.3;
      for(let i=0;i<7;i++){
        const u=i/6,rx=(13+u*43)*scale,yy=base-u*h,q=spin+i*.7;
        ctx.beginPath();ctx.ellipse(Math.sin(q)*5,yy,rx,rx*.25,0,q,q+Math.PI*1.65);
        ctx.strokeStyle=i%2?'#edfff1':'#7ad8cf';ctx.lineWidth=(3+energy*.8)*(1-u*.3);ctx.stroke();
      }
      // A continuous winding strand joins the rings into a rotating column.
      ctx.beginPath();
      for(let i=0;i<=80;i++){const u=i/80,q=spin+u*Math.PI*7,r=(13+u*43)*scale;
        const xx=Math.cos(q)*r,yy=base-u*h+Math.sin(q)*r*.2;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}
      ctx.strokeStyle='#baf5e4';ctx.lineWidth=2+energy*.5;ctx.stroke();
      for(let i=0;i<5+energy;i++){const u=(i/(5+energy)+(reduced?0:t*.6))%1,q=spin+i*2.4,r=(20+u*40)*scale;
        ctx.save();ctx.translate(Math.cos(q)*r,base-u*h+Math.sin(q)*r*.22);ctx.rotate(q);ctx.fillStyle=i%2?'#a1c9a4':'#e4f8d8';ctx.fillRect(-3,-2,7,3);ctx.restore();}
    }else{
      // Horizontal corkscrews travel along the line between the two Pokémon.
      ctx.rotate(angle);const length=105*scale,radius=27*scale;
      for(let band=0;band<3;band++){
        ctx.beginPath();
        for(let i=0;i<=64;i++){const u=i/64,q=u*Math.PI*4-spin+band*Math.PI*2/3;
          const xx=(u-.5)*length,yy=Math.sin(q)*radius*(.6+u*.4);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}
        ctx.strokeStyle=['#edfff8','#78cfcf','#c7f7e9'][band];ctx.lineWidth=3+energy;ctx.stroke();
      }
      for(let i=0;i<3+energy;i++){const yy=(i-(2+energy)/2)*14,q=spin+i;ctx.beginPath();ctx.moveTo(-length*.9,yy);ctx.quadraticCurveTo(-length*.6,yy-8*Math.sin(q),-length*.35,yy);ctx.strokeStyle='#a6e2dc';ctx.lineWidth=2;ctx.stroke();}
    }
    ctx.restore();
  },
  cancel(){cancelAnimationFrame(this.raf);this.canvas?.remove();this.canvas=null;this.animations?.forEach(a=>a.cancel());this.animations=[];}
};
