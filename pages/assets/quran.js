/* ═══════════════════════════════════════════════════════════════
   QURAN GARDEN — engine: garden shelf, page-flip book reader,
   tap-word meanings, tabs, story pager, mini-game, memorize, i18n.
   ─────────────────────────────────────────────────────────────── */
window.QStore = (function(){
  const P='qg:';
  return{ get(k){try{return localStorage.getItem(P+k)}catch(e){return null}},
    set(k,v){try{localStorage.setItem(P+k,v)}catch(e){}} };
})();

window.QApp = (function(){
  let lang = QStore.get('lang')||'ar';
  let cur = null; // current surah slug

  function tr(d){ if(d==null)return''; if(typeof d==='string')return d; return d[lang]||d.ar||d.en||''; }
  function el(t,c,h){const n=document.createElement(t);if(c)n.className=c;if(h!=null)n.innerHTML=h;return n;}

  /* ───── language ───── */
  function setLang(l){
    lang=l; QStore.set('lang',l);
    document.documentElement.lang=l;
    document.documentElement.dir = l==='ar'?'rtl':'ltr';
    document.querySelectorAll('.q-lang button').forEach(b=>b.classList.toggle('active',b.dataset.lang===l));
    buildGarden();
    if(cur) openSurah(cur);
  }

  /* ───── GARDEN ───── */
  function buildGarden(){
    const root=document.getElementById('shelfGrid');
    if(!root)return; root.innerHTML='';
    window.SURAH_INDEX.forEach(s=>{
      const data=window.SURAHS[s.slug];
      const done=QStore.get('done:'+s.slug)==='1';
      const memDone=(QStore.get('mem:'+s.slug)||'').split('').filter(x=>x==='1').length;
      const memTot=data?data.verses.length:1;
      const pct=Math.min(100,Math.round(memDone/memTot*100));
      const c=el('button','surah-fruit'+(done?' done':''));
      c.innerHTML=`<span class="num-badge">${s.num}</span>
        <span class="seal">⭐</span>
        <div class="emblem">${s.emoji}</div>
        <div class="s-name quran-ar">${lang==='ar'?s.nameAr:s.nameEn}</div>
        <div class="s-meta">${(lang==='ar'?s.metaAr:s.metaEn)}</div>
        <div class="s-prog"><div class="bar"><div class="fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
      c.addEventListener('click',()=>openSurah(s.slug));
      root.appendChild(c);
    });
    // progress garden
    const row=document.getElementById('gpRow');
    if(row){ row.innerHTML='';
      window.SURAH_INDEX.forEach(s=>{
        const grown=QStore.get('done:'+s.slug)==='1';
        const p=el('div','gp-plant'+(grown?' grown':''),grown?(s.tree||'🌳'):'🌱');
        p.title=lang==='ar'?s.nameAr:s.nameEn;
        p.style.cursor='pointer'; p.addEventListener('click',()=>openSurah(s.slug));
        row.appendChild(p);
      });
    }
    const doneCount=window.SURAH_INDEX.filter(s=>QStore.get('done:'+s.slug)==='1').length;
    const gp=document.getElementById('gpCount');
    if(gp)gp.textContent = lang==='ar'
      ? `أتممتَ ${doneCount} من ${window.SURAH_INDEX.length} سور — كل سورة تزرع شجرة!`
      : `You finished ${doneCount}/${window.SURAH_INDEX.length} surahs — each grows a tree!`;
  }

  /* ───── confetti / toast ───── */
  function confetti(){const r=document.getElementById('confetti');if(!r)return;
    const cols=['#1A9B7B','#E8A82F','#EC6A8C','#5BB8E8','#FFD56B','#7CC576'];
    for(let i=0;i<54;i++){const p=el('div','cf-piece');p.style.left=Math.random()*100+'%';
      p.style.background=cols[Math.floor(Math.random()*cols.length)];
      p.style.animationDelay=(Math.random()*.6)+'s';p.style.animationDuration=(1.7+Math.random()*1.4)+'s';
      p.style.width=(6+Math.random()*8)+'px';p.style.height=(10+Math.random()*9)+'px';
      r.appendChild(p);setTimeout(()=>p.remove(),3600);}}
  let tT;
  function toast(m,t){const e=document.getElementById('toast');if(!e)return;e.textContent=m;
    e.className='toast show '+(t||'');clearTimeout(tT);tT=setTimeout(()=>e.classList.remove('show'),2400);}

  /* ───── OPEN SURAH (book) ───── */
  function openSurah(slug){
    cur=slug;
    const s=window.SURAH_INDEX.find(x=>x.slug===slug);
    const d=window.SURAHS[slug];
    document.body.classList.add('reading');
    location.hash='#'+slug;
    document.getElementById('rNm').textContent = lang==='ar'?s.nameAr:s.nameEn;
    document.getElementById('rMt').textContent = lang==='ar'?s.metaAr:s.metaEn;
    const book=document.getElementById('book');
    book.style.animation='none'; void book.offsetWidth; book.style.animation='';
    renderBook(s,d);
    window.scrollTo({top:0});
  }
  function closeSurah(){cur=null;document.body.classList.remove('reading');location.hash='';}
  function navSurah(dir){const list=window.SURAH_INDEX;let i=list.findIndex(x=>x.slug===cur);
    if(i<0)return;i=(i+dir+list.length)%list.length;openSurah(list[i].slug);}

  /* ───── RENDER BOOK ───── */
  function renderBook(s,d){
    const book=document.getElementById('book');
    book.innerHTML='';
    // scene header
    const scene=el('div','b-scene');
    scene.innerHTML=`<div class="s-sun"></div>
      <div class="s-tree" style="inset-inline-start:14px">🌳</div>
      <div class="s-tree" style="inset-inline-end:16px;font-size:1.2rem">🌴</div>
      <div class="s-emoji">${s.emoji}</div><div class="s-hill"></div>
      <button class="b-listen" title="استمع">▶</button>
      <span class="b-pg">${lang==='ar'?'سورة':'#'} ${s.num}</span>`;
    scene.querySelector('.b-listen').addEventListener('click',()=>toast(lang==='ar'?'🎧 التلاوة قريباً بإذن الله':'🎧 Recitation coming soon',''));
    book.appendChild(scene);
    // crest
    const crest=el('div','b-crest');
    crest.innerHTML=`<div class="arch quran-ar">${lang==='ar'?s.nameAr:s.nameEn}</div>
      <div class="mt">${lang==='ar'?s.metaAr:s.metaEn}${d&&d.tagline?' · '+tr(d.tagline):''}</div>`;
    book.appendChild(crest);
    if(!d){ book.appendChild(el('div','b-body','<div style="text-align:center;padding:2rem;color:#9A8B6C">قريباً</div>')); return; }

    // tabs
    const TABS=[
      {id:'verses', em:'📖', ar:'الآيات', en:'Verses'},
      {id:'tafsir', em:'🌱', ar:'تفسير الصغار', en:'Kids Tafsir'},
      {id:'tadabbur', em:'🏮', ar:'تدبّر', en:'Reflect'},
      {id:'story', em:'📜', ar:'قصة السورة', en:'The Story'},
      {id:'game', em:'🎯', ar:'لعبة', en:'Game'},
      {id:'lesson', em:'💡', ar:'الدرس', en:'Lesson'},
    ];
    const tabs=el('div','b-tabs');
    const body=el('div','b-body');
    TABS.forEach((t,i)=>{
      const b=el('button','b-tab'+(i===0?' active':''));
      b.innerHTML=`<span>${t.em}</span><span>${lang==='ar'?t.ar:t.en}</span>`;
      b.addEventListener('click',()=>{
        tabs.querySelectorAll('.b-tab').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        body.querySelectorAll('.b-pane').forEach(p=>p.classList.remove('active'));
        body.querySelector('#pane-'+t.id).classList.add('active');
      });
      tabs.appendChild(b);
    });
    book.appendChild(tabs); book.appendChild(body);

    body.appendChild(paneVerses(s,d));
    body.appendChild(paneTafsir(d));
    body.appendChild(paneTadabbur(d));
    body.appendChild(paneStory(d));
    body.appendChild(paneGame(s,d));
    body.appendChild(paneLesson(s,d));
  }

  /* ── verses pane ── */
  function paneVerses(s,d){
    const pane=el('div','b-pane active'); pane.id='pane-verses';
    const frame=el('div','v-frame');
    frame.innerHTML='<span class="v-corner tl"></span><span class="v-corner tr"></span><span class="v-corner bl"></span><span class="v-corner br"></span>';
    const pop=el('div','word-pop'); pop.style.display='none';
    if(d.bismillah!==false){
      const b=el('div','ayah quran-ar basmalah');
      b.textContent='بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
      frame.appendChild(b);
    }
    const flow=el('div','ayah-flow quran-ar');
    d.verses.forEach((v,vi)=>{
      const a=flow;
      // build words: if v.words present, wrap matched tokens
      const tokens=v.ar.split(' ');
      const wordMap={};
      (v.words||[]).forEach(w=>{ wordMap[w.w]=w.m; });
      tokens.forEach((tok,ti)=>{
        const clean=tok;
        const span=el('span','w'+(wordMap[clean]?' has':''));
        span.textContent=clean;
        if(wordMap[clean]){
          span.addEventListener('click',()=>{
            frame.querySelectorAll('.w.lit').forEach(x=>x.classList.remove('lit'));
            span.classList.add('lit');
            pop.style.display='';
            pop.innerHTML=`✋ <b>${clean}</b> = ${tr(wordMap[clean])}`;
            // sparkle
            const r=span.getBoundingClientRect(),fr=frame.getBoundingClientRect();
            ['✨','⭐'].forEach((sp,k)=>{const e=el('span','k-sparkle',sp);
              e.style.left=(r.left-fr.left+r.width/2)+'px';e.style.top=(r.top-fr.top)+'px';
              e.style.setProperty('--dx',(k?22:-22)+'px');e.style.setProperty('--dy','-26px');
              frame.appendChild(e);setTimeout(()=>e.remove(),800);});
          });
        }
        a.appendChild(span);
        a.appendChild(document.createTextNode(' '));
      });
      const num=el('span','num',toArabicNum(vi+1)); a.appendChild(num);
      a.appendChild(document.createTextNode(' '));
    });
    frame.appendChild(flow);
    pane.appendChild(frame);
    pane.appendChild(pop);
    pane.appendChild(el('div','v-hint','👆 '+(lang==='ar'?'اضغط الكلمات المُبرَزة لتعرف معناها':'Tap highlighted words for their meaning')));
    // full translation
    const trans=el('div','v-trans');
    trans.innerHTML='🗣️ <b>'+(lang==='ar'?'المعنى الإجمالي: ':'Meaning: ')+'</b>'+d.verses.map(v=>tr(v.trans)).join(' ');
    pane.appendChild(trans);
    // memorize meter
    pane.appendChild(memMeter(s,d));
    return pane;
  }

  function memMeter(s,d){
    const wrap=el('div','mem-meter');
    const saved=(QStore.get('mem:'+s.slug)||'').split('');
    wrap.innerHTML=`<div class="mm-top"><b>📖 ${lang==='ar'?'عدّاد الحفظ':'Memorize meter'}</b><span id="memN">0/${d.verses.length}</span></div>`;
    d.verses.forEach((v,i)=>{
      const id='mem-'+s.slug+'-'+i;
      const row=el('label','mem-check');
      row.innerHTML=`<input type="checkbox" id="${id}"> ${lang==='ar'?'آية':'Ayah'} ${toArabicNum(i+1)}`;
      const cb=row.querySelector('input');
      if(saved[i]==='1')cb.checked=true;
      cb.addEventListener('change',()=>{
        const arr=d.verses.map((_,j)=>wrap.querySelectorAll('input')[j].checked?'1':'0');
        QStore.set('mem:'+s.slug,arr.join(''));
        wrap.querySelector('#memN').textContent=arr.filter(x=>x==='1').length+'/'+d.verses.length;
        buildGarden();
      });
      wrap.appendChild(row);
    });
    setTimeout(()=>{const n=saved.filter(x=>x==='1').length;const e=wrap.querySelector('#memN');if(e)e.textContent=n+'/'+d.verses.length;},0);
    return wrap;
  }

  /* ── tafsir pane ── */
  function paneTafsir(d){
    const pane=el('div','b-pane'); pane.id='pane-tafsir';
    (d.tafsir||[]).forEach((t,i)=>{
      const c=el('div','tafsir-card');
      c.innerHTML=`${t.ayah?`<span class="tc-num">${lang==='ar'?'آية':'Ayah'} ${tr(t.ayah)}</span>`:''}<p>${tr(t)}</p>`;
      pane.appendChild(c);
    });
    return pane;
  }

  /* ── tadabbur pane ── */
  function paneTadabbur(d){
    const pane=el('div','b-pane'); pane.id='pane-tadabbur';
    pane.appendChild(el('div','game-q','🏮 '+(lang==='ar'?'اضغط الفانوس لتتدبّر':'Tap the lantern to reflect')));
    (d.tadabbur||[]).forEach(t=>{
      const c=el('div','tad-card');
      c.innerHTML=`<div class="tad-q"><span class="lamp">🏮</span><span>${tr(t.q)}</span></div><div class="tad-a">${tr(t.a)}</div>`;
      c.addEventListener('click',()=>c.classList.toggle('lit'));
      pane.appendChild(c);
    });
    return pane;
  }

  /* ── story pane ── */
  function paneStory(d){
    const pane=el('div','b-pane story-pane'); pane.id='pane-story';
    const st=d.story||{pages:[]};
    let idx=0;
    const scene=el('div','sp-scene','<span class="big">'+(st.emoji||'📜')+'</span>');
    const numEl=el('div','sp-page-num','');
    const txt=el('div','sp-text','');
    const nav=el('div','sp-nav');
    const prev=el('button','',lang==='ar'?'‹ السابقة':'‹ Prev');
    const next=el('button','primary',lang==='ar'?'التالية ›':'Next ›');
    function show(){
      const p=st.pages[idx]||{};
      numEl.textContent=(lang==='ar'?'صفحة':'Page')+' '+(idx+1)+'/'+st.pages.length;
      txt.innerHTML=tr(p.text);
      if(p.emoji)scene.innerHTML='<span class="big">'+p.emoji+'</span>';
      prev.disabled=idx===0;
      next.textContent= idx>=st.pages.length-1 ? (lang==='ar'?'✓ تمت':'✓ Done') : (lang==='ar'?'التالية ›':'Next ›');
    }
    prev.addEventListener('click',()=>{if(idx>0){idx--;show();}});
    next.addEventListener('click',()=>{if(idx<st.pages.length-1){idx++;show();}});
    nav.appendChild(prev);nav.appendChild(next);
    if(st.title){const h=el('div','game-q','📜 '+tr(st.title));pane.appendChild(h);}
    pane.appendChild(scene);pane.appendChild(numEl);pane.appendChild(txt);pane.appendChild(nav);
    show();
    return pane;
  }

  /* ── game pane ── */
  function paneGame(s,d){
    const pane=el('div','b-pane'); pane.id='pane-game';
    const g=d.game;
    if(!g){pane.innerHTML='<div style="text-align:center;color:#9A8B6C;padding:1rem">قريباً</div>';return pane;}
    if(g.kind==='order') gameOrder(pane,s,g);
    else if(g.kind==='mcq') gameMcq(pane,s,g);
    return pane;
  }
  function fb(host,m,ok){let f=host.querySelector('.game-fb');if(!f){f=el('div','game-fb');host.appendChild(f);}
    f.style.color=ok?'#137a60':'#C62828';f.textContent=m;}
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  function gameOrder(pane,s,g){
    pane.appendChild(el('div','game-q','🧩 '+tr(g.prompt||{ar:'رتّب كلمات الآية',en:'Put the verse in order'})));
    const target=(g.words||[]);
    const built=el('div','order-built');
    const tray=el('div','order-tray');
    const placed=[];
    let order=shuffle(target.map((w,i)=>({w,i})));
    if(target.length>1 && order.map(o=>o.i).join()===target.map((_,i)=>i).join())order=shuffle(order);
    function refresh(){built.innerHTML='';placed.forEach(p=>{const t=el('span','order-tile quran-ar',p.w);built.appendChild(t);});built.classList.toggle('filled',placed.length>0);}
    function check(){if(placed.length!==target.length)return;
      const ok=placed.every((p,i)=>p.w===target[i]);
      if(ok){tray.querySelectorAll('button').forEach(b=>b.disabled=true);
        if(QStore.get('game:'+s.slug)!=='1'){QStore.set('game:'+s.slug,'1');}
        fb(pane,lang==='ar'?'✓ أحسنت! ترتيب صحيح':'✓ Correct order!',true);maybeComplete(s);}
      else{fb(pane,lang==='ar'?'✗ ليس بعد — اضغط كلمة لإزالتها':'✗ Not yet — tap to remove',false);}}
    order.forEach(o=>{const b=el('button','order-tile quran-ar',o.w);
      b.addEventListener('click',()=>{if(b.disabled)return;b.disabled=true;b.classList.add('used');placed.push(o);refresh();check();});
      tray.appendChild(b);});
    built.addEventListener('click',()=>{if(!placed.length)return;const last=placed.pop();
      [...tray.children].find(c=>c.textContent===last.w&&c.disabled).disabled=false;
      [...tray.children].find(c=>c.classList.contains('used')&&c.textContent===last.w)?.classList.remove('used');refresh();});
    const reset=el('button','order-reset',lang==='ar'?'🔄 إعادة':'🔄 Reset');
    reset.addEventListener('click',()=>{placed.length=0;tray.querySelectorAll('button').forEach(b=>{b.disabled=false;b.classList.remove('used');});refresh();fb(pane,'',true);});
    pane.appendChild(built);pane.appendChild(tray);pane.appendChild(reset);
    refresh();
  }
  function gameMcq(pane,s,g){
    (g.items||[]).forEach((it,qi)=>{
      const m=el('div','q-mcq');
      m.appendChild(el('div','game-q','🎯 '+tr(it.q)));
      const letters=lang==='ar'?['أ','ب','ج','د']:['A','B','C','D'];
      it.opts.forEach((o,j)=>{
        const b=el('button','q-opt');
        b.innerHTML=`<span class="lt">${letters[j]}</span><span>${tr(o.t)}</span>`;
        b.addEventListener('click',()=>{if(m.dataset.done)return;
          if(o.c){b.classList.add('ok');m.dataset.done='1';[...m.querySelectorAll('.q-opt')].forEach(x=>x.disabled=true);
            fb(pane,lang==='ar'?'✓ صحيح!':'✓ Correct!',true);
            if([...pane.querySelectorAll('.q-mcq')].every(x=>x.dataset.done)){QStore.set('game:'+s.slug,'1');maybeComplete(s);}}
          else{b.classList.add('bad');b.disabled=true;fb(pane,lang==='ar'?'✗ حاول ثانية':'✗ Try again',false);}});
        m.appendChild(b);
      });
      pane.appendChild(m);
    });
  }

  /* ── lesson pane ── */
  function paneLesson(s,d){
    const pane=el('div','b-pane'); pane.id='pane-lesson';
    if(d.lesson){
      const c=el('div','lesson-card');
      c.innerHTML=`<div class="lc-h">${lang==='ar'?'درس أعيشه اليوم':'A lesson I live today'}</div><div class="lc-t">${tr(d.lesson)}</div>`;
      pane.appendChild(c);
    }
    if(d.action){const a=el('div','lesson-do','✅ '+tr(d.action));pane.appendChild(a);}
    const done=QStore.get('done:'+s.slug)==='1';
    const cta=el('button','complete-cta'+(done?' done':''));
    cta.textContent=done?(lang==='ar'?'✓ أتممتَ هذه السورة — أحسنت!':'✓ Surah completed — well done!')
      :(lang==='ar'?'🌟 أتممتُ هذه السورة':'🌟 I completed this surah');
    cta.addEventListener('click',()=>{if(done)return;QStore.set('done:'+s.slug,'1');confetti();
      toast(lang==='ar'?'🎉 مبارك! نمت شجرة جديدة في بستانك':'🎉 A new tree grew in your garden!','success');
      buildGarden();renderBook(s,d);
      // jump to lesson tab
      setTimeout(()=>{document.querySelectorAll('.b-tab')[5]?.click();},50);});
    pane.appendChild(cta);
    // footer nav
    const nav=el('div','sp-nav');nav.style.marginTop='1rem';
    const prev=el('button','',lang==='ar'?'← السابقة':'← Prev');
    const next=el('button','primary',lang==='ar'?'التالية →':'Next →');
    prev.addEventListener('click',()=>navSurah(-1));next.addEventListener('click',()=>navSurah(1));
    nav.appendChild(prev);nav.appendChild(next);pane.appendChild(nav);
    return pane;
  }

  function maybeComplete(s){ /* hook for future auto-complete logic */ }

  /* helpers */
  function toArabicNum(n){ if(lang!=='ar')return String(n);
    return String(n).replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]); }

  /* ───── init ───── */
  function init(){
    document.querySelectorAll('.q-lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
    setLang(lang);
    document.getElementById('rBack').addEventListener('click',closeSurah);
    document.getElementById('rPrev').addEventListener('click',()=>navSurah(-1));
    document.getElementById('rNext').addEventListener('click',()=>navSurah(1));
    const h=(location.hash||'').replace('#','');
    if(h&&window.SURAHS[h])openSurah(h);
    window.addEventListener('keydown',e=>{
      if(!cur)return;
      if(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;
      if(e.key==='Escape')closeSurah();
      if(e.key==='ArrowLeft')navSurah(lang==='ar'?1:-1);
      if(e.key==='ArrowRight')navSurah(lang==='ar'?-1:1);
    });
  }
  return{init,setLang,openSurah,closeSurah,navSurah,buildGarden,confetti,toast};
})();
document.addEventListener('DOMContentLoaded',()=>QApp.init());
