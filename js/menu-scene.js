/* Reuses the runner's local atlas and scenery. All existing menu actions stay wired. */
const MenuScene={
 init(){
  const root=document.getElementById('screen-start'),layout=document.createElement('div');layout.className='adventure-home';
  const logo=root.querySelector('.start-logo');layout.appendChild(logo);
  const hero=document.createElement('div');hero.className='menu-hero';hero.setAttribute('aria-hidden','true');
  const pose=(rect,cls)=>`<svg class="menu-trainer ${cls}" viewBox="${rect.join(' ')}"><image href="assets/runner/trainer-atlas.png" width="1774" height="887"/></svg>`;
  hero.innerHTML=pose(RUNNER_ART.trainer.rects[7],'menu-wave')+pose(RUNNER_ART.trainer.rects[4],'menu-toss')+'<span class="menu-pokeball"></span><span class="menu-welcome">Your next adventure awaits.</span>';layout.appendChild(hero);
  const panel=document.createElement('section');panel.className='menu-panel';
  for(const sel of ['#active-profile-banner','#no-profile-nudge','#start-menu'])panel.appendChild(root.querySelector(sel));
  const settings=document.createElement('details');settings.className='menu-settings';settings.innerHTML='<summary>Settings &amp; save tools</summary><div class="menu-tools"></div>';
  const tools=settings.querySelector('.menu-tools');for(const sel of ['#btn-mute-start','#btn-reload-art','.backup-controls','#btn-reset-all']){const el=panel.querySelector(sel)||root.querySelector(sel);if(el)tools.appendChild(el);}
  panel.appendChild(settings);layout.appendChild(panel);root.appendChild(layout);root.querySelector('.start-trainer').remove();root.querySelector('.start-footer').remove();root.querySelector('.npn-text').textContent='Choose a trainer to begin your adventure.';
  root.querySelector('#apb-edit-age-btn').textContent='Difficulty';root.querySelector('#btn-switch-profile').textContent='Switch trainer';
  for(const [id,label] of [['btn-open-pokedex','Pokédex'],['btn-select-profile','Profile'],['btn-open-parent','Grown-ups']])root.querySelector('#'+id).textContent=label;
  document.querySelector('.profiles-title').textContent="Who's playing?";
  root.querySelector('#btn-mute-start').setAttribute('aria-label','Toggle music');
  new MutationObserver(()=>root.classList.toggle('no-player',!getActiveProfile())).observe(document.getElementById('active-profile-banner'),{attributes:true,attributeFilter:['style']});root.classList.toggle('no-player',!getActiveProfile());
  new MutationObserver(()=>{if(!root.classList.contains('active'))settings.open=false;}).observe(root,{attributes:true,attributeFilter:['class']});
 }
};
