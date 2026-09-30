/* Touch throwing uses the existing catch odds and item accounting. */
const CatchTouch={
 balls:[{id:'pokeball',label:'Poké Ball',item:null},{id:'ultraball',label:'Ultra Ball',item:'ultra_ball'},{id:'masterball',label:'Master Ball',item:'master_ball'}],
 icon(id){return `<span class="go-ball" data-ball="${id}" aria-hidden="true"><i class="go-ball-top"></i><i class="go-ball-band"></i><i class="go-ball-button"></i>${id==='masterball'?'<b>M</b>':''}</span>`;},
 render(){
  const e=CatchEngine,root=document.getElementById('screen-catch'),sel=document.getElementById('ball-selector');
  if(e._throwing)return;
  let current=this.balls.find(b=>b.id===e._selectedBall)||this.balls[0];
  if(current.item&&!ItemEngine.hasItem(current.item)){current=this.balls[0];e._selectedBall=current.id;}
  sel.replaceChildren();this.balls.forEach(b=>{
   const count=b.item?(GameState.items||[]).filter(i=>i.id===b.item).reduce((n,i)=>n+(i.count||0),0):null;
   const button=document.createElement('button');button.className='ball-select-btn'+(b.id===current.id?' ball-selected':'');button.dataset.ball=b.id;button.disabled=count===0;button.setAttribute('aria-pressed',b.id===current.id?'true':'false');button.setAttribute('aria-label',b.label+(count===null?', unlimited':', '+count+' available'));
   button.innerHTML=this.icon(b.id)+`<strong>${b.label}</strong><span>${count===null?'Unlimited':'×'+count}</span>`;
   button.onclick=()=>{if(e._throwing||this.drag)return;e._selectedBall=b.id;this.render();};sel.appendChild(button);
  });
  const button=document.getElementById('btn-throw-ball');button.innerHTML=this.icon(current.id)+'<span id="catch-throw-label">Swipe up to throw</span>';button.setAttribute('aria-label','Throw '+current.label+'. Swipe up, or press Enter.');button.disabled=false;
  root.classList.add('catch-touch-ready');root.dataset.catchPhase='ready';
  if(!document.querySelector('.catch-aim-ring')){const ring=document.createElement('div');ring.className='catch-aim-ring';ring.setAttribute('aria-hidden','true');document.getElementById('catch-sprite-wrap').prepend(ring);}
 },
 origin(){const r=document.querySelector('#btn-throw-ball .go-ball')?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null;},
 reset(){this.drag=null;const ball=document.querySelector('#btn-throw-ball .go-ball');if(ball)ball.style.transform='';},
 install(){
  const button=document.getElementById('btn-throw-ball'),root=document.getElementById('screen-catch');
  button.addEventListener('pointerdown',e=>{if(e.button!==0||CatchEngine._throwing||!root.classList.contains('catch-touch-ready'))return;e.preventDefault();this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.id)return;const dx=Math.max(-90,Math.min(90,e.clientX-this.drag.x)),dy=Math.max(-160,Math.min(30,e.clientY-this.drag.y));const ball=button.querySelector('.go-ball');if(ball)ball.style.transform=`translate(${dx}px,${dy}px) rotate(${dx*.3}deg)`;});
  button.addEventListener('pointerup',e=>{
   if(!this.drag||e.pointerId!==this.drag.id)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y,valid=dy<=-55&&Math.abs(dx)<Math.max(65,-dy*.9);const from=this.origin();this.reset();
   if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);
   if(valid){CatchEngine._throwOrigin=from;CatchEngine.throwBall();}else document.getElementById('catch-throw-label').textContent='Swipe upwards to throw';
  });
  button.addEventListener('pointercancel',()=>this.reset());button.addEventListener('lostpointercapture',()=>this.reset());
  new MutationObserver(()=>{if(!root.classList.contains('active')&&root.classList.contains('catch-touch-ready')){this.reset();root.classList.remove('catch-touch-ready');}}).observe(root,{attributes:true,attributeFilter:['class']});
 }
};
