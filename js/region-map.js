/* Illustrated regional overview. Coordinates are aligned to the bundled art.
   The marker represents the current encounter route, not a free-roaming GPS location. */
const RegionMap = {
  maps: {
    kanto: {
      name: 'Kanto', image: 'assets/regions/kanto.png', start: 'pallet',
      cities: {
        pallet: ['Pallet Town',27,54], viridian: ['Viridian City',27,40], pewter: ['Pewter City',26,24],
        cerulean: ['Cerulean City',62,19], vermilion: ['Vermilion City',62,52], celadon: ['Celadon City',45,36],
        saffron: ['Saffron City',62,35], lavender: ['Lavender Town',81,35], fuchsia: ['Fuchsia City',67,69],
        cinnabar: ['Cinnabar Island',22,77], indigo: ['Indigo Plateau',11,10]
      },
      gyms: ['pewter','cerulean','vermilion','celadon','fuchsia','saffron','cinnabar','viridian'],
      legs: [
        [[27,54],[27,40],[26,24]], [[26,24],[27,16],[43,16],[43,22],[62,22],[62,19]],
        [[62,19],[62,35],[62,52]], [[62,52],[62,36],[45,36]],
        [[45,36],[45,47],[64,47],[67,69]], [[67,69],[64,51],[62,35]],
        [[62,35],[62,52],[65,81],[43,81],[22,77]], [[22,77],[27,64],[27,54],[27,40]]
      ]
    },
    johto: {
      name: 'Johto', image: 'assets/regions/johto.png', start: 'newbark',
      cities: {
        newbark: ['New Bark Town',85,64], cherrygrove: ['Cherrygrove City',71,64], violet: ['Violet City',60,40],
        azalea: ['Azalea Town',53,58], goldenrod: ['Goldenrod City',39,40], ecruteak: ['Ecruteak City',47,20],
        olivine: ['Olivine City',21,45], cianwood: ['Cianwood City',11,79], mahogany: ['Mahogany Town',69,27],
        blackthorn: ['Blackthorn City',87,25], rage: ['Lake of Rage',67,9], indigo: ['League Pass',95,6]
      },
      gyms: ['violet','azalea','goldenrod','ecruteak','cianwood','olivine','mahogany','blackthorn'],
      legs: [
        [[85,64],[71,64],[60,61],[60,40]], [[60,40],[60,60],[53,58]],
        [[53,58],[46,61],[46,45],[39,40]], [[39,40],[45,30],[47,20]],
        [[47,20],[44,30],[32,30],[27,41],[21,45],[15,64],[11,79]],
        [[11,79],[15,64],[21,45]], [[21,45],[27,41],[32,30],[47,30],[60,30],[69,27]],
        [[69,27],[76,31],[76,24],[87,25]]
      ]
    }
  },
  interpolate(points, t) {
    const lengths = points.slice(1).map((p,i) => Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
    let distance = lengths.reduce((a,b) => a+b,0)*Math.max(0,Math.min(1,t));
    for(let i=0;i<lengths.length;i++) { if(distance<=lengths[i]) { const f=lengths[i]?distance/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f]; } distance-=lengths[i]; }
    return points.at(-1);
  },
  location(state = GameState) {
    const region = state?.region === 'johto' ? 'johto' : 'kanto', map = this.maps[region];
    const stage = Math.max(0,state?.bossesDefeated||0);
    if(state?.isLeagueRun || stage>=8) return {region,stage,progress:1,point:map.cities.indigo.slice(1),target:'indigo',label:`${map.cities.indigo[0]} · League challenge`,points:[]};
    const nodes=state?.map||[], maxRow=Math.max(1,...nodes.map(n=>Number(n.row)||0));
    const done=nodes.filter(n=>n.done), row=Math.max(-1,...done.map(n=>Number(n.row)||0));
    const atGym=nodes.some(n=>n.type==='boss'&&n.unlocked&&!n.bypassed);
    const progress=atGym?1:Math.max(0,Math.min(1,(row+1)/(maxRow+1)));
    const target=map.gyms[stage],points=map.legs[stage];
    const label=progress===0?`${map.cities[stage?map.gyms[stage-1]:map.start][0]} → ${map.cities[target][0]}`:progress===1?map.cities[target][0]:`On the route to ${map.cities[target][0]}`;
    return {region,stage,progress,point:this.interpolate(points,progress),target,label,points};
  },
  install() {
    const host=document.getElementById('screen-map');if(!host||document.getElementById('region-map-toggle'))return;
    const button=document.createElement('button');button.id='region-map-toggle';button.type='button';button.onclick=()=>this.open();
    button.innerHTML='<span class="region-mini"><img alt=""/><i class="region-pin"></i></span><strong>Region map</strong><small></small>';host.appendChild(button);
  },
  update() {
    const button=document.getElementById('region-map-toggle');if(!button||!GameState)return;
    const loc=this.location(),map=this.maps[loc.region];button.querySelector('img').src=map.image;
    const pin=button.querySelector('.region-pin');pin.style.left=loc.point[0]+'%';pin.style.top=loc.point[1]+'%';
    button.querySelector('strong').textContent=map.name+' map';button.querySelector('small').textContent=loc.label;
    button.setAttribute('aria-label',`${map.name} region map. ${loc.label}`);
    if(this.dialog?.open)this.render(this.selected||loc.region);
  },
  open() {
    if(!this.dialog) {
      this.dialog=document.createElement('dialog');this.dialog.id='region-map-dialog';
      this.dialog.innerHTML='<header><h2>Region map</h2><button type="button" class="region-map-close">Back to journey</button></header><nav aria-label="Regions"><button type="button" data-region="kanto">Kanto</button><button type="button" data-region="johto">Johto</button></nav><p class="region-location" aria-live="polite"></p><div class="region-canvas"></div><footer>● You are here &nbsp; ✓ Gym cleared &nbsp; ◇ Next gym</footer>';
      document.body.appendChild(this.dialog);this.dialog.querySelector('.region-map-close').onclick=()=>this.dialog.close();
      this.dialog.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>this.render(b.dataset.region));
      this.dialog.addEventListener('click',e=>{if(e.target===this.dialog)this.dialog.close();});
    }
    this.render(this.location().region);this.dialog.showModal();
  },
  render(region) {
    this.selected=region;const map=this.maps[region],loc=this.location(),active=region===loc.region;
    this.dialog.querySelector('h2').textContent=map.name+' · Your journey';
    this.dialog.querySelectorAll('[data-region]').forEach(b=>{b.classList.toggle('selected',b.dataset.region===region);b.setAttribute('aria-pressed',String(b.dataset.region===region));});
    this.dialog.querySelector('.region-location').textContent=active?`${loc.label} · ${Math.min(loc.stage,8)} / 8 badges`:`No active run in ${map.name}`;
    const canvas=this.dialog.querySelector('.region-canvas');canvas.replaceChildren();
    const image=document.createElement('img');image.src=map.image;image.alt=`Illustrated ${map.name} region`;canvas.appendChild(image);
    if(active&&loc.points.length){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('region-route');const line=document.createElementNS(svg.namespaceURI,'polyline');line.setAttribute('points',loc.points.map(p=>p.join(',')).join(' '));svg.appendChild(line);canvas.appendChild(svg);}
    for(const [id,city] of Object.entries(map.cities)) {
      const el=document.createElement('span');el.className='region-city';el.dataset.city=id;el.style.left=city[1]+'%';el.style.top=city[2]+'%';
      const idx=map.gyms.indexOf(id),cleared=active&&idx>=0&&idx<loc.stage;
      el.textContent=(cleared?'✓ ':active&&id===loc.target?'◇ ':'')+city[0];if(cleared)el.classList.add('cleared');if(active&&id===loc.target)el.classList.add('next');canvas.appendChild(el);
    }
    if(active){const pin=document.createElement('span');pin.className='region-pin large';pin.style.left=loc.point[0]+'%';pin.style.top=loc.point[1]+'%';pin.setAttribute('role','img');pin.setAttribute('aria-label','You are here');canvas.appendChild(pin);}
  }
};
