
/* Новости и рейтинги ниже примерные, замените на реальные. Цены, номера и туры лежат в pricing.js. */
(function(){
'use strict';
var P=window.Pricing;
var nf=P.nf,money=P.money,pl=P.pl;
var $=function(id){return document.getElementById(id)};

/* ---------- данные ---------- */
var ROOMS=P.ROOMS,TOURS=P.TOURS;
var LVL=['Лёгкий','Средний','Сложный'];
var NEWS=[
 {cat:'offer',tag:'Предложение',date:'до 30 ноября 2026',title:'Четвёртая ночь в подарок',text:'Осеннее межсезонье в горах: при проживании от четырёх ночей одна ночь за наш счёт. Скидка считается в форме бронирования.',cta:'Рассчитать',href:'#booking'},
 {cat:'tour',tag:'Экскурсия',date:'7, 14, 21 и 28 ноября',title:'Охота с беркутом',text:'Показ в предгорьях: рассказ о традиции, фото с птицей, горячий чай у костра. Выезд в 10:00, около трёх часов.',cta:'Узнать о местах',href:'#contacts'},
 {cat:'offer',tag:'Предложение',date:'1 декабря – 15 марта',title:'Лыжный пакет',text:'Проживание, завтраки, сушилка для экипировки и ранний выезд к подъёмнику.',cta:'Выбрать даты',href:'#booking'},
 {cat:'tour',tag:'Экскурсия',date:'с 1 декабря, по выходным',title:'Снегоступы к замёрзшему водопаду',text:'Лёгкий маршрут на четыре часа. Снегоступы и палки выдаём, группы до восьми человек.',cta:'Узнать о местах',href:'#contacts'},
 {cat:'offer',tag:'Предложение',date:'25 декабря – 10 января',title:'Новый год в горах',text:'Праздничный ужин, костёр во дворе и ночной выезд к звёздам. Номера на эти даты лучше бронировать заранее.',cta:'Забронировать',href:'#booking'},
 {cat:'offer',tag:'Предложение',date:'круглый год',title:'Конференц-пакет от 8 человек',text:'Зал на день, проживание и кофе-брейки одним счётом. Состав обсуждаем под вашу программу.',cta:'Про конференц-зал',href:'#conference'}
];
var RATES=[
 {n:'Booking',cnt:'1 240 отзывов',s:9.2,max:10},
 {n:'Tripadvisor',cnt:'680 отзывов',s:4.5,max:5},
 {n:'Google Карты',cnt:'910 отзывов',s:4.7,max:5},
 {n:'Яндекс Путешествия',cnt:'530 отзывов',s:4.8,max:5}
];
var SEAT=[['Театр',80],['Класс',48],['Круглые столы',40],['П-образная',28]];

/* ---------- иллюстрации номеров ---------- */
function roomSVG(i,name){
  var cfg=[{w:[236,36,112,92],beds:1},{w:[196,28,172,124],beds:1,balc:1},{w:[256,40,96,88],beds:2},{w:[30,24,340,134],beds:1}][i];
  var wx=cfg.w[0],wy=cfg.w[1],ww=cfg.w[2],wh=cfg.w[3],id='cw'+i,s='';
  s+='<svg viewBox="0 0 400 260" role="img" aria-label="Иллюстрация номера «'+name+'»" preserveAspectRatio="xMidYMid slice">';
  s+='<rect width="400" height="260" style="fill:var(--w'+(i+1)+')"/>';
  s+='<rect y="198" width="400" height="62" style="fill:var(--floor)"/>';
  s+='<clipPath id="'+id+'"><rect x="'+wx+'" y="'+wy+'" width="'+ww+'" height="'+wh+'"/></clipPath>';
  s+='<g clip-path="url(#'+id+')"><rect x="'+wx+'" y="'+wy+'" width="'+ww+'" height="'+wh+'" fill="url(#gSky)"/>';
  var X=function(f){return (wx+ww*f).toFixed(1)},Y=function(f){return (wy+wh*f).toFixed(1)};
  s+='<path d="M'+X(0)+' '+Y(1)+' L'+X(.12)+' '+Y(.38)+' L'+X(.26)+' '+Y(.6)+' L'+X(.45)+' '+Y(.2)+' L'+X(.62)+' '+Y(.55)+' L'+X(.8)+' '+Y(.3)+' L'+X(1)+' '+Y(.58)+' L'+X(1)+' '+Y(1)+' Z" style="fill:var(--far)"/>';
  [[.12,.38],[.45,.2],[.8,.3]].forEach(function(p){s+='<path d="M'+X(p[0])+' '+Y(p[1])+' L'+X(p[0]-.05)+' '+Y(p[1]+.12)+' L'+X(p[0]-.01)+' '+Y(p[1]+.09)+' L'+X(p[0]+.02)+' '+Y(p[1]+.13)+' L'+X(p[0]+.05)+' '+Y(p[1]+.1)+' Z" style="fill:var(--snow)"/>'});
  s+='<path d="M'+X(0)+' '+Y(1)+' L'+X(0)+' '+Y(.72)+' L'+X(.22)+' '+Y(.62)+' L'+X(.4)+' '+Y(.78)+' L'+X(.64)+' '+Y(.66)+' L'+X(.85)+' '+Y(.8)+' L'+X(1)+' '+Y(.7)+' L'+X(1)+' '+Y(1)+' Z" style="fill:var(--mid)"/></g>';
  s+='<rect x="'+wx+'" y="'+wy+'" width="'+ww+'" height="'+wh+'" fill="none" stroke-width="5" style="stroke:var(--frame)"/>';
  if(i===3){s+='<path d="M'+(wx+ww/3)+' '+wy+'v'+wh+'M'+(wx+ww*2/3)+' '+wy+'v'+wh+'" stroke-width="3" style="stroke:var(--frame)"/>'}
  else{s+='<path d="M'+(wx+ww/2)+' '+wy+'v'+wh+'" stroke-width="3" style="stroke:var(--frame)"/>'}
  if(cfg.balc){s+='<path d="M'+wx+' '+(wy+wh-26)+'h'+ww+'" stroke-width="3" style="stroke:var(--frame)"/>';for(var k=wx+10;k<wx+ww;k+=14){s+='<path d="M'+k+' '+(wy+wh-26)+'v26" stroke-width="2" style="stroke:var(--frame)"/>'}}
  s+='<ellipse cx="200" cy="236" rx="130" ry="13" style="fill:var(--accent)" opacity=".3"/>';
  var bw=cfg.beds===2?106:152, starts=cfg.beds===2?[16,134]:[i===3?124:26];
  starts.forEach(function(bx){
    s+='<rect x="'+(bx+4)+'" y="124" width="'+(bw-8)+'" height="80" rx="3" style="fill:var(--wood)"/>';
    s+='<rect x="'+bx+'" y="168" width="'+bw+'" height="46" rx="3" style="fill:var(--linen)"/>';
    var pw=cfg.beds===2?bw-22:Math.floor(bw/2)-12;
    s+='<rect x="'+(bx+8)+'" y="156" width="'+pw+'" height="20" rx="5" style="fill:var(--linen)"/>';
    if(cfg.beds===1)s+='<rect x="'+(bx+bw/2+4)+'" y="156" width="'+pw+'" height="20" rx="5" style="fill:var(--linen)"/>';
    s+='<rect x="'+bx+'" y="186" width="'+bw+'" height="28" rx="2" style="fill:var(--accent)" opacity=".92"/>';
    for(var d=bx+10;d<bx+bw-6;d+=16){s+='<path d="M'+d+' 200 l6 -6 l6 6 l-6 6 Z" style="fill:var(--linen)"/>'}
  });
  var lx=cfg.beds===2?126:(i===3?200:104);
  s+='<path d="M'+lx+' 0 V46" stroke-width="2" style="stroke:var(--frame)"/><path d="M'+(lx-12)+' 62 L'+(lx-5)+' 46 H'+(lx+5)+' L'+(lx+12)+' 62 Z" style="fill:var(--lamp)"/>';
  s+='</svg>';return s;
}

/* ---------- рендер номеров ---------- */
$('roomsGrid').innerHTML=ROOMS.map(function(r,i){
  return '<article class="room"><figure>'+roomSVG(i,r.name)+'</figure><div class="room-b"><h3>'+r.name+'</h3>'+
  '<p class="spec">'+r.area+' м² · до '+r.cap+' гостей · вид '+r.view+'</p>'+
  '<ul>'+r.feat.map(function(f){return '<li>'+f+'</li>'}).join('')+'</ul>'+
  '<div class="room-f"><div><span class="price">'+nf(r.price)+'</span> <span class="per">сом / ночь</span></div>'+
  '<button class="btn small" type="button" data-room="'+r.id+'">Выбрать</button></div></div></article>';
}).join('');

/* ---------- рендер туров ---------- */
function profile(pts){
  var W=220,H=56,p=4,mn=Math.min.apply(0,pts),mx=Math.max.apply(0,pts);
  var xy=pts.map(function(v,i){return [p+i*(W-2*p)/(pts.length-1),H-p-(v-mn)/(mx-mn||1)*(H-2*p)]});
  var line=xy.map(function(q,i){return (i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)}).join(' ');
  var last=xy[xy.length-1];
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Профиль высот: от '+nf(pts[0])+' до '+nf(pts[pts.length-1])+' м"><path d="'+line+' L'+(W-p)+' '+H+' L'+p+' '+H+' Z" style="fill:var(--prof)"/><path d="'+line+'" fill="none" stroke-width="2" stroke-linejoin="round" style="stroke:var(--band-accent)"/><circle cx="'+last[0].toFixed(1)+'" cy="'+last[1].toFixed(1)+'" r="3.5" style="fill:var(--band-accent)"/></svg>';
}
$('toursGrid').innerHTML=TOURS.map(function(t){
  var bars='';for(var k=1;k<=3;k++){bars+='<i class="'+(k<=t.lvl?'on':'')+'"></i>'}
  return '<article class="tour"><h3>'+t.name+'</h3><div class="meta"><span>'+t.days+'</span><span>'+t.walk+'</span></div>'+
  '<p>'+t.desc+'</p><div class="lvl">'+bars+'<span>'+LVL[t.lvl-1]+'</span></div>'+
  '<div class="prof">'+profile(t.pts)+'<div><span>'+nf(t.pts[0])+' м</span><span>+'+nf(t.pts[t.pts.length-1]-t.pts[0])+' м</span><span>'+nf(t.pts[t.pts.length-1])+' м</span></div></div>'+
  '<div class="tour-f"><div><span class="price">'+nf(t.price)+'</span> <span class="per">сом / чел.</span></div><button class="btn small line" type="button" data-tour="'+t.id+'">В бронь</button></div></article>';
}).join('');

/* ---------- рассадка ---------- */
$('seatRows').innerHTML=SEAT.map(function(r){return '<div class="seat-row"><span>'+r[0]+'</span><div class="bar"><i style="width:'+(r[1]/80*100)+'%"></i></div><b>'+r[1]+'</b></div>'}).join('');

/* ---------- новости ---------- */
$('newsGrid').innerHTML=NEWS.map(function(n){
  return '<article class="item" data-cat="'+n.cat+'"><div class="tagline"><span class="t-'+n.cat+'">'+n.tag+'</span><span class="d">'+n.date+'</span></div><h3>'+n.title+'</h3><p>'+n.text+'</p><a href="'+n.href+'">'+n.cta+' →</a></article>';
}).join('');
Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(b){
  b.addEventListener('click',function(){
    var f=b.getAttribute('data-f');
    Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
    Array.prototype.forEach.call(document.querySelectorAll('.item'),function(it){it.hidden=!(f==='all'||it.getAttribute('data-cat')===f)});
  });
});

/* ---------- рейтинги ---------- */
$('rateRows').innerHTML=RATES.map(function(r){
  return '<div class="rate-row"><div class="n">'+r.n+'<small>'+r.cnt+'</small></div><div class="bar" role="img" aria-label="'+r.s+' из '+r.max+'"><i style="width:'+(r.s/r.max*100)+'%"></i></div><div class="s">'+String(r.s).replace('.',',')+' <small>/ '+r.max+'</small></div></div>';
}).join('');

/* ---------- бронирование ---------- */
var el={};['checkin','checkout','adults','children','rooms','room','breakfast','transfer','tour','confType','confDays','confDaysWrap','name','phone','comment','dateErr','formErr','capNote','stay','sumLines','sumTotal','result','resultText'].forEach(function(k){el[k]=$(k)});
el.room.innerHTML=ROOMS.map(function(r){return '<option value="'+r.id+'">'+r.name+' · от '+money(r.price)+'</option>'}).join('');
el.room.value='cmf';
el.tour.innerHTML='<option value="0">Без тура</option>'+TOURS.map(function(t){return '<option value="'+t.id+'">'+t.name+' · '+money(t.price)+' / чел.</option>'}).join('');

var parse=function(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
var iso=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
var addDays=function(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r};
var ru=function(d){return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()};
function clamp(v,a,b){v=parseInt(v,10);if(isNaN(v))v=a;return Math.max(a,Math.min(b,v))}
function getParams(){
  return {checkin:el.checkin.value,checkout:el.checkout.value,roomId:el.room.value,rooms:clamp(el.rooms.value,1,4),
    adults:clamp(el.adults.value,1,8),children:clamp(el.children.value,0,6),breakfast:el.breakfast.checked,
    transfer:+el.transfer.value,tourId:el.tour.value,confType:el.confType.value,confDays:clamp(el.confDays.value,1,5)};
}
function calc(){return P.calc(getParams())}

function render(){
  var r0=ROOMS.filter(function(x){return x.id===el.room.value})[0];
  var rooms=clamp(el.rooms.value,1,4),guests=clamp(el.adults.value,1,8)+clamp(el.children.value,0,6);
  if(guests>r0.cap*rooms){el.capNote.hidden=false;el.capNote.textContent='В категории «'+r0.name+'» до '+r0.cap+' гостей в номере. Для '+guests+' нужен другой номер или несколько номеров.'}
  else{el.capNote.hidden=true}
  el.confDaysWrap.hidden=el.confType.value==='0';
  var c=calc();
  if(!c.ok){
    el.dateErr.hidden=!el.checkin.value||!el.checkout.value?true:false;
    if(!el.dateErr.hidden)el.dateErr.textContent=c.msg;
    el.stay.textContent=c.msg;el.sumLines.innerHTML='';el.sumTotal.textContent=money(0);return;
  }
  el.dateErr.hidden=true;
  el.stay.textContent=ru(c.d1)+' – '+ru(c.d2)+' · '+c.nights+' '+pl(c.nights,['ночь','ночи','ночей'])+' · '+c.room.name;
  el.sumLines.innerHTML=c.lines.map(function(l){return '<div class="ln'+(l.disc?' disc':'')+'"><span>'+l.l+(l.sub?'<small>'+l.sub+'</small>':'')+'</span><b>'+(l.a<0?'−':'')+money(Math.abs(l.a))+'</b></div>'}).join('');
  el.sumTotal.textContent=money(c.total);
}

var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
el.checkin.min=iso(today);el.checkout.min=iso(addDays(today,1));
el.checkin.value=iso(addDays(today,14));el.checkout.value=iso(addDays(today,18));
el.checkin.addEventListener('change',function(){
  if(el.checkin.value){var n=addDays(parse(el.checkin.value),1);el.checkout.min=iso(n);if(!el.checkout.value||parse(el.checkout.value)<n)el.checkout.value=iso(n)}
});
['checkin','checkout','adults','children','rooms','room','breakfast','transfer','tour','confType','confDays'].forEach(function(k){el[k].addEventListener('input',render);el[k].addEventListener('change',render)});

var sending=false;
function showResult(title,hint,text){
  $('resultTitle').textContent=title;$('resultHint').textContent=hint;
  el.resultText.value=text;el.result.hidden=false;
  el.result.scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('bookForm').addEventListener('submit',function(e){
  e.preventDefault();
  if(sending)return;
  el.formErr.hidden=true;
  var p=getParams(),c=P.calc(p);
  if(!c.ok){el.formErr.hidden=false;el.formErr.textContent=c.msg;return}
  if(!el.name.value.trim()){el.formErr.hidden=false;el.formErr.textContent='Укажите имя.';el.name.focus();return}
  if(el.phone.value.replace(/\D/g,'').length<7){el.formErr.hidden=false;el.formErr.textContent='Укажите телефон, чтобы администратор мог связаться с вами.';el.phone.focus();return}
  var contact={name:el.name.value.trim(),phone:el.phone.value.trim(),comment:el.comment.value.trim()};
  var btn=$('submitBtn'),hint=$('sendHint'),label=btn.textContent;
  sending=true;btn.disabled=true;btn.textContent='Отправляем…';hint.hidden=false;
  var ctl=typeof AbortController==='function'?new AbortController():null;
  var timer=setTimeout(function(){if(ctl)ctl.abort()},75000);
  var fail=function(msg){
    el.formErr.hidden=false;el.formErr.textContent=msg;
    showResult('Заявка не отправлена','Скопируйте текст и отправьте администратору по телефону или на почту, контакты внизу страницы.',P.buildText(c,contact));
  };
  fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({},p,contact)),signal:ctl?ctl.signal:undefined})
    .then(function(r){return r.json().catch(function(){return {}}).then(function(j){return {j:j}})})
    .then(function(x){
      if(x.j&&x.j.ok){
        showResult('Заявка № '+x.j.id+' отправлена','Администратор свяжется с вами по указанному телефону. Копия заявки ниже.',x.j.text);
      }else{
        fail((x.j&&x.j.error)||'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.');
      }
    })
    .catch(function(){fail('Нет связи с сервером. Попробуйте ещё раз или свяжитесь с нами по телефону.')})
    .then(function(){clearTimeout(timer);sending=false;btn.disabled=false;btn.textContent=label;hint.hidden=true});
});
function copyText(text,btn,ta){
  var done=function(){var o=btn.textContent;btn.textContent='скопировано';setTimeout(function(){btn.textContent=o},1600)};
  var fallback=function(){if(ta){ta.focus();ta.select()}};
  try{navigator.clipboard.writeText(text).then(done,fallback)}catch(e){fallback()}
}
$('copyReq').addEventListener('click',function(){copyText(el.resultText.value,this,el.resultText)});
Array.prototype.forEach.call(document.querySelectorAll('.copy'),function(b){b.addEventListener('click',function(){copyText($(b.getAttribute('data-copy')).textContent,b,null)})});

