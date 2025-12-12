/* ==================== Crypto Matrix Full JS ==================== */
/*  
========================================================
Crypto Matrix FUN © 2025 Bao Quoc Tran
All Rights Reserved.
Unauthorized copying, modification, or distribution
of this game is strictly prohibited.
========================================================
*/

// ---------- CONFIG ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const blockSize = 24, rows = 20, cols = 10;

const startBtn = document.getElementById('startBtn');
const helperBtn = document.getElementById('helperBtn');
const dogeBtn = document.getElementById('dogeBtn');
const peterGoldGif = document.getElementById('peterGoldGif');
const michaelGif = document.getElementById('michaelGif');
const dogeGif = document.getElementById('dogeGif');
const dogeCute = document.getElementById('dogeCute');
const satoshiGif = document.getElementById('satoshiGif');
const bgMusic = document.getElementById('bgMusic');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const restartBtn = document.getElementById('restartBtn');
const helpMessage = document.getElementById('helpMessage');
const xxxBtn = document.getElementById('xxxBtn');
const inverseCramerGif = document.getElementById('inverseCramerGif');
const charityBtn = document.getElementById('charityBtn');

// ---------- GAME VARIABLES ----------
let gameActive=false, paused=false, dropCounter=0, dropInterval=500, lastTime=0;
let grid=[], current=null, currentDoge=null, dogeEvent=false, dogeRemaining=0;
let peterMode=false, goldDropped=0, specialDropped=0;
let helperUsage=0, gauIndex=0, dogeGauEvent=false, dogeGauTimeout=null;
let particles=[];
let peterThresholds=[10,50,80,100,200,250,300,400,500,600,700,800,900,1000,1300,1500,1600,1700,1800,1900,2000,2500,3000,3500], peterTriggered=new Set();
let score={BTC:0,XRP:0,SOL:0,ETH:0,DOGE:0};
let coinTypes=["BTC","XRP","SOL","ETH","DOGE"];
let images={};
let satoshiActive=false, satoshiThresholds=[2100], satoshiTriggered=new Set();
let satoshiTimeout=null;

// XXX Event
const xxxPrices = [15,15,15,30,30,50,60,70,100,100,100,150,150,150,200,250,250,250,250];
let xxxLevel = 0, xxxActive = false, xxxTimeout = null;

// Inverse Cramer
let inverseCramerActive = false;
let inverseCramerThresholds = [150,200,400,500,600,700,800,900,1200,1500,1800,2000,2200,2500,3000,3500,4000,4500,5000,5100,5200,5500,6000,6500];
let inverseCramerTriggered = new Set();
let inverseCramerTimeout = null;

// Charity
const charityPrices = [15,20,20,20,20,30,30,30,50,50,50,50,60,60,60,80,80,80,80,100,100,100,120,150,200];
let charityLevel = 0, charityActive = false, charityInterval = null, charityTimeout = null;

// ---------- LOAD IMAGES ----------
for(let k of coinTypes){ let img=new Image(); img.src=`images/${k}.png`; images[k]=img; }

// ---------- TETROMINOES ----------
const tetrominoes = {
  I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]],
  S:[[0,1,1],[1,1,0]], Z:[[1,1,0],[0,1,1]], J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]]
};
const specialGoldBlocks=[
  {letter:'F', shape:[[1,1,1,1],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,0,0,0]]},
  {letter:'U', shape:[[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]]},
  {letter:'N', shape:[[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]]}
];


// ---------- UTILITIES ----------
function clone2D(arr){ return arr.map(r=>r.slice()); }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

