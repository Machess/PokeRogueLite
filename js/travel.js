/* Directional camera motion over the original route artwork. */
const Travel={
  busy:false,
  async go(node){
    if(this.busy||!node.unlocked||node.done||node.bypassed)return;
    this.busy=true;const screen=document.getElementById('screen-map');
    const lane=node.lane==='left'?'left':node.lane==='right'?'right':'forward';
    screen.dataset.travel=lane;screen.classList.add('is-travelling');
    const label=document.getElementById('travel-caption');if(label)label.textContent=`Taking the ${lane==='forward'?'path ahead':lane+' path'}…`;
    try{
      await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?80:780));
      SaveManager.beginNode(node);await MapEngine._enterNode(node);
    }catch(e){
      hideLoading();showModal('The path could not load','Your progress is safe. Try this path again.',()=>MapEngine.show());
    }finally{screen.classList.remove('is-travelling');delete screen.dataset.travel;this.busy=false;}
  },
  setup(){
    const screen=document.getElementById('screen-map');
    const trail=document.createElement('div');trail.className='travel-trail';trail.setAttribute('aria-hidden','true');
    const player=document.createElement('img');player.src='assets/trainer_stand.png';player.className='travel-player';player.alt='Your trainer';
    const caption=document.createElement('div');caption.id='travel-caption';caption.setAttribute('aria-live','polite');
    screen.append(trail,player,caption);
  },
  preview(node){
    const next=(node.links||[]).map(i=>GameState.map[i]).filter(Boolean);
    const labels={battle:'Battle',heal:'Heal',catch:'Catch',training:'Train',shop:'Shop',boss:'Gym',mystery:'Mystery'};
    return next.map(n=>labels[n.type]||'Challenge').filter((n,i,a)=>a.indexOf(n)===i).join(' / ');
  }
};
