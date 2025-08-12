const $ = (sel, p=document)=>p.querySelector(sel);
const $$ = (sel, p=document)=>[...p.querySelectorAll(sel)];
const okSound = $("#okSound");

const ASSETS = {
  lowPosture: "assets/낮은자세.png",
  lowPanel: "assets/낮은자세 그림.png",
  blank: "assets/빈화면.png",
  stairs: "assets/대피하기_계단_엘베.png",
  towel: "assets/젖은수건이미지.png",
  towelOK: "assets/젖은수건정답이미지.png",
  arrow: "assets/화살표.png"
};

const config = window.GAME_CONFIG?.towelSuccess || { scale: .6, leftPct: 34, topPct: 56 };

function showStage(el){
  $$(".stage").forEach(s=>s.classList.remove("active"));
  el.classList.add("active");
}

// build DOM
const app = $("#app");
$("#loading")?.remove();

// ---- Stage 1 ----
const s1 = document.createElement("section");
s1.id="stage1"; s1.className="stage active";
s1.innerHTML = `
  <div class="card">
    <div class="panel left" id="s1Left"><img src="${ASSETS.lowPanel}" alt=""></div>
    <div class="panel right"><img src="${ASSETS.lowPosture}" alt=""></div>
    <img id="s1Next" class="arrow" src="${ASSETS.arrow}" alt="next">
    <div class="hint">낮은 자세 그림을 눌러 보세요.</div>
  </div>
`;
app.appendChild(s1);
const s1Left = $("#s1Left", s1);
const s1Next = $("#s1Next", s1);
let s1Done=false;
s1Left.addEventListener("click", ()=>{
  if (s1Done) return;
  s1Done=true;
  okSound.currentTime=0; okSound.play().catch(()=>{});
  // draw circle tightly around the left panel
  const rect = s1Left.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height)*0.9;
  const c = document.createElement("div");
  c.className="circle";
  Object.assign(c.style, {
    width: d+"px", height:d+"px",
    left: (rect.left + rect.width/2 - d/2) + "px",
    top:  (rect.top + rect.height/2 - d/2) + "px",
  });
  document.body.appendChild(c);
  s1Next.classList.add("show");
});
s1Next.addEventListener("click", ()=> showStage(s2));

// ---- Stage 2 ----
const s2 = document.createElement("section");
s2.id="stage2"; s2.className="stage";
s2.innerHTML = `
  <div class="card">
    <div class="board">
      <div class="leftZone" id="dropZone">
        <img class="bg" src="${ASSETS.lowPanel}" alt="">
        <img id="towelOK" class="towelSuccess" src="${ASSETS.towelOK}" alt="ok">
        <div class="dropMask" id="dropMask"></div>
      </div>
      <img id="towel" class="towelDrag" src="${ASSETS.towel}" alt="towel">
    </div>
    <img id="s2Next" class="arrow" src="${ASSETS.arrow}" alt="next">
    <div class="hint">수건을 낮은 자세 그림 위에 드롭하면 정답! (드롭 후 수건은 사라져요)</div>
  </div>
`;
app.appendChild(s2);

const dropZone = $("#dropZone", s2);
const dropMask = $("#dropMask", s2);
const towel = $("#towel", s2);
const towelOK = $("#towelOK", s2);
const s2Next = $("#s2Next", s2);
let dragging=false, dragOfs={x:0,y:0};

function onMove(e){
  if(!dragging) return;
  const pt = ("touches" in e)? e.touches[0]: e;
  towel.style.left = (pt.clientX - dragOfs.x) + "px";
  towel.style.top  = (pt.clientY - dragOfs.y) + "px";
}

towel.addEventListener("mousedown", startDrag);
towel.addEventListener("touchstart", startDrag, {passive:false});
function startDrag(e){
  e.preventDefault();
  const pt=("touches" in e)? e.touches[0]: e;
  const r=towel.getBoundingClientRect();
  dragOfs.x = pt.clientX - r.left;
  dragOfs.y = pt.clientY - r.top;
  towel.style.position="fixed";
  towel.style.zIndex=50;
  dragging=true;
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, {passive:false});
}

window.addEventListener("mouseup", endDrag);
window.addEventListener("touchend", endDrag);
function endDrag(){
  if(!dragging) return;
  dragging=false;
  window.removeEventListener("mousemove", onMove);
  window.removeEventListener("touchmove", onMove);
  // hit test: any overlap with dropZone rect
  const tz = dropZone.getBoundingClientRect();
  const tr = towel.getBoundingClientRect();
  const hit = !(tr.right<tz.left || tr.left>tz.right || tr.bottom<tz.top || tr.top>tz.bottom);
  if(hit){
    // success: hide towel, show overlay at configured position/scale
    towel.style.display="none";
    const scale = config.scale ?? .6;
    const leftPct = config.leftPct ?? 34;
    const topPct  = config.topPct ?? 56;
    towelOK.style.display="block";
    towelOK.style.transform = `translate(0,0) scale(${scale})`;
    // position relative to dropZone
    Object.assign(towelOK.style, {
      left: `${leftPct}%`,
      top: `${topPct}%`
    });
    okSound.currentTime=0; okSound.play().catch(()=>{});
    s2Next.classList.add("show");
    // disable further drag
    towel.draggable=false;
  }else{
    // snap back
    towel.removeAttribute("style");
    towel.classList.add("towelDrag");
  }
}

s2Next.addEventListener("click", ()=> showStage(s3));

// ---- Stage 3 ----
const s3 = document.createElement("section");
s3.id="stage3"; s3.className="stage";
s3.innerHTML = `
  <div class="card">
    <div class="panel" id="stairsPanel">
      <img src="${ASSETS.stairs}" alt="">
    </div>
    <img id="s3Next" class="arrow show" src="${ASSETS.arrow}" style="display:none" alt="end">
    <div id="finalMsg" class="finalMsg">모두 정답입니다!</div>
  </div>
`;
app.appendChild(s3);
const stairsPanel = $("#stairsPanel", s3);
const finalMsg = $("#finalMsg", s3);
let s3Done=false;
stairsPanel.addEventListener("click", (e)=>{
  if(s3Done) return;
  s3Done=true;
  okSound.currentTime=0; okSound.play().catch(()=>{});
  const r = stairsPanel.getBoundingClientRect();
  const d = Math.max(r.width, r.height)*0.7;
  const c = document.createElement("div");
  c.className="circle";
  Object.assign(c.style, {
    width: d+"px", height:d+"px",
    left: (r.left + r.width/2 - d/2) + "px",
    top:  (r.top + r.height/2 - d/2) + "px",
  });
  document.body.appendChild(c);
  finalMsg.style.display="block";
});

// start
showStage(s1);