// ---------- RANDOM TETROMINO ----------
function randomTetromino(){
  if(dogeGauEvent){
    const keys = Object.keys(tetrominoes);
    const key = keys[randInt(0,keys.length-1)];
    const shape = tetrominoes[key];
    const coins = shape.map(r=>r.map(c=>c?'BTC':null));
    return {shape, coins, x:Math.floor(cols/2)-Math.floor(shape[0].length/2), y:0};
  }
  if(peterMode){
    if(goldDropped<10){
      goldDropped++;
      const keys=Object.keys(tetrominoes);
      const key=keys[randInt(0,keys.length-1)];
      const shape=tetrominoes[key];
      const coins=shape.map(r=>r.map(c=>'GOLD'));
      return {shape, coins, x:Math.floor(cols/2)-Math.floor(shape[0].length/2), y:0};
    } else if(specialDropped<specialGoldBlocks.length){
      const s=specialGoldBlocks[specialDropped++];
      const coins=s.shape.map(r=>r.map(c=>c?s.letter:null));
      return {shape:s.shape, coins, x:Math.floor(cols/2)-Math.floor(s.shape[0].length/2), y:0};
    } else {
      peterMode=false; peterGoldGif.style.display='none';
      dogeEvent=true; dogeRemaining=15; currentDoge=spawnDogeBlock(); dogeGif.style.display='block';
      return null;
    }
  }
  const pool=Object.keys(tetrominoes);
  const key=pool[randInt(0,pool.length-1)];
  const shape=tetrominoes[key];
  let coins=shape.map(r=>r.map(c=>c?coinTypes[randInt(0,coinTypes.length-1)]:null));
  return {shape, coins, x:Math.floor(cols/2)-Math.floor(shape[0].length/2), y:0};
}

// ---------- DOGE BLOCK ----------
function spawnDogeBlock(){ return {shape:[[1]], coins:[['DOGE']], x:4, y:0}; }

// ---------- DRAW ----------
function drawChamferBlock(x,y,size){
  const g=ctx.createLinearGradient(x,y,x+size,y+size);
  g.addColorStop(0,'#FFF8DC'); g.addColorStop(0.3,'#FFD700'); g.addColorStop(1,'#FFA500');
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(x+2,y); ctx.lineTo(x+size-2,y);
  ctx.lineTo(x+size,y+2); ctx.lineTo(x+size,y+size-2);
  ctx.lineTo(x+size-2,y+size); ctx.lineTo(x+2,y+size);
  ctx.lineTo(x,y+size-2); ctx.lineTo(x,y+2); ctx.closePath(); ctx.fill();
}

function drawGrid(){
  ctx.clearRect(0,0,cols*blockSize,rows*blockSize);
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const cell=grid[r][c]; if(!cell) continue;
      if(['GOLD','F','U','N'].includes(cell)) drawChamferBlock(c*blockSize,r*blockSize,blockSize);
      else ctx.drawImage(images[cell],c*blockSize,r*blockSize,blockSize,blockSize);
    }
  }
  function drawTet(t){
    for(let r=0;r<t.shape.length;r++){
      for(let c=0;c<t.shape[0].length;c++){
        if(t.shape[r][c] && t.coins[r][c]){
          const cx=(t.x+c)*blockSize, cy=(t.y+r)*blockSize;
          const coin=t.coins[r][c];
          if(['GOLD','F','U','N'].includes(coin)) drawChamferBlock(cx,cy,blockSize);
          else ctx.drawImage(images[coin],cx,cy,blockSize,blockSize);
        }
      }
    }
  }
  if(current && !dogeEvent) drawTet(current);
  if(dogeEvent && currentDoge) drawTet(currentDoge);
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; ctx.globalAlpha=p.alpha;
    if(['GOLD','F','U','N'].includes(p.coin)) drawChamferBlock(p.x,p.y,p.size);
    else ctx.drawImage(images[p.coin],p.x,p.y,p.size,p.size);
    ctx.globalAlpha=1;
    if(!paused){p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.alpha-=0.03;if(p.alpha<=0) particles.splice(i,1);}
  }
  if(paused){
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,cols*blockSize,rows*blockSize);
    ctx.fillStyle='white'; ctx.font='36px monospace'; ctx.textAlign='center';
    ctx.fillText('PAUSED',cols*blockSize/2,rows*blockSize/2);
  }
}
// ---------- COLLISION ----------
function collision(t,xOffset=0,yOffset=0){
  if(!t) return false;
  for(let r=0;r<t.shape.length;r++){
    for(let c=0;c<t.shape[0].length;c++){
      if(!t.shape[r][c]) continue;
      const nx=t.x+c+xOffset, ny=t.y+r+yOffset;
      if(nx<0||nx>=cols||ny>=rows) return true;
      if(ny>=0 && grid[ny][nx]) return true;
    }
  }
  return false;
}

