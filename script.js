(()=>{
  const cb = `cb=${Date.now()}`;        // cache-bust
  const A = (p)=> encodeURI(`./assets/${p}`) + `?${cb}`;

  const stage = document.getElementById('stage');
  const nextBtn = document.getElementById('nextBtn');
  const toast = document.getElementById('toast');

  let step=1;

  const showToast=(msg)=>{ toast.textContent = msg; };

  // ------- reusable helpers -------
  const mk = (tag,cls)=>{ const el=document.createElement(tag); if(cls) el.className=cls; return el; };
  const placeCircle=(parent, x,y, d)=>{
    const c = mk('div','circle persist');
    c.style.width = c.style.height = d+'px';
    c.style.left = (x-d/2)+'px';
    c.style.top  = (y-d/2)+'px';
    parent.appendChild(c);
    return c;
  };

  const clearStage=()=>{ stage.innerHTML=''; nextBtn.classList.add('hidden'); };

  nextBtn.addEventListener('click', ()=>{ step++; render(); });

  function render(){
    clearStage();
    if(step===1) renderStep1();
    else if(step===2) renderStep2();
    else renderStep3();
  }

  // ----------------- STEP 1 -----------------
  function renderStep1(){
    const sc = mk('div','scene'); stage.appendChild(sc);
    const bg = mk('img','full'); bg.alt='배경'; bg.src=A('빈화면.png'); sc.appendChild(bg);

    const low = mk('img','center'); low.id='low1'; low.src=A('낮은자세.png'); low.alt='낮은 자세'; sc.appendChild(low);

    // 클릭 가능한 영역 = '낮은자세 그림' 이미지 박스 전체
    const hit = mk('img','center'); hit.id='hit1'; hit.src=A('낮은자세 그림.png'); hit.style.opacity='0'; sc.appendChild(hit);

    let solved=false;
    hit.addEventListener('load',()=>{
      // position circle roughly to image center, sized to the hit box
      const r = hit.getBoundingClientRect();
      const s = sc.getBoundingClientRect();
      const d = Math.min(r.width, r.height)*0.82;
      const x = r.left - s.left + r.width/2;
      const y = r.top  - s.top  + r.height/2;
      hit.addEventListener('click',()=>{
        if(solved) return;
        solved=true;
        placeCircle(sc, x, y, d);
        nextBtn.classList.remove('hidden');
      }, {once:true});
    });
  }

  // ----------------- STEP 2 -----------------
  function renderStep2(){
    const sc = mk('div','scene'); stage.appendChild(sc);
    const bg = mk('img','full'); bg.src=A('빈화면.png'); sc.appendChild(bg);

    // 낮은자세 그림(투명 hit + 시각용 이미지)
    const pose = mk('img'); pose.id='pose2'; pose.src=A('낮은자세 그림.png'); pose.alt='낮은자세 그림'; sc.appendChild(pose);

    // 드래그할 젖은수건
    const towel = mk('img'); towel.id='towel'; towel.src=A('젖은수건이미지.png'); towel.alt='젖은수건'; sc.appendChild(towel);

    // 드롭 성공 시 보일 정답 수건 (크기 60% + 좌표 보정)
    const cloth = mk('img'); cloth.id='successCloth'; cloth.src=A('젖은수건정답이미지.png'); sc.appendChild(cloth);

    // ---- parameters you asked (60% & offset left 2칸, up 1.5칸 느낌) ----
    const SCALE = 0.60;
    const OFF_X_RATIO = -0.055;  // 왼쪽으로 5.5%
    const OFF_Y_RATIO = -0.040;  // 위로 4%
    // ---------------------------------------------------------------

    function layoutCloth(){
      const r = pose.getBoundingClientRect();
      cloth.style.display='block';
      cloth.style.transform = `scale(${SCALE})`;
      // 기준점을 왼쪽-가운데 쯤으로 가정
      const x = r.left + r.width*0.44 + r.width*OFF_X_RATIO;
      const y = r.top  + r.height*0.58 + r.height*OFF_Y_RATIO;
      const scR = sc.getBoundingClientRect();
      cloth.style.left = (x - scR.left) + 'px';
      cloth.style.top  = (y - scR.top ) + 'px';
    }

    // 드롭존 = 낮은자세 그림 전체
    let solved=false;

    // basic pointer-drag
    let sx=0, sy=0, ox=0, oy=0;
    const start = (e)=>{
      const p = (e.touches? e.touches[0]:e);
      sx=p.clientX; sy=p.clientY;
      const r=towel.getBoundingClientRect();
      const s=sc.getBoundingClientRect();
      ox=r.left-s.left; oy=r.top-s.top;
      towel.classList.add('dragging');
      e.preventDefault();
    };
    const move = (e)=>{
      if(!towel.classList.contains('dragging')) return;
      const p = (e.touches? e.touches[0]:e);
      const dx=p.clientX-sx, dy=p.clientY-sy;
      towel.style.left = (ox+dx)+'px';
      towel.style.top  = (oy+dy)+'px';
    };
    const end = ()=>{
      if(!towel.classList.contains('dragging')) return;
      towel.classList.remove('dragging');
      // hit test
      const a = towel.getBoundingClientRect();
      const b = pose.getBoundingClientRect();
      const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      if(overlap && !solved){
        solved=true;
        towel.remove();            // 수건 사라짐
        layoutCloth();             // 정답 수건 표시
        nextBtn.classList.remove('hidden');
      }
    };
    towel.addEventListener('mousedown',start);
    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',end);
    towel.addEventListener('touchstart',start,{passive:false});
    window.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('touchend',end);

    // 반응형 재배치
    window.addEventListener('resize',()=>{ if(solved) layoutCloth(); });
  }

  // ----------------- STEP 3 -----------------
  function renderStep3(){
    const sc = mk('div','scene'); stage.appendChild(sc);
    const bg = mk('img','full'); bg.src=A('대피하기_계단_엘베.png'); sc.appendChild(bg);

    // 클릭존 = 계단 네모 전체(오른쪽 패널) 추정값
    const hit = mk('div'); hit.style.position='absolute'; hit.style.right='10%'; hit.style.top='12%'; hit.style.width='28%'; hit.style.height='68%'; hit.style.cursor='pointer'; hit.style.background='transparent'; sc.appendChild(hit);

    let done=false;
    hit.addEventListener('click',(e)=>{
      if(done) return;
      done=true;
      const r = hit.getBoundingClientRect();
      const s = sc.getBoundingClientRect();
      const x = (r.left+s.left)/2 - s.left + r.width/2;
      const y = r.top - s.top + r.height/2;
      const d = Math.min(r.width,r.height)*0.9;
      placeCircle(sc, x,y,d);
      showToast('모두 정답입니다!');
    },{once:true});
  }

  render();
})();