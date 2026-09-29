/* Shared alpha-bounds sizing, retaining original image IDs and sources. */
const TrainerSizing={
 selector:'#boss-trainer-sprite,#challenge-character-img,.cooking-portrait',
 fit(img){const frame=img.parentElement;if(!frame?.classList.contains('trainer-frame'))return;const data=TRAINER_BOUNDS[img.getAttribute('src')?.split('/').pop()];if(!data||!frame.clientWidth||!frame.clientHeight)return;const [w,h,x,y,r,b]=data;const scale=Math.min(frame.clientWidth/(r-x),frame.clientHeight/(b-y))*.96;img.style.setProperty('width',w*scale+'px','important');img.style.setProperty('height',h*scale+'px','important');img.style.setProperty('left',((frame.clientWidth-(r-x)*scale)/2-x*scale)+'px','important');img.style.setProperty('top',((frame.clientHeight-(b-y)*scale)/2-y*scale)+'px','important');},
 scan(){document.querySelectorAll(this.selector).forEach(img=>{if(!img.parentElement.classList.contains('trainer-frame')){const frame=document.createElement('span');frame.className='trainer-frame';img.before(frame);frame.appendChild(img);this.resize.observe(frame);img.addEventListener('load',()=>this.fit(img));}this.fit(img);});},
 init(){this.resize=new ResizeObserver(entries=>entries.forEach(e=>{const img=e.target.querySelector('img');if(img)this.fit(img);}));this.scan();new MutationObserver(()=>this.scan()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});}
};