// ---------- MERGE ----------
function merge(t){
  if(!t) return;
  for(let r=0;r<t.shape.length;r++){
    for(let c=0;c<t.shape[0].length;c++){
      if(t.shape[r][c] && t.coins[r][c]){
        const gx=t.x+c, gy=t.y+r;
        if(gx>=0 && gx<cols && gy>=0 && gy<rows) grid[gy][gx]=t.coins[r][c];
      }
    }
  }
}

// ---------- PARTICLES & CLEAR ----------
function createParticles(x,y,coin){
  for(let i=0;i<10;i++) particles.push({x:x+blockSize/2,y:y+blockSize/2,vx:(Math.random()-0.5)*2,vy:Math.random()*-3,alpha:1,coin,size:Math.random()*blockSize/2+4});
}

// Clear lines with XXX and Inverse Cramer support
function clearLines(){
  for(let r=rows-1;r>=0;r--){
    if(grid[r].every(c=>c)){
      grid[r].forEach((coin,c)=>{
        createParticles(c*blockSize,r*blockSize,coin);
        if(!['GOLD','F','U','N'].includes(coin)){
          let points = 1;
          if(xxxActive && ['BTC','XRP','SOL','ETH','DOGE'].includes(coin)) points *= 2;
          if(inverseCramerActive && ['BTC','XRP','SOL','ETH','DOGE'].includes(coin)) points *= -1;
          score[coin] += points;
        }
      });
      grid.splice(r,1);
      grid.unshift(Array(cols).fill(null));
      r++;
    }
  }
  updateScoreboard();
}

// ---------- PETER GOLD ----------
function cancelAllActiveEventsForPeter(){
  if(dogeGauTimeout){ clearTimeout(dogeGauTimeout); dogeGauTimeout=null; }
  dogeGauEvent=false; dogeCute.style.display='none';
  if(dogeEvent){ dogeEvent=false; dogeRemaining=0; currentDoge=null; dogeGif.style.display='none'; current=randomTetromino(); }
  updateHelperBtn(); updateDogeBtn();
}

function checkPeter(){
  for(let t of peterThresholds){
    if(score.BTC>=t && !peterTriggered.has(t)){
      peterTriggered.add(t);
      cancelAllActiveEventsForPeter();
      peterMode=true; goldDropped=0; specialDropped=0;
      peterGoldGif.style.display='block';
      updateHelperBtn(); updateDogeBtn(); break;
    }
  }
}

// ---------- SATOSHI ----------
function checkSatoshi(){
  for(let th of satoshiThresholds){
    if(score.BTC>=th && !satoshiTriggered.has(th)){
      satoshiTriggered.add(th); triggerSatoshi(); break;
    }
  }
}
function triggerSatoshi(){
  satoshiActive=true; paused=true; satoshiGif.style.display='block';
  satoshiTimeout=setTimeout(()=>{ satoshiActive=false; paused=false; satoshiGif.style.display='none'; satoshiTimeout=null; },6000);
}

// ---------- INVERSE CRAMER ----------
function checkInverseCramer(){
  const total = score.BTC+score.XRP+score.SOL+score.ETH+score.DOGE;
  for(let th of inverseCramerThresholds){
    if(total>=th && !inverseCramerTriggered.has(th)){
      inverseCramerTriggered.add(th);
      triggerInverseCramer();
    }
  }
}
function triggerInverseCramer(){
  inverseCramerActive=true;
  inverseCramerGif.style.display='block';
  let flash = true;
  const interval = setInterval(()=>{
    if(!inverseCramerActive){ clearInterval(interval); canvas.style.borderColor='white'; return; }
    canvas.style.borderColor = flash ? 'red' : 'white';
    flash=!flash;
  }, 300);
  inverseCramerTimeout=setTimeout(()=>{
    inverseCramerActive=false;
    inverseCramerGif.style.display='none';
    canvas.style.borderColor='white';
    clearInterval(interval);
    inverseCramerTimeout=null;
  }, 60000); // 1 minutes
}

