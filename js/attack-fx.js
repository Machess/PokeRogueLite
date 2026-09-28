/* Move-specific, bounded canvas effects. One animation loop; no downloaded assets. */
const AttackFX = {
  style(name,type) {
    const n=(name||'').toLowerCase().replace(/[-–]/g,' ');
    if(/bubble/.test(n))return 'bubbles';
    if(/beam|ray|cannon|laser/.test(n))return 'beam';
    if(/flamethrower|fire blast|inferno/.test(n))return 'flame';
    if(/whip/.test(n))return 'whip';
    if(/scratch|slash|cut|fury swipes/.test(n))return 'claws';
    if(/kick/.test(n))return 'kick';
    if(/punch/.test(n)||type==='fighting')return 'punch';
    if(/tackle|slam|headbutt|take down|double edge/.test(n))return 'tackle';
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
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas=document.createElement('canvas');canvas.className='move-fx';canvas.dataset.effect=kind;canvas.setAttribute('aria-hidden','true');
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
      if(kind==='beam'){
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
      if(t>.45&&['tackle','punch','kick','claws','whip','beam'].includes(kind)){
        const p=(t-.45)/.55;ctx.globalAlpha=1-p;ctx.lineWidth=4;circle(bx,by,20+p*58,light,true);
        for(let i=0;i<8;i++){const r=i*Math.PI/4;line(bx+Math.cos(r)*(30+p*35),by+Math.sin(r)*(30+p*35),bx+Math.cos(r)*(45+p*65),by+Math.sin(r)*(45+p*65),5,light);}
        if(kind==='tackle'&&p<.5){ctx.save();ctx.translate(bx,by);ctx.beginPath();for(let i=0;i<16;i++){const r=i%2?20:52;const q=i*Math.PI/8;i?ctx.lineTo(Math.cos(q)*r,Math.sin(q)*r):ctx.moveTo(r,0);}ctx.closePath();ctx.fillStyle='#fff0ab';ctx.fill();ctx.restore();}
      }
      ctx.globalAlpha=1;if(t<1)this.raf=requestAnimationFrame(frame);else this.cancel();
    };this.raf=requestAnimationFrame(frame);return true;
  },
  cancel(){cancelAnimationFrame(this.raf);this.canvas?.remove();this.canvas=null;this.animations?.forEach(a=>a.cancel());this.animations=[];}
};
