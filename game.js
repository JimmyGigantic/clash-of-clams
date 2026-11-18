'use strict';
const $ = id => document.getElementById(id);
const paths = {
  mute:'M2 8h4l5-4v16l-5-4H2z M15 8h2v2h2V8h2v2h-2v2h2v2h-2v-2h-2v2h-2v-2h2v-2h-2z',
  sound:'M2 8h4l5-4v16l-5-4H2z M14 7h2v2h2v6h-2v2h-2v-3h2v-4h-2z M17 3h2v2h2v3h2v8h-2v3h-2v2h-2v-2h2v-3h2V8h-2V5h-2z',
  book:'M2 4h8v1h4V4h8v15h-8v2h-4v-2H2z M4 6v11h6v1h1V7h-1V6z M14 6v1h-1v11h1v-1h6V6z',
  share:'M14 2h2v2h2v2h2v2h2v2h-2v2h-2v2h-2v2h-2v-5h-3v1H8v2H6v2H4v-4h2V9h2V7h3V6h3z M2 17h2v3h16v-4h2v6H2z',
  swords:'M2 2h4v2h2v2h2v2h2v2h2l2 2-2 2-2-2h-2v-2H8V8H6V6H4V4H2z M18 2h4v4h-2v2h-2v2h-2v2h-2l-2-2 2-2h2V6h2z M6 12l6 6-2 2-2-2-4 4-2-2 4-4-2-2z M18 12l2 2-2 2 4 4-2 2-4-4-2 2-2-2z',
  flag:'M4 2h2v1h13v2h-2v2h2v2h2v2H6v10H4z',
  fast:'M2 5h2v2h3v2h3v2h2v2h-2v2H7v2H4v2H2z M12 5h2v2h3v2h3v2h2v2h-2v2h-3v2h-3v2h-2z',
  pause:'M5 4h5v16H5z M14 4h5v16h-5z',play:'M6 3h2v2h3v2h3v2h3v2h3v2h-3v2h-3v2h-3v2H8v2H6z',
  crew:'M2 10h2V8h4v2h2v4H8v1H4v-1H2z M9 5h2V3h4v2h2v5h-2v2h-4v-2H9z M17 9h4v2h2v4h-2v1h-4v-2h-1v-3h1z M1 17h2v-1h5v2H6v3H1z M7 17h2v-3h7v2h2v5H7z M19 18h3v1h2v2h-5z',
  bolt:'M11 1h8l-5 8h6L8 23l3-11H5z',
  up:'M10 3h4v2h2v2h2v2h2v3h-6v8h-4v-8H4V9h2V7h2V5h2z',
  plus:'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
  save:'M3 3h15v2h2v2h2v14H3z M6 5v6h10V5h-2v4h-2V5z M7 14v5h11v-5z',
  close:'M4 4h3v3h3v3h4V7h3V4h3v3h-3v3h-3v4h3v3h3v3h-3v-3h-3v-3h-4v3H7v3H4v-3h3v-3h3v-4H7V7H4z'
};
const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill-rule="evenodd"><path d="'+paths[name]+'"/></svg>';
const decorate = root => root.querySelectorAll('i[data-icon]').forEach(i=>i.innerHTML=icon(i.dataset.icon));
decorate(document);
const SAVE='clash-of-clams.reef.v1';
const money=n=>Math.floor(n).toLocaleString('en-US');
let canSave=true;
function load(){
  try{const s=JSON.parse(localStorage.getItem(SAVE));if(Reef.valid(s))return s}catch{canSave=false}
  return Reef.make(Date.now());
}
let state=load(),lastSave=0,toastTimer,winTimer,audio;
let lastMessage='',cardStamp='',introResolved=false;
const initialGap=Date.now()-state.time;
const away=Reef.advance(state,Date.now());
function save(){
  lastSave=Date.now();
  try{localStorage.setItem(SAVE,JSON.stringify(state));canSave=true}catch{canSave=false}
  if(!canSave)$('save-note').textContent='Progress lasts for this visit';
}
function toast(t){$('toast').textContent=t;$('toast').className='shown';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').className='',2800)}
function say(t){lastMessage=t;$('combat').textContent=t}
function tone(type){
  if(!state.sound||!audio||audio.state!=='running')return;
  const tones=type==='win'?[440,554,659]:type==='buy'?[392,523]:[type==='hit'?166:220];
  tones.forEach((hz,i)=>{
    const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.067;
    osc.type=type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(hz,at);osc.frequency.exponentialRampToValueAtTime(hz*(type==='hit'?.51:1.025),at+.09);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(type==='hit'?.055:.085,at+.01);gain.gain.exponentialRampToValueAtTime(.0001,at+.13);
    osc.connect(gain).connect(audio.destination);osc.start(at);osc.stop(at+.14);
  });
}
function awakenAudio(){if(!state.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){audio=audio||new AC();if(audio.state==='suspended')audio.resume().catch(()=>{})}}catch{}}
document.addEventListener('pointerdown',awakenAudio,{passive:true});
function enemy(wave){return wave%5===0?'King Claw':['Reef Crab','Kelp Crab','Coral Crab','Dusk Crab','Moon Crab'][Reef.region(wave)]}
function drawCards(){
  const stamp=state.levels.join('/')+'|'+Reef.crew.map((_,i)=>state.pearls>=Reef.price(state,i)).join('/');
  if(stamp===cardStamp)return;cardStamp=stamp;
  if(!$('cards').childElementCount){
    Reef.crew.forEach((u,i)=>{
      const card=document.createElement('article');card.className='card '+u.style;
      card.innerHTML='<div class="card-info"><div class="portrait"><img src="'+u.art+'.png" alt=""></div><div class="details"><p class="role">'+u.role.toUpperCase()+'</p><h3>'+u.name+'</h3><div class="level"><b></b><span></span></div></div></div><button class="purchase" data-buy="'+i+'"><span class="action"><i></i><span></span></span><span class="price"><img src="pearl-icon.png" alt=""><span></span></span></button>';
      $('cards').append(card);
    });
  }
  Reef.crew.forEach((u,i)=>{
    const card=$('cards').children[i],level=state.levels[i],cost=Reef.price(state,i),verb=level?'Upgrade':'Recruit',btn=card.querySelector('button');
    card.querySelector('.level b').className=level?'':'unhired';
    card.querySelector('.level span').textContent=level?'Level '+level+' · '+(level*u.attack)+' power':'+'+u.attack+' crew power';
    btn.classList.toggle('recruit',!level);btn.disabled=state.pearls<cost;
    btn.querySelector('.action span').textContent=verb;btn.querySelector('.action i').innerHTML=icon(level?'up':'plus');
    btn.querySelector('.price span').textContent=money(cost);
    const label=verb+' '+u.name+' for '+money(cost)+' pearls, adds '+u.attack+' crew power';
    btn.setAttribute('aria-label',label);btn.title=label;
  });
}
const reefHues=['none','hue-rotate(324deg) saturate(.9)','hue-rotate(15deg)','hue-rotate(43deg) saturate(.78)','hue-rotate(70deg) brightness(.86)'];
function draw(){
  $('balance').textContent=money(state.pearls);$('power').textContent=money(Reef.power(state));$('wave').textContent=String(state.wave).padStart(2,'0');
  const r=Reef.region(state.wave);$('place').textContent=Reef.places[r];$('enemy-name').textContent=enemy(state.wave);
  const hp=Math.ceil(100*state.hp/Reef.maxHp(state.wave));$('hpbar').style.width=hp+'%';$('health').setAttribute('aria-valuenow',hp);
  $('arena').querySelector('.water-bg').style.filter=reefHues[r];$('crab').style.filter='hue-rotate('+([0,55,-25,250,310][r])+'deg)';$('crab').style.scale=state.wave%5===0?'1.18':'1';
  $('ally1').hidden=!state.levels[1];$('ally2').hidden=!state.levels[2];
  $('arena').classList.toggle('paused',state.paused);$('live-text').textContent=state.paused?'Paused':'Auto-battling';
  $('speed').querySelector('span').textContent=state.speed+'×';$('speed').setAttribute('aria-label','Battle speed, '+state.speed+' times. Change speed');
  $('pause').querySelector('i').innerHTML=icon(state.paused?'play':'pause');$('pause').title=state.paused?'Resume battle':'Pause battle';$('pause').setAttribute('aria-label',$('pause').title);
  $('sound').querySelector('i').innerHTML=icon(state.sound?'sound':'mute');$('sound').title='Turn sound '+(state.sound?'off':'on');$('sound').setAttribute('aria-label',$('sound').title);
  drawCards();
}
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function strike(amount){
  if(reduced()||document.hidden)return;
  const dist=Math.min(72,$('arena').clientWidth*.075);
  $('knight').animate([{transform:'translateX(0)'},{transform:'translate('+dist+'px,-4px)',offset:.38},{transform:'translateX(0)'}],{duration:390,easing:'steps(8,end)'});
  $('crab').animate([{transform:'translateX(0)',filter:'brightness(1)'},{transform:'translate(6px,-2px)',filter:'brightness(1.7)',offset:.45},{transform:'translateX(0)',filter:'brightness(1)'}],{duration:260,delay:140,easing:'steps(4,end)'});
  const n=document.createElement('span');n.className='damage';n.textContent='−'+money(amount);$('effects').append(n);setTimeout(()=>n.remove(),850);
  const projectile=document.createElement('b');projectile.className='pearl-shot';$('effects').append(projectile);
  const a=projectile.animate([{left:'39%',opacity:0,transform:'scale(.55)'},{opacity:1,offset:.25},{left:'65%',opacity:.95,transform:'scale(1)'}],{duration:240,easing:'ease-in'});a.onfinish=()=>projectile.remove();setTimeout(()=>projectile.remove(),500);
}
function settle(show=true){
  const before=state.wave,oldHp=state.hp,now=Date.now(),result=Reef.advance(state,now);
  if(!result.hits)return;
  if(show&&!document.hidden){
    if(result.wins){
      strike(oldHp);tone('win');say('Wave '+before+' cleared! Your crew earned '+money(result.gain)+' pearls.');
      const note=$('win');note.textContent='Wave cleared!  +'+money(result.gain)+' pearls';note.hidden=false;clearTimeout(winTimer);winTimer=setTimeout(()=>note.hidden=true,Math.min(1300,2200/state.speed));
    }else{
      strike(Reef.power(state));tone('hit');
      say('Your crew hits '+enemy(state.wave)+' for '+money(Reef.power(state))+' damage.');
    }
  }
  if(result.wins)save();draw();
}
function togglePause(){
  settle(false);state.paused=!state.paused;
  say(state.paused?'Battle paused. Your crew is taking a breather.':'Your crew is back in the fight.');save();draw();
}
$('pause').addEventListener('click',togglePause);
$('speed').addEventListener('click',()=>{settle(false);state.speed=state.speed%3+1;save();draw();toast('Battle speed set to '+state.speed+'×')});
$('sound').addEventListener('click',()=>{settle(false);state.sound=!state.sound;awakenAudio();tone('buy');save();draw();toast('Sound '+(state.sound?'on':'off'))});
$('cards').addEventListener('click',e=>{
  const btn=e.target.closest('[data-buy]');if(!btn||btn.disabled)return;
  settle(false);const i=Number(btn.dataset.buy);if(!Reef.buy(state,i))return;
  const level=state.levels[i],u=Reef.crew[i];tone('buy');say(level===1?u.name+' joined the crew!':u.name+' reached level '+level+'!');
  toast(u.name+(level===1?' recruited!':' upgraded!')+' +'+u.attack+' crew power');save();draw();
});
function dialog(title,markup){$('dialog-title').textContent=title;$('dialog-content').innerHTML=markup;$('dialog').showModal()}
$('help').addEventListener('click',()=>dialog('How to play','<div class="instructions"><div class="instruction"><img src="shelldon.png" alt=""><p><strong>Let your clams fight.</strong>Your crew attacks automatically and always wins. Every fifth wave brings a boss.</p></div><div class="instruction"><img src="pearl-icon.png" alt=""><p><strong>Spend your pearls.</strong>Every victory pays pearls. Recruit a clam or upgrade one to deal more damage per hit.</p></div><div class="instruction"><img src="barnacle.png" alt=""><p><strong>Explore the reef.</strong>Beat a boss to reach the next reef. Your crew keeps earning for up to eight hours while you’re away.</p></div></div><p class="guide-foot">Use the speed and pause buttons beneath the reef to set your pace. Pausing also pauses away earnings.</p>'));
$('dialog').querySelector('.close').addEventListener('click',()=>$('dialog').close());
$('dialog').addEventListener('click',e=>{if(e.target===$('dialog')){const r=$('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('dialog').close()}});
const shareUrl=new URL('.',window.location.href).href;
$('share').addEventListener('click',async()=>{
  if(navigator.share){try{await navigator.share({title:'Clash of Clams',text:'Meet my clam crew.',url:shareUrl});return}catch(e){if(e.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(shareUrl);toast('Game link copied!')}catch{
    dialog('Share game','<p class="dialog-copy">Send this link to a friend to start their own clam crew.</p><div class="share-box"><input aria-label="Game link" readonly value="'+shareUrl+'"><button class="tool" id="copy-link">Copy</button></div>');
    const input=$('dialog-content').querySelector('input');input.select();
    $('copy-link').onclick=()=>{input.select();if(document.execCommand('copy')){toast('Game link copied!');$('dialog').close()}else{toast('Select the link and copy it to share.')}};
  }
});
window.addEventListener('storage',e=>{if(e.key!==SAVE||!e.newValue)return;try{const s=JSON.parse(e.newValue);if(Reef.valid(s)&&s.time>=lastSave){state=s;lastSave=Date.now();draw()}}catch{}});
function welcome(){
  if(introResolved)return;introResolved=true;
  if(initialGap>60000&&away.gain){say('Welcome back! Your crew earned '+money(away.gain)+' pearls while you were away.');toast('Away earnings: +'+money(away.gain)+' pearls')}
  else if(state.paused)say('Battle paused. Your crew is taking a breather.');
  else say('Shelldon squares up to a '+enemy(state.wave)+'.');
}
draw();welcome();save();
setInterval(()=>{if(document.hidden)return;settle();if(Date.now()-lastSave>5000)save()},100);
document.addEventListener('visibilitychange',()=>{if(document.hidden){settle(false);save()}else{const gap=Date.now()-state.time,old=state.pearls;settle(false);if(gap>60000&&state.pearls>old)toast('Away earnings: +'+money(state.pearls-old)+' pearls');draw()}});
window.addEventListener('pagehide',()=>{settle(false);save()});