// ---------- DROP ----------
function drop(){
  if(!gameActive||paused) return;
  if(satoshiActive) return;

  if(dogeEvent && currentDoge){
    if(!collision(currentDoge,0,1)) currentDoge.y++;
    else{
      merge(currentDoge); clearLines(); dogeRemaining--;
      if(dogeRemaining>0) currentDoge=spawnDogeBlock();
      else{ dogeEvent=false; currentDoge=null; dogeGif.style.display='none'; current=randomTetromino(); }
    }
    return;
  }
  if(!current) return;
  if(!collision(current,0,1)) current.y++;
  else{
    merge(current); clearLines(); current=randomTetromino();
    if(current && collision(current,0,0) && current.y===0){ gameActive=false; gameOverOverlay.style.display='flex'; }
  }
}

// ---------- ROTATE ----------
function rotate(t){
  const shape=t.shape, coins=t.coins;
  const newShape=Array.from({length:shape[0].length},()=>Array(shape.length).fill(0));
  const newCoins=Array.from({length:shape[0].length},()=>Array(shape.length).fill(null));
  for(let r=0;r<shape.length;r++){ for(let c=0;c<shape[0].length;c++){ newShape[c][shape.length-1-r]=shape[r][c]; newCoins[c][shape.length-1-r]=coins[r][c]; } }
  const oldX=t.x, oldShape=t.shape, oldCoins=t.coins;
  for(let offset of [0,-1,1,-2,2,-3,3]){
    t.shape=newShape; t.coins=newCoins; t.x=oldX+offset;
    if(!collision(t,0,0)) return t;
  }
  t.shape=oldShape; t.coins=oldCoins; t.x=oldX; return t;
}

// ---------- HELPER & GAUGAU ----------
const helperPrices=[15,15,30,50,100,200,300,300,300,400,400,800,1000,1500,1500,1500,1500];
const gauPrices=[15,15,15,20,20,20,20,30,30,30,30,30,50,50,60,80,100,120,150,200,200,200,200,200,200,200];

function updateHelperBtn(){ helperBtn.textContent=helperUsage<helperPrices.length?`HELP (${helperPrices[helperUsage]} BTC)`:"HELP (MAX)"; helperBtn.disabled=peterMode||!gameActive; }
function updateDogeBtn(){ const price=gauPrices[Math.min(gauIndex,gauPrices.length-1)]; dogeBtn.textContent=`GÂU GÂU (${price} DOGE)`; dogeBtn.disabled=!gameActive||peterMode||score.DOGE<price; }

function useHelper(){
  if(!gameActive||peterMode||helperUsage>=helperPrices.length||score.BTC<helperPrices[helperUsage]) return;
  if(dogeEvent){ dogeEvent=false; dogeRemaining=0; currentDoge=null; dogeGif.style.display='none'; current = randomTetromino(); }
  score.BTC -= helperPrices[helperUsage++];
  // Clear map + add points (XXX & Inverse Cramer logic)
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const coin=grid[r][c];
      if(coin){
        createParticles(c*blockSize,r*blockSize,coin);
        if(!['GOLD','F','U','N'].includes(coin)){
          let points = 1;
          if(xxxActive && ['BTC','XRP','SOL','ETH','DOGE'].includes(coin)) points*=2;
          if(inverseCramerActive && ['BTC','XRP','SOL','ETH','DOGE'].includes(coin)) points*=-1;
          score[coin]+=points;
        }
      }
    }
  }
  grid=Array.from({length:rows},()=>Array(cols).fill(null));
  updateScoreboard();
  michaelGif.style.display='block';
  helpMessage.style.display='block';
  setTimeout(()=>{ michaelGif.style.display='none'; helpMessage.style.display='none'; },6000);
}

// ở trong file, chèn giữa 1 block logic bất kỳ
if(!window.CMF_CHECK){
    Object.defineProperty(window,"CMF_CHECK",{value:"Crypto Matrix FUN © 2025 BAO QUOC TRAN",writable:false});
}

