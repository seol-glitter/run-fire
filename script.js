// Hotfix script with robust asset loading and only Stage 2 success overlay adjustment
(function(){
  const v = 'hotfix7';
  const BASES = ['assets/', '']; // try assets/ first, then root
  const A = {
    step1_bg: '빈화면.png',
    step1_left: '낮은자세.png',
    step1_click: '낮은자세 그림.png',

    step2_bg: '빈화면.png',
    step2_pose: '낮은자세 그림.png',
    step2_cloth: '젖은수건이미지.png',
    step2_success: '젖은수건정답이미지.png',

    step3_bg: '대피하기_계단_엘베.png',

    arrow: '화살표.png',
    ok: '정답sound.wav'
  };

  const app = document.getElementById('app');
  const stage = document.getElementById('stage');
  const loadingEl = document.getElementById('loading');
  const okAudio = document.getElementById('okSound');

  function urlFor(name){
    // try multiple bases, return the first that loads
    const enc = encodeURI(name);
    const tries = BASES.map(b => `${b}${enc}`);
    return tries;
  }

  function preload(list, cb){
    let remain = list.length, anyLoaded=false, errors=[];
    const resolved = {};
    list.forEach(key=>{
      const candidates = urlFor(A[key]);
      let i=0, done=false;
      (function tryNext(){
        if(i>=candidates.length){
          errors.push({key, tried:candidates});
          check(); return;
        }
        const u = candidates[i] + `?v=${v}`;
        const img = new Image();
        img.onload = ()=>{ if(!done){ done=true; anyLoaded=true; resolved[key]=u; check(); } };
        img.onerror = ()=>{ i++; tryNext(); };
        img.src = u;
      })();
    });
    function check(){
      remain--;
      if(remain<=0){
        if(!anyLoaded && errors.length){
          showFatal(errors);
        } else {
          cb(resolved, errors);
        }
      }
    }
  }

  function showFatal(errors){
    stage.innerHTML = '';
    const box = document.createElement('div');
    box.style.cssText='position:absolute;inset:10% 10%;background:#fff;border-radius:14px;padding:20px;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.15)';
    box.innerHTML = `<h2>리소스 경로 문제</h2>
      <p>아래 항목의 파일을 찾지 못했습니다. 리포지토리에 <b>assets</b> 폴더가 있고 파일명이 정확한지 확인해주세요.</p>
      <pre style="white-space:pre-wrap;font-size:13px;background:#f6f6f6;padding:10px;border-radius:8px;max-height:60vh;overflow:auto;">${errors.map(e=>`${e.key} → ${A[e.key]}\n시도한 경로:\n- ${e.tried.join('\n- ')}`).join('\n\n')}</pre>`;
    stage.appendChild(box);
    loadingEl.textContent = '로드 실패';
  }

  function nextArrow(onClick){
    const a = document.createElement('button');
    a.className = 'arrow';
    a.addEventListener('click', onClick, {once:true});
    stage.appendChild(a);
  }

  function showCircle(x,y,r){
    const c = document.createElement('div');
    c.className='circle';
    c.style.width = c.style.height = (r*2)+'px';
    c.style.left = (x-r)+'px';
    c.style.top = (y-r)+'px';
    stage.appendChild(c);
    return c;
  }

  function px(n){ return Math.round(n) + 'px'; }

  // ---------- Stage implementations ----------
  function stage1(R){
    loadingEl.classList.add('hidden');
    stage.innerHTML = '';

    const bg = document.createElement('div');
    bg.className='bg';
    bg.style.backgroundImage = `url('${R.step1_bg}')`;
    stage.appendChild(bg);

    // Two cards
    const left = document.createElement('div');
    left.className='card';
    left.style.backgroundImage = `url('${R.step1_left}')`;
    stage.appendChild(left);

    const right = document.createElement('div');
    right.className='card right';
    right.style.backgroundImage = `url('${R.step1_left.replace(encodeURI('낮은자세.png'), encodeURI('낮은자세.png'))}')`; // placeholder same style image
    stage.appendChild(right);

    // Click zone = whole left card
    left.style.cursor='pointer';
    left.addEventListener('click', ()=>{
      const rect = left.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const r = Math.min(rect.width, rect.height)*0.48;
      showCircle(cx,cy,r);
      try{ okAudio.currentTime=0; okAudio.play(); }catch(e){}
      // proceed
      nextArrow(()=>stage2(R));
    }, {once:true});

    // audio src resolve
    okAudio.src = urlFor(A.ok)[0] + `?v=${v}`;
  }

  function stage2(R){
    stage.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.id='dragWrap';

    const bg = document.createElement('div');
    bg.className='bg';
    bg.style.backgroundImage = `url('${R.step2_bg}')`;
    stage.appendChild(bg);

    const target = document.createElement('div');
    target.id='dragTarget';
    target.style.backgroundImage = `url('${R.step2_pose}')`;

    const drag = document.createElement('div');
    drag.id='dragItem';
    drag.style.backgroundImage = `url('${R.step2_cloth}')`;

    const success = document.createElement('div');
    success.id='successCloth';
    success.style.backgroundImage = `url('${R.step2_success}')`;
    success.style.display='none';

    wrap.appendChild(target);
    wrap.appendChild(drag);
    stage.appendChild(wrap);
    stage.appendChild(success);

    const hint = document.createElement('div');
    hint.className='hint';
    hint.textContent='수건을 낮은 자세 그림 위에 드롭하면 정답! (드롭 후 수건은 사라져요)';
    stage.appendChild(hint);

    // drag
    let dragging=false, sx=0, sy=0, ox=0, oy=0;
    drag.addEventListener('pointerdown', (e)=>{
      dragging=true; drag.setPointerCapture(e.pointerId);
      sx=e.clientX; sy=e.clientY;
      const r = drag.getBoundingClientRect();
      ox=r.left; oy=r.top;
      drag.style.cursor='grabbing';
    });
    window.addEventListener('pointermove',(e)=>{
      if(!dragging) return;
      const nx = ox + (e.clientX - sx);
      const ny = oy + (e.clientY - sy);
      drag.style.position='absolute';
      drag.style.left=px(nx); drag.style.top=px(ny);
    });
    window.addEventListener('pointerup',(e)=>{
      if(!dragging) return;
      dragging=false; drag.releasePointerCapture(e.pointerId);
      drag.style.cursor='grab';
      // hit test: whole target
      const tr = target.getBoundingClientRect();
      const dr = drag.getBoundingClientRect();
      const overlap = !(dr.right < tr.left || dr.left > tr.right || dr.bottom < tr.top || dr.top > tr.bottom);
      if(overlap){
        // success image placement relative to target
        const SCALE = 0.60;                 // requested 60%
        const OFF_X = -0.055;               // left by ~5.5% of target width
        const OFF_Y = -0.040;               // up by ~4% of target height
        const w = tr.width * SCALE;
        const h = w * (1.0);                // assume natural fits; keep square-ish
        success.style.width = px(w);
        success.style.height = px(h);
        success.style.left = px(tr.left + tr.width*0.50 + tr.width*OFF_X);
        success.style.top  = px(tr.top  + tr.height*0.54 + tr.height*OFF_Y);
        success.style.display='block';
        drag.style.display='none'; // remove draggable
        try{ okAudio.currentTime=0; okAudio.play(); }catch(e){}
        nextArrow(()=>stage3(R));
      } else {
        // snap back
        drag.style.left=''; drag.style.top=''; drag.style.position='relative';
      }
    });
  }

  function stage3(R){
    stage.innerHTML = '';
    const bg = document.createElement('div');
    bg.className='bg';
    bg.style.backgroundImage = `url('${R.step3_bg}')`;
    stage.appendChild(bg);

    // Clickable area = left half where stairs are
    const zone = document.createElement('div');
    zone.style.cssText='position:absolute;left:10vw;top:12vh;width:40vw;height:72vh;';
    zone.addEventListener('click', (e)=>{
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width*0.45;
      const cy = rect.top + rect.height*0.5;
      const r = Math.min(rect.width, rect.height)*0.35;
      showCircle(cx,cy,r);
      try{ okAudio.currentTime=0; okAudio.play(); }catch(e){}
      // no further steps
    }, {once:true});
    stage.appendChild(zone);
  }

  // boot
  preload(Object.keys(A), (resolved)=>{
    // merge resolved urls
    const R = {};
    Object.keys(A).forEach(k=> R[k] = resolved[k] || (urlFor(A[k])[0] + `?v=${v}`));
    okAudio.src = R.ok;
    stage1(R);
  });

})();