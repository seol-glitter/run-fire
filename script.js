
const app = document.getElementById('app');
const okSound = document.getElementById('okSound');

let state = { step: 1, solved1:false, solved2:false, solved3:false };

function clearApp(){
  app.innerHTML = '';
}

function makeNext(onClick){
  const box = document.createElement('div');
  box.className='top-ui';
  const btn = document.createElement('div');
  btn.className='next';
  btn.addEventListener('click', onClick);
  box.appendChild(btn);
  app.appendChild(box);
  return box;
}

function showRing(x,y,diameter){
  const ring = document.createElement('div');
  ring.className='ring';
  ring.style.width = diameter+'px';
  ring.style.height = diameter+'px';
  ring.style.left = (x - diameter/2) + 'px';
  ring.style.top = (y - diameter/2) + 'px';
  app.appendChild(ring);
  return ring; // persistent (지우지 않음)
}

/** 1단계: 낮은자세 배경 + 전체 네모 클릭 */
function step1(){
  clearApp();
  state.step = 1;

  const stage = document.createElement('div');
  stage.className='stage';
  app.appendChild(stage);

  const img = document.createElement('img');
  img.src = 'assets/낮은자세.png';
  img.className='img-fit';
  stage.appendChild(img);

  const nextBox = makeNext(step2);
  function placeOverlay(){
    // overlay 크기 = 낮은자세 그림 이미지 박스 (파일명 '낮은자세 그림.png')와 동일한 비율 가정 -> 실제 클릭 영역은 표시된 낮은자세 전체로 지정
    const rect = img.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }
  const overlay = document.createElement('div');
  overlay.className='click-overlay';
  app.appendChild(overlay);

  function handleClick(e){
    if(state.solved1) return;
    state.solved1 = true;
    okSound.currentTime = 0; okSound.play();
    const rect = img.getBoundingClientRect();
    // 원 크기 = 그림 너비의 55%
    const dia = rect.width * 0.55;
    const cx = rect.left + rect.width*0.45;
    const cy = rect.top + rect.height*0.6;
    showRing(cx, cy, dia); // 지속
    nextBox.style.display='block';
    overlay.style.pointerEvents='none'; // 재클릭 방지
  }
  overlay.addEventListener('click', handleClick);
  window.addEventListener('resize', placeOverlay);
  img.addEventListener('load', placeOverlay);
  placeOverlay();

  // 안내
  const hint = document.createElement('div');
  hint.className='hint';
  hint.textContent = '낮은 자세 그림을 눌러 보세요.';
  app.appendChild(hint);
}