// ---------- GAUGAU ----------
function useGauGau(){
  if(!gameActive||peterMode) return;
  const price=gauPrices[Math.min(gauIndex,gauPrices.length-1)];
  if(score.DOGE<price) return;
  score.DOGE -= price; gauIndex++; updateScoreboard();
  dogeGauEvent = true;
  if(dogeEvent){ dogeEvent=false; dogeRemaining=0; currentDoge=null; dogeGif.style.display='none'; current=randomTetromino(); }
  dogeCute.style.display = 'block';
  if(dogeGauTimeout) clearTimeout(dogeGauTimeout);
  dogeGauTimeout = setTimeout(()=>{ dogeGauEvent=false; dogeCute.style.display='none'; current=randomTetromino(); updateDogeBtn(); },45000);
}

// ---------- SCOREBOARD ----------
function updateScoreboard(){
  document.getElementById("btcScore").textContent=score.BTC;
  document.getElementById("xrpScore").textContent=score.XRP;
  document.getElementById("solScore").textContent=score.SOL;
  document.getElementById("ethScore").textContent=score.ETH;
  document.getElementById("dogeScore").textContent=score.DOGE;
  checkPeter(); checkSatoshi(); checkInverseCramer();
  updateHelperBtn(); updateDogeBtn(); updateXxxBtn();
}
// ---------- CONTROLS ----------
document.addEventListener('keydown', e=>{
  if(!gameActive) return;
  const k = e.key.toLowerCase();

  if(k==='p'){
    paused = !paused;
    if(paused) bgMusic.pause();
    else bgMusic.play().catch(()=>console.log("Click canvas để bật nhạc"));
    return;
  }
  if(k==='h') useHelper();
  if(k==='g') useGauGau();
  if(k==='x') activateXxx();
  if(paused) return;

  let t = dogeEvent?currentDoge:current;
  if(!t) return;

  switch(e.key){
    case 'ArrowLeft': if(!collision(t,-1,0)) t.x--; break;
    case 'ArrowRight': if(!collision(t,1,0)) t.x++; break;
    case 'ArrowDown': drop(); break;
    case ' ': case 'a': rotate(t); break;
  }
});

// ---------- GAME LOOP ----------
function update(time=0){
  if(!gameActive) return;
  const delta = time - lastTime;
  lastTime = time;

  if(!paused && !satoshiActive){
    dropCounter += delta;
    if(dropCounter > dropInterval){
      drop();
      dropCounter = 0;
    }
  }
  drawGrid();
  requestAnimationFrame(update);
}

// ---------- START / RESTART ----------
bgMusic.volume = 0.3;

startBtn.addEventListener('click', ()=>{
  startGame();
});

restartBtn.addEventListener('click', ()=>location.reload());

document.addEventListener('keydown', function(e) {
  if (e.key.toLowerCase() === 's') {

    // Nếu nút Start còn đang hiển thị → tức là game chưa bắt đầu
    if (startBtn.style.display !== 'none') {
      startBtn.click(); // chạy y chang nhấn chuột
    }
  }
});


// ---------- XXX EVENT ----------
function updateXxxBtn(){
  const price = xxxPrices[Math.min(xxxLevel, xxxPrices.length-1)];
  xxxBtn.textContent = `XXX (${price} XRP)`;
  xxxBtn.disabled = !gameActive || score.XRP < price;
}

function activateXxx(){
  if(!gameActive || xxxLevel >= xxxPrices.length) return;
  const price = xxxPrices[Math.min(xxxLevel, xxxPrices.length-1)];
  if(score.XRP < price) return;

  score.XRP -= price;
  xxxLevel++;
  xxxActive = true;

  document.querySelectorAll('.coinLabel').forEach(span => span.classList.add('flash-green'));
  updateScoreboard();

  if(xxxTimeout) clearTimeout(xxxTimeout);
  xxxTimeout = setTimeout(()=>{
    xxxActive = false;
    document.querySelectorAll('.coinLabel').forEach(span => span.classList.remove('flash-green'));
    xxxTimeout = null;
  }, 60000); // 1 phút
  updateXxxBtn();
}

xxxBtn.addEventListener('click', activateXxx);
helperBtn.addEventListener("click", useHelper);
dogeBtn.addEventListener("click", useGauGau);

function initXxxEvent(){
  xxxLevel = 0; xxxActive = false;
  if(xxxTimeout){ clearTimeout(xxxTimeout); xxxTimeout = null; }
  updateXxxBtn();
}

