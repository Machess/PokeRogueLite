/* A staged capture throw: curved flight, impact, absorption, bounce, timed shakes and lock/breakout.
   This changes presentation only; CatchEngine still owns odds, item use and party changes. */
const CaptureCinematic = {
  token:0, layer:null, animations:[], observer:null,
  cancel() {
    this.token++;this.animations.forEach(a=>a.cancel());this.animations=[];this.layer?.remove();this.layer=null;this.observer?.disconnect();
    document.getElementById('screen-catch')?.classList.remove('capture-in-progress');
  },
  async play({caught,wiggles,ball,sprite,status}) {
    this.cancel();const token=this.token,screen=document.getElementById('screen-catch');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    screen.classList.add('capture-in-progress');
    const layer=document.createElement('div');layer.className='capture-cinematic';layer.setAttribute('aria-hidden','true');screen.appendChild(layer);this.layer=layer;
    this.observer=new MutationObserver(()=>{if(!screen.classList.contains('active'))this.cancel();});this.observer.observe(screen,{attributes:true,attributeFilter:['class']});
    const r=sprite.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height*.5;
    const landX=innerWidth/2,landY=Math.min(innerHeight*.66,innerHeight-120);
    const orb=ball.cloneNode(true);orb.removeAttribute('id');orb.className='catch-ball capture-orb';layer.appendChild(orb);
    const shade=document.createElement('div');shade.className='capture-shadow';shade.style.left=landX+'px';shade.style.top=(landY+43)+'px';layer.appendChild(shade);
    const flash=document.createElement('div');flash.className='capture-flash';layer.appendChild(flash);
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduced?Math.min(ms,150):ms));
    const alive=()=>this.token===token&&screen.classList.contains('active');
    const animate=async(el,frames,duration,opts={})=>{if(!alive())return;const a=el.animate(frames,{duration:reduced?Math.min(duration,160):duration,easing:'ease-in-out',fill:'forwards',...opts});this.animations.push(a);try{await a.finished;}catch(_){};};
    const pose=(x,y,scale=1,rotation=0)=>`translate(${x-42}px,${y-42}px) scale(${scale}) rotate(${rotation}deg)`;
    const burst=(x,y,success=false)=>{
      for(let i=0;i<(success?10:3);i++){const dot=document.createElement('i');dot.className=success?'capture-star':'capture-ring';layer.appendChild(dot);const angle=i/10*Math.PI*2,dx=Math.cos(angle)*110,dy=Math.sin(angle)*85;dot.style.left=x+'px';dot.style.top=y+'px';
        if(success){dot.textContent='✦';animate(dot,[{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.3)`,opacity:1,offset:.65},{transform:`translate(calc(-50% + ${dx*1.25}px),calc(-50% + ${dy*1.25}px)) scale(.7)`,opacity:0}],650);}
        else animate(dot,[{transform:'translate(-50%,-50%) scale(.1)',opacity:1},{transform:'translate(-50%,-50%) scale(2.8)',opacity:0}],500,{delay:reduced?0:i*65});
      }
    };
    document.getElementById('catch-title').textContent='Make the catch!';status.textContent='Here we go!';layer.dataset.phase='throw';
    await animate(orb,[{transform:pose(innerWidth*.5,innerHeight*.91,1.5,-40),opacity:1},{transform:pose(cx-100,cy-120,.85,150),offset:.48},{transform:pose(cx,cy,.58,330)}],720);
    if(!alive())return false;
    layer.dataset.phase='impact';burst(cx,cy);animate(flash,[{opacity:0},{opacity:.45,offset:.3},{opacity:0}],230);SoundEngine.playSFX('catch.mp3',.45);
    await animate(sprite,[{transform:'scale(1)',filter:'brightness(1)',opacity:1},{transform:'scale(.08)',filter:'brightness(5)',opacity:0}],360);
    if(!alive())return false;sprite.style.visibility='hidden';status.textContent='Hold on…';layer.dataset.phase='landing';
    await animate(orb,[{transform:pose(cx,cy,.58,330)},{transform:pose(landX,landY-55,.85,360),offset:.5},{transform:pose(landX,landY,1,360),offset:.8},{transform:pose(landX,landY-18,1,360),offset:.9},{transform:pose(landX,landY,1,360)}],540);
    if(!alive())return false;
    for(let i=0;i<wiggles;i++){
      await wait(420);if(!alive())return false;layer.dataset.phase='shake';status.textContent=`${'● '.repeat(i+1)}${'○ '.repeat(2-i)}`;
      animate(orb.querySelector('.ball-button'),[{background:'#fff'},{background:'#ffc54d',offset:.5},{background:'#fff'}],460);
      await animate(orb,[{transform:pose(landX,landY)},{transform:pose(landX-13,landY,1,-24),offset:.25},{transform:pose(landX+13,landY,1,24),offset:.6},{transform:pose(landX,landY)}],480);
      if(!alive())return false;
    }
    await wait(250);if(!alive())return false;
    if(caught){layer.dataset.phase='locked';document.getElementById('catch-title').textContent='Pokémon caught!';orb.classList.add('capture-locked');burst(landX,landY,true);status.textContent='Gotcha!';SoundEngine.playCorrect();await wait(750);}
    else {layer.dataset.phase='breakout';document.getElementById('catch-title').textContent='It broke free!';burst(landX,landY);status.textContent='It broke free!';await animate(orb,[{transform:pose(landX,landY),opacity:1},{transform:pose(landX,landY,1.7,80),opacity:0}],300);}
    if(!alive())return false;
    this.animations.forEach(a=>a.cancel());this.animations=[];sprite.style.visibility='';layer.remove();this.layer=null;this.observer.disconnect();screen.classList.remove('capture-in-progress');return true;
  }
};
