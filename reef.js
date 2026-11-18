const Reef = (() => {
  const beat = 1550;
  const awayLimit = 8 * 3600 * 1000;
  const crew = [
    {name:'Shelldon', role:'Blade knight', art:'shelldon', style:'knight-card', attack:3, hire:0, base:12},
    {name:'Pearl', role:'Tide mage', art:'pearl', style:'mage', attack:5, hire:24, base:18},
    {name:'Barnacle', role:'Shell guardian', art:'barnacle', style:'guard', attack:8, hire:50, base:23}
  ];
  const places = ['Sunlit Shoals','Kelp Gardens','Coral Crossing','Amethyst Cove','Moonlit Atoll'];
  const make = now => ({v:1,wave:1,hp:24,pearls:30,levels:[1,0,0],speed:1,paused:false,sound:false,time:now,phase:0});
  const region = wave => Math.floor((wave-1)/5) % places.length;
  const maxHp = wave => 24 + (wave-1)*5 + (wave%5 === 0 ? 15+wave : 0);
  const prize = wave => 7 + Math.floor(wave/3) + (wave%5 === 0 ? 8 : 0);
  const power = s => s.levels.reduce((n,l,i) => n + l*crew[i].attack, 0);
  const price = (s,i) => s.levels[i] ? Math.ceil(crew[i].base*Math.pow(1.34,s.levels[i]-1)) : crew[i].hire;
  function valid(s){
    return s && s.v===1 && Number.isSafeInteger(s.wave) && s.wave>=1 && Number.isFinite(s.hp) && s.hp>0 && s.hp<=maxHp(s.wave) && Number.isFinite(s.pearls) && s.pearls>=0 && Array.isArray(s.levels) && s.levels.length===3 && s.levels[0]>=1 && s.levels.every(v=>Number.isSafeInteger(v)&&v>=0) && [1,2,3].includes(s.speed) && typeof s.paused==='boolean' && typeof s.sound==='boolean' && Number.isFinite(s.time) && Number.isFinite(s.phase) && s.phase>=0 && s.phase<beat;
  }
  function advance(s,now){
    const elapsed=Math.max(0,Math.min(awayLimit,now-s.time));
    s.time=Math.max(now,s.time);
    if(s.paused) return {hits:0,wins:0,gain:0};
    const duration=s.phase+elapsed*s.speed;
    let hits=Math.floor(duration/beat);
    const count=hits,attack=power(s);
    s.phase=duration%beat;
    let wins=0,gain=0;
    while(hits>0){
      const remaining=Math.ceil(s.hp/attack);
      if(hits<remaining){s.hp-=hits*attack;break}
      hits-=remaining;
      gain+=prize(s.wave);wins++;s.wave++;s.hp=maxHp(s.wave);
    }
    s.pearls+=gain;
    return {hits:count,wins,gain};
  }
  function buy(s,i){
    if(!crew[i]) return false;
    const cost=price(s,i);
    if(cost>s.pearls) return false;
    s.pearls-=cost;s.levels[i]++;return true;
  }
  return {make,valid,advance,buy,price,power,region,places,crew,prize,maxHp,beat};
})();