// ---------- CHARITY EVENT ----------
function updateCharityBtn(){
  const price = charityPrices[Math.min(charityLevel, charityPrices.length-1)];
  charityBtn.textContent = `CHARITY (${price} SOL)`;
  charityBtn.disabled = !gameActive || score.SOL < price;
}
function activateCharity(){
  if(!gameActive || charityLevel >= charityPrices.length) return;
  const price = charityPrices[Math.min(charityLevel, charityPrices.length-1)];
  if(score.SOL < price) return;
  score.SOL -= price;
  charityLevel++;
  charityActive = true;
  document.querySelectorAll('.coinScore').forEach(span => span.classList.add('flash-purple'));
  updateScoreboard();
  charityInterval = setInterval(()=>{
    if(!charityActive) return;
    for(let k of coinTypes){ if(k!=='SOL') score[k] += 1; }
    updateScoreboard();
  }, 1000);
  if(charityTimeout) clearTimeout(charityTimeout);
  charityTimeout = setTimeout(()=>{
    charityActive = false;
    clearInterval(charityInterval);
    document.querySelectorAll('.coinScore').forEach(span => span.classList.remove('flash-purple'));
    charityTimeout = charityInterval = null;
    updateScoreboard();
  }, 30000);
  updateCharityBtn();
}
charityBtn.addEventListener('click', activateCharity);
document.addEventListener('keydown', e=>{ if(e.key.toLowerCase()==='c') activateCharity(); });
function initCharityEvent(){ charityLevel=0; charityActive=false; if(charityInterval) clearInterval(charityInterval); if(charityTimeout) clearTimeout(charityTimeout); updateCharityBtn(); }

// ---------- START GAME ----------
function startGame(){
  startBtn.style.display='none';
  gameActive = true; paused = false; dropCounter = 0; lastTime = performance.now();
  grid = Array.from({length:rows},()=>Array(cols).fill(null));
  score = {BTC:0,XRP:0,SOL:0,ETH:0,DOGE:0};
  peterTriggered.clear(); helperUsage=0; gauIndex=0; dogeEvent=false; dogeRemaining=0; dogeGauEvent=false;
  current=randomTetromino(); currentDoge=null; particles=[];
  peterMode=false; goldDropped=0; specialDropped=0;
  dogeGif.style.display='none'; peterGoldGif.style.display='none';
  michaelGif.style.display='none'; satoshiGif.style.display='none';
  dogeCute.style.display='none';
  inverseCramerActive=false; inverseCramerGif.style.display='none';
  bgMusic.currentTime=0; bgMusic.play().catch(()=>console.log("Click canvas để bật nhạc"));
  initXxxEvent();
  initCharityEvent(); // Charity init
  initVitalikEvent();
  updateScoreboard();
  update();
}

// ---------- VITALIK EVENT ----------
const vitalikBtn = document.getElementById('vitalikBtn');
const vitalikGif = document.getElementById('vitalikGif');
const vitalikPrices = [150,200,300,400,500,600,700,800,1000]; // giá ETH cho mỗi lần bấm
let vitalikActive = false;
let vitalikTimeout = null;
let vitalikLevel = 0;

// update button hiển thị giá
function updateVitalikBtn(){
  const price = vitalikPrices[Math.min(vitalikLevel, vitalikPrices.length-1)];
  vitalikBtn.textContent = `VITALIK (${price} ETH)`;
  vitalikBtn.disabled = !gameActive || score.ETH < price;
}