/** 2단계: 빈화면 + 낮은자세그림(좌) + 젖은수건 드래그(우) + 드롭 성공시 정답 수건 표시(작게, 좌표 미세조정) */
function step2(){
  clearApp();
  state.step = 2;

  const stage = document.createElement('div');
  stage.className='stage';
  app.appendChild(stage);

  const row = document.createElement('div');
  row.className='row';
  stage.appendChild(row);

  const left = document.createElement('div');
  left.className='leftPanel';
  row.appendChild(left);

  const right = document.createElement('div');
  right.className='rightPanel';
  row.appendChild(right);

  const pose = document.createElement('img');
  pose.src='assets/낮은자세 그림.png';
  pose.className='img-fit';
  left.appendChild(pose);

  const towel = document.createElement('img');
  towel.src='assets/젖은수건이미지.png';
  towel.className='drag';
  right.appendChild(towel);

  // 시작 위치 저장
  let start = {x:0,y:0, left:0, top:0};
  function positionTowel(){
    const r = right.getBoundingClientRect();
    const w = Math.min(r.width*0.5, 380);
    towel.style.width = w + 'px';
    towel.style.left = (r.right - w - 10) + 'px';
    towel.style.top = (r.top + r.height*0.4 - w*0.5) + 'px';
  }

  function onPointerDown(ev){
    ev.preventDefault();
    const rect = towel.getBoundingClientRect();
    start.x = ev.clientX; start.y = ev.clientY;
    start.left = rect.left; start.top = rect.top;
    towel.setPointerCapture(ev.pointerId);
    towel.addEventListener('pointermove', onPointerMove);
    towel.addEventListener('pointerup', onPointerUp, {once:true});
  }
  function onPointerMove(ev){
    const dx = ev.clientX - start.x;
    const dy = ev.clientY - start.y;
    towel.style.left = (start.left + dx) + 'px';
    towel.style.top  = (start.top  + dy) + 'px';
  }

  // 드롭 성공 시 나타날 정답 이미지(크기 60% 적용 + 위치 미세조정)
  const okImg = document.createElement('img');
  okImg.src = 'assets/젖은수건정답이미지.png';
  okImg.className='answer-img';
  app.appendChild(okImg);

  function placeOkImage(){
    const r = pose.getBoundingClientRect();
    // 기준: 낮은자세그림 폭을 기준으로 비율 적용
    const scale = 0.60; // 요청: 현재 면적의 60% → 폭 기준 0.6배
    const width = r.width * 0.35 * scale; // 기본폭 35% 추정 후 스케일
    okImg.style.width = width + 'px';
    // 코/입 위치 대략 비율
    const anchorX = r.left + r.width * 0.38; // 왼쪽으로 조금
    const anchorY = r.top  + r.height* 0.48; // 아래로 약간
    // 미세조정 오프셋(px) - 좌측, 하단으로 조금 이동
    const offX = -10;
    const offY =  15;
    okImg.style.left = (anchorX + offX) + 'px';
    okImg.style.top  = (anchorY + offY) + 'px';
  }

  function onPointerUp(ev){
    towel.removeEventListener('pointermove', onPointerMove);
    const poseRect = pose.getBoundingClientRect();
    const tw = towel.getBoundingClientRect();
    const centerX = tw.left + tw.width/2;
    const centerY = tw.top  + tw.height/2;
    const inside = (
      centerX >= poseRect.left && centerX <= poseRect.right &&
      centerY >= poseRect.top  && centerY <= poseRect.bottom
    );
    if(inside && !state.solved2){
      state.solved2 = true;
      okSound.currentTime=0; okSound.play();
      // 정답 이미지 보이기(위치/크기 계산)
      placeOkImage();
      okImg.style.display='block';
      // 수건 드래그 원본은 사라짐
      towel.style.display='none';
      nextBox.style.display='block';
    }
  }

  towel.addEventListener('pointerdown', onPointerDown);

  const nextBox = makeNext(step3);
  function onResize(){
    positionTowel();
    if(state.solved2){
      placeOkImage();
    }
  }
  window.addEventListener('resize', onResize);
  positionTowel();

  const hint = document.createElement('div');
  hint.className='hint';
  hint.textContent = '수건을 낮은 자세 그림 위에 드롭하면 정답! (드롭 후 수건은 사라져요)';
  app.appendChild(hint);
}

/** 3단계: 계단/엘베 배경, 계단 영역 클릭 → 원 고정 */
function step3(){
  clearApp();
  state.step = 3;

  const stage = document.createElement('div');
  stage.className='stage';
  app.appendChild(stage);

  const bg = document.createElement('img');
  bg.src='assets/대피하기_계단_엘베.png';
  bg.className='img-fit';
  stage.appendChild(bg);

  const nextBox = makeNext(()=>{
    // 마지막 단계: 모두 정답 안내만
    alert('모두 정답입니다! 수고했어요 👍');
  });

  const overlay = document.createElement('div');
  overlay.className='click-overlay';
  app.appendChild(overlay);

  function placeOverlay(){
    const r = bg.getBoundingClientRect();
    // 계단은 이미지의 오른쪽 영역으로 가정 (비율로 지정)
    const left = r.left + r.width*0.58;
    const top  = r.top  + r.height*0.08;
    const w    = r.width*0.35;
    const h    = r.height*0.80;
    overlay.style.left = left+'px';
    overlay.style.top = top+'px';
    overlay.style.width = w+'px';
    overlay.style.height = h+'px';
  }
  function handleClick(e){
    if(state.solved3) return;
    state.solved3 = true;
    okSound.currentTime=0; okSound.play();
    const r = overlay.getBoundingClientRect();
    const cx = r.left + r.width*0.5;
    const cy = r.top  + r.height*0.5;
    const dia = Math.min(r.width, r.height) * 0.8;
    showRing(cx, cy, dia); // 고정
    nextBox.style.display='block';
    overlay.style.pointerEvents='none';
    // 모두 정답 메시지
    setTimeout(()=>{
      alert('모두 정답입니다!');
    }, 200);
  }

  overlay.addEventListener('click', handleClick);
  window.addEventListener('resize', placeOverlay);
  bg.addEventListener('load', placeOverlay);
  placeOverlay();

  const hint = document.createElement('div');
  hint.className='hint';
  hint.textContent = '계단을 선택해보세요.';
  app.appendChild(hint);
}

function init(){
  step1();
}
init();