/* кнопки «Выбрать» / «В бронь» */
function goBook(){$('booking').scrollIntoView({behavior:'smooth'})}
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-room],[data-tour]');
  if(b){
    if(b.hasAttribute('data-room'))el.room.value=b.getAttribute('data-room');
    if(b.hasAttribute('data-tour'))el.tour.value=b.getAttribute('data-tour');
    render();goBook();
  }
});
$('confBtn').addEventListener('click',function(){el.confType.value='full';render();goBook()});
render();

/* ---------- горные слои и параллакс ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var CFG={
  hf:{h:300,min:20,max:230,step:110,seed:7,waves:2.2,phase:.8,fill:'url(#gSnow)'},
  hm:{h:230,min:36,max:170,step:80,seed:21,waves:3,phase:2,fill:'var(--mid)'},
  hn:{h:160,min:30,max:120,step:58,seed:5,waves:4,phase:.4,fill:'var(--near)'},
  hfr:{h:96,min:44,max:86,step:220,seed:3,waves:1.5,phase:1,fill:'var(--bg)'},
  bf:{h:340,pad:130,min:30,max:250,step:100,seed:11,waves:2.4,phase:1.3,fill:'var(--b-far)'},
  bn:{h:200,pad:130,min:30,max:150,step:64,seed:4,waves:3.4,phase:.2,fill:'var(--b-near)'},
  bfr:{h:70,min:30,max:60,step:240,seed:9,waves:1.5,phase:2,fill:'var(--bg)'}
};
function drawRidge(svg,W){
  var o=CFG[svg.getAttribute('data-cfg')],pad=o.pad||0,H=o.h+pad,r=rng(o.seed),n=Math.ceil(W/o.step)+1,d='M0 '+H+' ';
  for(var i=0;i<=n;i++){
    var x=Math.min(W,i*o.step-(i&&i<n?r()*o.step*.3:0)),env=(Math.sin(i/n*Math.PI*o.waves+o.phase)+1)/2,k=.4+.6*env;
    var peak=i%2===0,f=peak?(.35+.65*r())*k:(.05+.25*r())*k,y=o.max-(o.max-o.min)*f;
    d+='L'+x.toFixed(1)+' '+y.toFixed(1)+' ';
  }
  d+='L'+W+' '+H+' Z';
  svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.setAttribute('width',W);svg.setAttribute('height',H);
  svg.style.height=H+'px';svg.style.bottom=(-pad)+'px';
  var p=svg.firstElementChild;p.setAttribute('d',d);p.setAttribute('style','fill:'+o.fill);
}
var hero=$('top'),band=$('tours');
function layout(){
  Array.prototype.forEach.call(hero.querySelectorAll('[data-cfg]'),function(s){drawRidge(s,Math.max(320,hero.clientWidth))});
  Array.prototype.forEach.call(band.querySelectorAll('[data-cfg]'),function(s){drawRidge(s,Math.max(320,band.clientWidth))});
}
layout();
var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var hl=Array.prototype.slice.call(hero.querySelectorAll('[data-speed]')),bl=Array.prototype.slice.call(band.querySelectorAll('[data-speed]')),tick=false;
function update(){
  tick=false;
  var hr=hero.getBoundingClientRect();
  if(hr.bottom>0){var s=Math.max(0,-hr.top);hl.forEach(function(e){e.style.transform='translate3d(0,'+(s*e.getAttribute('data-speed')).toFixed(1)+'px,0)'})}
  var br=band.getBoundingClientRect();
  if(br.bottom>0&&br.top<window.innerHeight){
    var c=br.top+br.height/2-window.innerHeight/2;
    bl.forEach(function(e){var v=Math.max(-120,Math.min(120,-c*e.getAttribute('data-speed')));e.style.transform='translate3d(0,'+v.toFixed(1)+'px,0)'});
  }
}
if(!rm){
  window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(update)}},{passive:true});
  update();
}
var rz;window.addEventListener('resize',function(){cancelAnimationFrame(rz);rz=requestAnimationFrame(function(){layout();if(!rm)update()})});
})();