// activate Vitalik event
function activateVitalik(){
  if(!gameActive || vitalikLevel >= vitalikPrices.length) return;
  const price = vitalikPrices[Math.min(vitalikLevel, vitalikPrices.length-1)];
  if(score.ETH < price) return;

  // trừ ETH, cộng BTC
  score.ETH -= price;
  score.BTC += price;

  // hủy Peter Gold & Inverse Cramer nếu đang active
  if(peterMode) { peterMode=false; peterGoldGif.style.display='none'; }
  if(dogeGauTimeout){ clearTimeout(dogeGauTimeout); dogeGauTimeout=null; dogeGauEvent=false; dogeCute.style.display='none'; }
  if(dogeEvent){ dogeEvent=false; dogeRemaining=0; currentDoge=null; dogeGif.style.display='none'; current=randomTetromino(); }
  if(inverseCramerActive){ inverseCramerActive=false; inverseCramerGif.style.display='none'; canvas.style.borderColor='white'; if(inverseCramerTimeout){ clearTimeout(inverseCramerTimeout); inverseCramerTimeout=null; } }

  // show Vitalik GIF đúng vị trí Peter Gold 2 giây
  vitalikGif.style.display = 'block';
  vitalikActive = true;
  if(vitalikTimeout) clearTimeout(vitalikTimeout);
  vitalikTimeout = setTimeout(()=>{
    vitalikGif.style.display='none';
    vitalikActive = false;
    vitalikTimeout = null;
  },4000);

  vitalikLevel++;
  updateScoreboard();
  updateVitalikBtn();
}

// click button
vitalikBtn.addEventListener('click', activateVitalik);
// keyboard shortcut 'v'
document.addEventListener('keydown', e=>{
  if(e.key.toLowerCase()==='v') activateVitalik();
});

// khởi tạo khi Start Game
function initVitalikEvent(){
  vitalikLevel=0;
  vitalikActive=false;
  if(vitalikTimeout) { clearTimeout(vitalikTimeout); vitalikTimeout=null; }
  updateVitalikBtn();
}


// =====================
// MOBILE CONTROL BUTTONS
// =====================

// Helper for binding touch + mouse + click
function bindMobileButton(btn, handler) {
    if (!btn) return;

    // Touch (mobile)
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        handler();
    }, { passive: false });

    // Mouse (desktop)
    btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        handler();
    });

    // Click fallback
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        handler();
    });
}

// Main control buttons
bindMobileButton(document.getElementById("leftBtn"), () => moveLeft());
bindMobileButton(document.getElementById("rightBtn"), () => moveRight());
bindMobileButton(document.getElementById("downBtn"), () => moveDown());
bindMobileButton(document.getElementById("rotateBtn"), () => rotatePiece());
bindMobileButton(document.getElementById("pauseBtn"), () => togglePause());

// Event ability buttons
bindMobileButton(document.getElementById("m_helperBtn"), () => useHelper());
bindMobileButton(document.getElementById("m_xxxBtn"), () => activateXxx());
bindMobileButton(document.getElementById("m_charityBtn"), () => activateCharity());
bindMobileButton(document.getElementById("m_vitalikBtn"), () => activateVitalik());
bindMobileButton(document.getElementById("m_dogeBtn"), () => useGauGau());

// Prevent accidental scrolling when touching the game canvas
const canvasEl = document.getElementById("gameCanvas");
if (canvasEl) {
    canvasEl.addEventListener("touchstart", (e) => { e.preventDefault(); }, { passive: false });
    canvasEl.addEventListener("touchmove", (e) => { e.preventDefault(); }, { passive: false });
}

// ======================
// MOBILE CONTROL HELPERS
// ======================

// Move Left
function moveLeft() {
    if (!gameActive || paused) return;

    let t = dogeEvent ? currentDoge : current;
    if (!t) return;

    if (!collision(t, -1, 0)) t.x--;
}

// Move Right
function moveRight() {
    if (!gameActive || paused) return;

    let t = dogeEvent ? currentDoge : current;
    if (!t) return;

    if (!collision(t, 1, 0)) t.x++;
}

// Move Down
function moveDown() {
    if (!gameActive || paused) return;

    drop();   // bạn đã có hàm drop() sẵn
}

// Rotate
function rotatePiece() {
    if (!gameActive || paused) return;

    let t = dogeEvent ? currentDoge : current;
    if (!t) return;

    rotate(t);   // đã có hàm rotate()
}

// Pause toggle
function togglePause() {
    if (!gameActive) return;

    paused = !paused;

    if (paused) bgMusic.pause();
    else bgMusic.play().catch(() => console.log("Click canvas để bật nhạc"));
}

window.addEventListener("load", () => {
    adjustCanvasSize();   // hoặc resizeForMobile()
});
