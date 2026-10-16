// ===== 問問小動物 - 新功能模組 =====
// 載入順序：app.js 先，features.js 後

// ===== 多槽紙娃娃系統 =====
const ACCESSORIES = [
{ id: "crown", name: "金皇冠", price: 200, slot: "head", img: "images/acc/acc_crown.webp", emoji: "👑", top: "-14%", size: "48px" },
{ id: "hat", name: "魔術帽", price: 180, slot: "head", img: "images/acc/acc_hat.webp", emoji: "🎩", top: "-18%", size: "56px" },
{ id: "halo", name: "星星光環", price: 250, slot: "head", img: "images/acc/acc_halo.webp", emoji: "✨", top: "-20%", size: "60px" },
{ id: "glasses", name: "太陽眼鏡", price: 150, slot: "face", img: "images/acc/acc_glasses.webp", emoji: "🕶️", top: "30%", size: "52px" },
{ id: "headphone", name: "音樂耳機", price: 160, slot: "neck", img: "images/acc/acc_headphone.webp", emoji: "🎧", top: "16%", size: "56px" },
{ id: "bow", name: "粉紅蝴蝶結", price: 100, slot: "neck", img: "images/acc/acc_bow.webp", emoji: "🎀", top: "-2%", left: "68%", size: "36px" },
{ id: "flower", name: "櫻花髮夾", price: 130, slot: "neck", img: "images/acc/acc_flower.webp", emoji: "🌸", top: "2%", left: "65%", size: "32px" },
{ id: "scarf", name: "紅圍巾", price: 90, slot: "neck", img: "images/acc/acc_scarf.webp", emoji: "🧣", top: "60%", size: "44px" },
];
// 舊 id 遷移對照（tophat→hat, sunglasses→glasses）
const ACC_ID_ALIAS = { tophat: "hat", sunglasses: "glasses" };
function normAccId(id) { return ACC_ID_ALIAS[id] || id; }
const SLOT_LABEL = { head: "🎩 帽子", face: "👓 臉部", neck: "🧣 脖子" };
const SLOT_Z = { neck: 4, face: 5, head: 6 };
function getOwnedAccessories() {
try { return [...new Set(JSON.parse(localStorage.getItem("wws_accessories") || "[]").map(normAccId))]; }
catch (e) { return []; }
}
function ownAccessory(id) {
id = normAccId(id);
const owned = getOwnedAccessories();
if (!owned.includes(id)) {
owned.push(id);
localStorage.setItem("wws_accessories", JSON.stringify(owned));
}
}
// 多槽裝備：{ head: id|null, face: id|null, neck: id|null }（每隻動物獨立）
function getEquipped(audioKey) {
const empty = { head: null, face: null, neck: null };
try {
const raw = JSON.parse(localStorage.getItem("wws_equipped") || "{}")[audioKey];
if (!raw) return empty;
if (typeof raw === "string") {
// 舊格式（單一飾品字串）遷移到對應槽位
const id = normAccId(raw);
const acc = ACCESSORIES.find(x => x.id === id);
const obj = { head: null, face: null, neck: null };
if (acc) obj[acc.slot] = id;
setEquippedObj(audioKey, obj);
return obj;
}
return {
head: raw.head ? normAccId(raw.head) : null,
face: raw.face ? normAccId(raw.face) : null,
neck: raw.neck ? normAccId(raw.neck) : null
};
} catch (e) { return empty; }
}
function setEquippedObj(audioKey, obj) {
let data = {};
try { data = JSON.parse(localStorage.getItem("wws_equipped") || "{}"); } catch (e) {}
data[audioKey] = obj;
localStorage.setItem("wws_equipped", JSON.stringify(data));
}
function getAccConfig(audioKey, accId) {
accId = normAccId(accId);
try {
const all = JSON.parse(localStorage.getItem("wws_acc_config") || "{}");
return (all[audioKey] && all[audioKey][accId]) || { dx: 0, dy: 0, size: null };
} catch (e) { return { dx: 0, dy: 0, size: null }; }
}
function setAccConfig(audioKey, accId, cfg) {
accId = normAccId(accId);
let all = {};
try { all = JSON.parse(localStorage.getItem("wws_acc_config") || "{}"); } catch (e) {}
if (!all[audioKey]) all[audioKey] = {};
all[audioKey][accId] = cfg;
localStorage.setItem("wws_acc_config", JSON.stringify(all));
}
function accSizeSet(slot, value) {
const a = getAnimal();
const accId = getEquipped(a.audioKey)[slot];
if (!accId) return;
const cfg = getAccConfig(a.audioKey, accId);
cfg.size = parseInt(value);
setAccConfig(a.audioKey, accId, cfg);
applyAnimal();
}
function accReset(slot) {
const a = getAnimal();
const accId = getEquipped(a.audioKey)[slot];
if (!accId) return;
setAccConfig(a.audioKey, accId, { dx: 0, dy: 0, size: null });
applyAnimal();
openShop();
}
function buyAccessory(id) {
const acc = ACCESSORIES.find(a => a.id === normAccId(id));
if (!acc) return;
const owned = getOwnedAccessories();
if (owned.includes(acc.id)) { alert("已經擁有囉！"); return; }
if (kidPoints < acc.price) { alert(`點數不夠！需要 ${acc.price} 點，你有 ${kidPoints} 點。多玩遊戲賺點數吧！💪`); return; }
if (confirm(`要用 ${acc.price} 點買「${acc.emoji} ${acc.name}」嗎？`)) {
kidPoints -= acc.price;
lsSet(LS_KEYS.points, kidPoints);
ownAccessory(acc.id);
if (typeof updatePointsDisplay === "function") updatePointsDisplay();
openShop();
alert(`🎉 買到「${acc.name}」了！點「裝備」穿上吧！`);
}
}
function toggleEquip(id) {
const a = getAnimal();
id = normAccId(id);
const acc = ACCESSORIES.find(x => x.id === id);
if (!acc) return;
const eq = getEquipped(a.audioKey);
eq[acc.slot] = (eq[acc.slot] === id) ? null : id;
setEquippedObj(a.audioKey, eq);
applyAnimal();
openShop();
}
// 飾品縮圖：有圖用 img，載入失敗 fallback 到 emoji
function accThumb(acc, px) {
px = px || 44;
if (!acc.img) return `<span style="font-size:${px}px;line-height:1;">${acc.emoji}</span>`;
return `<img src="${acc.img}" alt="${acc.name}" draggable="false" style="width:${px}px;height:${px}px;object-fit:contain;pointer-events:none;" onerror="accImgErr(this,'${acc.emoji}',${px})">`;
}
function accImgErr(el, emoji, px) {
const s = document.createElement("span");
s.style.cssText = `font-size:${px}px;line-height:1;`;
s.textContent = emoji;
el.replaceWith(s);
}
function openShop() {
let modal = document.getElementById("shop-modal");
if (modal) modal.remove();
modal = document.createElement("div");
modal.id = "shop-modal";
modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
const owned = getOwnedAccessories();
const equipped = getEquipped(getAnimal().audioKey);
const sectionsHtml = ["head", "face", "neck"].map(slot => {
const itemsHtml = ACCESSORIES.filter(acc => acc.slot === slot).map(acc => {
const isOwned = owned.includes(acc.id);
const isEquipped = equipped[slot] === acc.id;
const btnHtml = !isOwned
? `<button onclick="buyAccessory('${acc.id}')" style="padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ff9800,#f57c00);border:none;border-radius:20px;cursor:pointer;">${acc.price} 點購買</button>`
: isEquipped
? `<button onclick="toggleEquip('${acc.id}')" style="padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:#9e9e9e;border:none;border-radius:20px;cursor:pointer;">卸下</button><div style="margin-top:10px;"><div style="font-size:12px;color:#666;margin-bottom:4px;">🔍 大小調整</div><input type="range" min="20" max="120" value="${(getAccConfig(getAnimal().audioKey, acc.id).size || parseInt(acc.size))}" oninput="accSizeSet('${acc.slot}',this.value)" style="width:100%;accent-color:#ab47bc;cursor:pointer;"></div><button onclick="accReset('${acc.slot}')" style="margin-top:8px;padding:6px 16px;font-size:12px;color:#666;background:#f5f5f5;border:1px solid #ddd;border-radius:12px;cursor:pointer;">重置位置</button><div style="font-size:11px;color:#999;margin-top:6px;">💡 直接拖拉飾品可移動位置</div>`
: `<button onclick="toggleEquip('${acc.id}')" style="padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#66bb6a,#43a047);border:none;border-radius:20px;cursor:pointer;">✨ 裝備</button>`;
return `
<div style="background:#fff;border-radius:16px;padding:12px;text-align:center;border:${isEquipped ? "3px solid #4CAF50" : "2px solid #eee"};"><div style="min-height:48px;display:flex;align-items:center;justify-content:center;">${accThumb(acc, 44)}</div><div style="font-size:14px;font-weight:bold;color:#333;margin:4px 0;">${acc.name}</div><div style="margin-top:8px;">${btnHtml}</div>
${isOwned ? '<div style="font-size:11px;color:#4CAF50;margin-top:4px;">✅ 已擁有</div>' : ""}
</div>`;
}).join("");
return `<div style="margin-bottom:14px;"><div style="font-size:15px;font-weight:bold;margin-bottom:8px;">${SLOT_LABEL[slot]}${equipped[slot] ? ' <span style="font-size:11px;color:#4CAF50;">● 裝備中</span>' : ""}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${itemsHtml}</div></div>`;
}).join("");
modal.innerHTML = `
<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h2 style="margin:0;font-size:20px;">🛍️ 裝飾品商城</h2><div style="background:#fff3e0;padding:6px 14px;border-radius:15px;font-weight:bold;color:#e65100;">⭐ ${kidPoints} 點</div></div><p style="font-size:13px;color:#666;margin:0 0 12px;">幫你的小動物打扮！帽子、臉部、脖子可同時裝備 🎩👓🧣</p><div style="background:#fff8e1;border:2px solid #ffd54f;border-radius:16px;padding:12px;margin-bottom:12px;"><div style="font-size:15px;font-weight:bold;color:#e65100;margin-bottom:8px;">🎒 我的背包 <span id="food-modal-feedcount" style="font-size:12px;color:#999;"></span></div><div id="food-backpack" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"></div></div>${sectionsHtml}<button onclick="document.getElementById('shop-modal').remove();" style="margin-top:16px;width:100%;padding:12px;font-size:16px;font-weight:bold;color:#fff;background:#9e9e9e;border:none;border-radius:12px;cursor:pointer;">關閉</button></div>`;
document.body.appendChild(modal);
modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}
// 三槽同時渲染：每個槽位一個 overlay，img 載入失敗時 fallback 到 emoji
function renderAccessoryOverlay(container) {
const a = getAnimal();
const eq = getEquipped(a.audioKey);
container.querySelectorAll(".acc-overlay").forEach(el => el.remove());
container.style.position = "relative";
["neck", "face", "head"].forEach(slot => {
const accId = eq[slot];
if (!accId) return;
const acc = ACCESSORIES.find(x => x.id === accId);
if (!acc) return;
const cfg = getAccConfig(a.audioKey, accId);
const size = cfg.size || parseInt(acc.size);
const overlay = document.createElement("div");
overlay.className = "acc-overlay";
overlay.dataset.slot = slot;
overlay.style.cssText = `position:absolute;top:${acc.top};left:${acc.left || "50%"};transform:translate(calc(-50% + ${cfg.dx}px), ${cfg.dy}px);width:${size}px;height:${size}px;z-index:${SLOT_Z[slot]};filter:drop-shadow(0 2px 3px rgba(0,0,0,.2));cursor:move;touch-action:none;`;
overlay.title = "拖拉我調整位置！";
const img = document.createElement("img");
img.src = acc.img;
img.alt = acc.name;
img.draggable = false;
img.style.cssText = "width:100%;height:100%;object-fit:contain;pointer-events:none;";
img.onerror = () => {
overlay.textContent = acc.emoji;
overlay.style.fontSize = size + "px";
overlay.style.width = "auto";
overlay.style.height = "auto";
};
overlay.appendChild(img);
attachAccDrag(overlay, a.audioKey, accId);
container.appendChild(overlay);
});
}
// 飾品拖拉：全域共用一份監聽器（避免多次 applyAnimal 重複註冊）
let _accDrag = null;
function attachAccDrag(overlay, audioKey, accId) {
overlay.addEventListener("mousedown", (ev) => {
const c = getAccConfig(audioKey, accId);
_accDrag = { overlay, audioKey, accId, sx: ev.clientX, sy: ev.clientY, sdx: c.dx, sdy: c.dy };
ev.stopPropagation(); ev.preventDefault();
});
overlay.addEventListener("touchstart", (ev) => {
const t = ev.touches[0];
const c = getAccConfig(audioKey, accId);
_accDrag = { overlay, audioKey, accId, sx: t.clientX, sy: t.clientY, sdx: c.dx, sdy: c.dy };
ev.stopPropagation(); ev.preventDefault();
}, { passive: false });
}
function _accDragMove(cx, cy) {
if (!_accDrag) return;
const d = _accDrag;
const c = getAccConfig(d.audioKey, d.accId);
c.dx = d.sdx + (cx - d.sx); c.dy = d.sdy + (cy - d.sy);
setAccConfig(d.audioKey, d.accId, c);
d.overlay.style.transform = `translate(calc(-50% + ${c.dx}px), ${c.dy}px)`;
}
document.addEventListener("mousemove", (ev) => _accDragMove(ev.clientX, ev.clientY));
document.addEventListener("touchmove", (ev) => { if (!_accDrag) return; const t = ev.touches[0]; _accDragMove(t.clientX, t.clientY); }, { passive: true });
document.addEventListener("mouseup", () => { _accDrag = null; });
document.addEventListener("touchend", () => { _accDrag = null; });
function updateAnimalLevelDisplay() {
const a = getAnimal();
const level = getAnimalLevel(a.audioKey);
const xp = getAnimalXP(a.audioKey);
const progress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
const evo = getEvolutionInfo(a.audioKey);
const stageNames = ["第一階", "第二階", "最終階"];
const stage = getEvolutionStage(a.audioKey);
const el = document.getElementById("animal-level");
if (el) {
el.innerHTML = `${evo.name} Lv.${level} ${getLevelTitle(level)} <span style="color:#999;font-size:12px;">(${stageNames[stage]})</span><div class="xp-bar"><div class="xp-fill" style="width:${progress}%"></div></div>`;
}
}


// ===== 新功能：場景/裝飾/走動/日夜/天氣/好友/錯題重出 =====
function goScene(n){document.querySelectorAll(".scene").forEach(function(s){s.classList.remove("active");});var t=document.getElementById("scene-"+n);if(t)t.classList.add("active");if(n==="quiz"){var qc=document.getElementById("quiz-container");if(qc){var gb=document.querySelector(".grade-btns"),sb=document.getElementById("quiz-start-btn"),qa=document.getElementById("quiz-area"),qr=document.getElementById("quiz-result");[gb,sb,qa,qr].forEach(function(el){if(el&&el.parentNode!==qc)qc.appendChild(el);});}if(typeof startQuiz==="function")startQuiz();}if(n==="photo"){var pc=document.getElementById("photo-container"),ma=document.getElementById("mode-ask");if(pc&&ma&&ma.parentNode!==pc)pc.appendChild(ma);}if(n==="error"){var ec=document.getElementById("error-container"),me=document.getElementById("mode-error");if(ec&&me&&me.parentNode!==ec)ec.appendChild(me);if(typeof renderErrorBook==="function")renderErrorBook();}window.scrollTo(0,0);}
const DECO_ITEMS=[{id:"tree",icon:"🌳",name:"大樹",price:100},{id:"flower",icon:"🌷",name:"鬱金香",price:30},{id:"sunflower",icon:"🌻",name:"向日葵",price:40},{id:"pond",icon:"🏞️",name:"小池塘",price:200},{id:"house",icon:"🏠",name:"小木屋",price:500},{id:"windmill",icon:"🎡",name:"風車",price:300},{id:"fountain",icon:"⛲",name:"噴泉",price:350},{id:"bench",icon:"🪑",name:"長椅",price:80},{id:"mushroom",icon:"🍄",name:"蘑菇",price:25},{id:"cactus",icon:"🌵",name:"仙人掌",price:40},{id:"bamboo",icon:"🎋",name:"竹子",price:50},{id:"appletree",icon:"🍎",name:"蘋果樹",price:120},{id:"flowerbed",icon:"🌼",name:"花圃",price:70},{id:"bowdeco",icon:"🦋",name:"蝴蝶裝飾",price:90},{id:"castle",icon:"🏰",name:"城堡",price:800},{id:"car",icon:"🚗",name:"小汽車",price:400},{id:"circus",icon:"🎪",name:"馬戲團帳篷",price:600},{id:"hut",icon:"🛖",name:"茅草屋",price:300},{id:"well",icon:"💧",name:"水井",price:150}];
function getDeco(){try{return JSON.parse(localStorage.getItem("wws_deco")||"[]")}catch(e){return[]}}
function saveDeco(d){localStorage.setItem("wws_deco",JSON.stringify(d))}
function renderDeco(){const layer=document.getElementById("deco-layer");if(!layer)return;layer.innerHTML="";getDeco().forEach((d,i)=>{const item=DECO_ITEMS.find(x=>x.id===d.id);if(!item)return;const el=document.createElement("div");el.className="deco-item"+(item.icon==="🏮"?" lamp-glow":"");el.textContent=item.icon;el.style.left=(d.x||20)+"%";el.style.top=(d.y||60)+"%";el.style.fontSize=(d.s||48)+"px";makeDecoDraggable(el,i);let pt;el.addEventListener("touchstart",()=>{pt=setTimeout(()=>removeDeco(i),800)},{passive:true});el.addEventListener("touchend",()=>clearTimeout(pt));layer.appendChild(el);});}
function makeDecoDraggable(el,idx){let sx,sy,ox,oy,dg=false;function st(e){dg=true;const t=e.touches?e.touches[0]:e;sx=t.clientX;sy=t.clientY;const r=el.getBoundingClientRect(),pr=el.parentNode.getBoundingClientRect();ox=r.left-pr.left;oy=r.top-pr.top;el.style.zIndex=100;}function mv(e){if(!dg)return;e.preventDefault();const t=e.touches?e.touches[0]:e,pr=el.parentNode.getBoundingClientRect();let nx=ox+(t.clientX-sx),ny=oy+(t.clientY-sy);nx=Math.max(0,Math.min(pr.width-40,nx));ny=Math.max(0,Math.min(pr.height-40,ny));el.style.left=nx+"px";el.style.top=ny+"px";}function en(){if(!dg)return;dg=false;el.style.zIndex="";const pr=el.parentNode.getBoundingClientRect(),r=el.getBoundingClientRect(),x=Math.round((r.left-pr.left)/pr.width*100),y=Math.round((r.top-pr.top)/pr.height*100);el.style.left=x+"%";el.style.top=y+"%";const a=getDeco();a[idx].x=x;a[idx].y=y;saveDeco(a);}el.addEventListener("mousedown",st);el.addEventListener("touchstart",st,{passive:true});document.addEventListener("mousemove",mv);document.addEventListener("touchmove",mv,{passive:false});document.addEventListener("mouseup",en);document.addEventListener("touchend",en);}
function removeDeco(i){if(!confirm("要移除這個裝飾嗎？（不退點數）"))return;const a=getDeco();a.splice(i,1);saveDeco(a);renderDeco();}
function buyDeco(id){const it=DECO_ITEMS.find(x=>x.id===id);if(kidPoints<it.price){alert("點數不夠！"+it.name+"要 "+it.price+" 點，你有 "+kidPoints+" 點。");return;}kidPoints-=it.price;try{localStorage.setItem("wws_points",kidPoints)}catch(e){}const kp=document.getElementById("kid-points");if(kp)kp.textContent=kidPoints;const a=getDeco();a.push({id,x:10+Math.random()*70,y:55+Math.random()*25,s:48});saveDeco(a);renderDeco();if(typeof updatePointsDisplay==="function")updatePointsDisplay();if(typeof updateRpgHud==="function")updateRpgHud();alert("🎉 買到 "+it.icon+" "+it.name+"！拖曳可以移動，長按移除。");openDecoShop();}
function openDecoShop(){let m=document.getElementById("deco-modal");if(m)m.remove();m=document.createElement("div");m.id="deco-modal";m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";const ow=getDeco().length;const items=DECO_ITEMS.map(d=>'<div style="background:#fff;border:2px solid #e0e0e0;border-radius:16px;padding:12px;text-align:center"><div style="font-size:44px">'+d.icon+'</div><div style="font-size:14px;font-weight:bold">'+d.name+'</div><div style="font-size:13px;color:#f57f17;font-weight:bold">🪙 '+d.price+'點</div><button onclick="buyDeco(\''+d.id+'\')" style="margin-top:8px;padding:8px 16px;font-size:13px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#7e57c2,#5c6bc0);border:none;border-radius:12px;cursor:pointer">購買</button></div>').join("");m.innerHTML='<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto"><h2 style="margin:0;font-size:20px;text-align:center">🏡 農場布置</h2><p style="text-align:center;font-size:13px;color:#666">已放置 '+ow+' 個｜💰 '+kidPoints+' 點</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+items+'</div><button onclick="document.getElementById(\'deco-modal\').remove()" style="margin-top:12px;width:100%;padding:12px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer">關閉</button></div>';document.body.appendChild(m);m.addEventListener("click",e=>{if(e.target===m)m.remove();});}
setTimeout(()=>{const sp=document.getElementById("animal-spot"),bg=document.getElementById("animal-big-icon");if(sp&&bg){sp.appendChild(bg);}if(typeof renderDeco==="function")renderDeco();},1200);

// ===== 活體小動物走動系統 =====
const Walker={x:50,y:70,tx:50,ty:70,speed:0.25,moving:false,paused:false,el:null,
init(){this.el=document.getElementById("animal-walker");if(!this.el){setTimeout(()=>this.init(),1000);return;}this.pickTarget();setInterval(()=>this.tick(),50);},
pickTarget(){this.tx=15+Math.random()*70;this.ty=55+Math.random()*30;},
tick(){if(this.paused||!this.el)return;
try{if(typeof isFainted==="function"&&typeof getAnimal==="function"&&isFainted(getAnimal().audioKey)){if(typeof SpriteAnim!=="undefined"&&SpriteAnim.active)SpriteAnim.stop();return;}}catch(e){}
const dx=this.tx-this.x,dy=this.ty-this.y,dist=Math.hypot(dx,dy);
if(dist<2){this.moving=false;this.el.classList.remove("walking");if(typeof SpriteAnim!=="undefined"&&SpriteAnim.active)SpriteAnim.stop();if(Math.random()<0.03)this.pickTarget();return;}
this.moving=true;this.el.classList.add("walking");
if(typeof SpriteAnim!=="undefined"&&typeof getAnimal==="function"){try{SpriteAnim.start(getAnimal().audioKey);}catch(e){}}
this.x+=dx/dist*this.speed;this.y+=dy/dist*this.speed;
this.el.style.left=this.x+"%";this.el.style.top=this.y+"%";
if(dx>0.5)this.el.classList.remove("facing-left");else if(dx<-0.5)this.el.classList.add("facing-left");},
pause(){this.paused=true;if(this.el)this.el.classList.remove("walking");if(typeof SpriteAnim!=="undefined")SpriteAnim.stop();},
resume(){this.paused=false;},
happy(){if(!this.el)return;this.el.classList.remove("happy");void this.el.offsetWidth;this.el.classList.add("happy");setTimeout(()=>{if(this.el)this.el.classList.remove("happy")},600);}
};
setTimeout(()=>Walker.init(),2000);

// ===== 逐幀走路動畫（4幀橫排 webp sprite）=====
const SpriteAnim = {
  frames: 4, current: 0, timer: null, spriteEl: null, active: false, animalKey: null, loading: false,
  sprites: { cat:"cat_walk", dog:"dog_walk", rabbit:"rabbit_walk", panda:"panda_walk", fox:"fox_walk", pig:"pig_walk" },
  start(animalKey) {
    const bigEl = document.getElementById("animal-big-icon");
    if (!bigEl) return;
    const sprite = this.sprites[animalKey];
    if (!sprite) return;
    if ((this.active || this.loading) && this.animalKey === animalKey) return;
    this.stop();
    this.animalKey = animalKey;
    this.loading = true;
    const url = "images/walk/" + sprite + ".webp";
    const test = new Image();
    test.onload = () => {
      this.loading = false;
      // 載入期間可能已經 stop 或換動物
      if (this.animalKey !== animalKey) return;
      const el = document.getElementById("animal-big-icon");
      if (!el) return;
      const staticImg = el.querySelector(":scope > img");
      if (staticImg) staticImg.style.display = "none";
      const d = document.createElement("div");
      d.id = "walk-sprite";
      d.style.cssText = "width:110px;height:110px;background-repeat:no-repeat;margin:0 auto;";
      d.style.backgroundImage = 'url("' + url + '")';
      d.style.backgroundSize = "400% 100%";
      d.style.backgroundPosition = "0 0";
      el.insertBefore(d, el.firstChild);
      this.spriteEl = d;
      this.current = 0;
      this.active = true;
      this.timer = setInterval(() => this.next(), 200);
    };
    test.onerror = () => {
      this.loading = false;
      this.animalKey = null;
      this.active = false;
      // 載入失敗：保持靜態圖（優雅 fallback）
    };
    test.src = url;
  },
  next() {
    this.current = (this.current + 1) % this.frames;
    if (this.spriteEl) this.spriteEl.style.backgroundPosition = (this.current * 100 / 3) + "% 0";
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.loading = false;
    if (this.spriteEl) { this.spriteEl.remove(); this.spriteEl = null; }
    const bigEl = document.getElementById("animal-big-icon");
    if (bigEl) {
      const staticImg = bigEl.querySelector(":scope > img");
      if (staticImg) staticImg.style.display = "";
    }
    this.active = false; this.animalKey = null; this.current = 0;
  }
};

/* ===== 日夜循環 ===== */
function getTaipeiHour() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", hour: "numeric", hour12: false }).formatToParts(new Date());
    const h = parts.find(p => p.type === "hour");
    return parseInt(h.value, 10) % 24;
  } catch (e) { return new Date().getHours(); }
}
function isNightTime() {
  const h = getTaipeiHour();
  return h >= 18 || h < 6;
}
function updateDayNight() {
  const scene = document.getElementById("farm-scene");
  if (!scene) return;
  const night = isNightTime();
  scene.classList.toggle("farm-night", night);
  // 晚上燈籠發光由 CSS #farm-scene.farm-night .deco-item.lamp-glow 自動處理
}
setInterval(updateDayNight, 60000);
setTimeout(updateDayNight, 2000);

/* ===== 天氣系統 ===== */
const WEATHER_ICON = { sunny: "☀️", rain: "🌧️", rainbow: "🌈" };
function getWeather() {
  try {
    const d = JSON.parse(localStorage.getItem("wws_weather") || "{}");
    const now = Date.now();
    // 每小時重新隨機
    if (!d.ts || now - d.ts > 3600000) {
      const r = Math.random();
      let w = "sunny";
      if (r < 0.10) w = "rainbow";
      else if (r < 0.30) w = "rain";
      const nd = { w, ts: now };
      localStorage.setItem("wws_weather", JSON.stringify(nd));
      // 天氣變化影響心情
      applyWeatherMood(w, d.w);
      return w;
    }
    return d.w || "sunny";
  } catch (e) { return "sunny"; }
}
function applyWeatherMood(newW, oldW) {
  if (newW === oldW) return;
  try {
    const a = typeof getAnimal === "function" ? getAnimal() : null;
    if (!a || typeof addMood !== "function") return;
    if (newW === "rainbow") {
      addMood(a.audioKey, 10);
      setTimeout(() => alert("🌈 天空出現彩虹了！小動物好開心！心情 +10"), 800);
    } else if (newW === "rain") {
      addMood(a.audioKey, -3);
    } else if (newW === "sunny" && oldW === "rain") {
      addMood(a.audioKey, 1);
    }
  } catch (e) {}
}
function renderWeather() {
  const w = getWeather();
  const scene = document.getElementById("farm-scene");
  if (scene) {
    scene.classList.toggle("weather-rain", w === "rain");
    scene.classList.toggle("weather-rainbow", w === "rainbow");
  }
  // 雨滴
  const layer = document.getElementById("farm-rain-layer");
  if (layer) {
    layer.innerHTML = "";
    if (w === "rain") {
      for (let i = 0; i < 40; i++) {
        const d = document.createElement("div");
        d.className = "rain-drop";
        d.style.left = Math.random() * 100 + "%";
        d.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s";
        d.style.animationDuration = (0.5 + Math.random() * 0.4).toFixed(2) + "s";
        layer.appendChild(d);
      }
    }
  }
  // HUD 圖示
  const icon = document.getElementById("hud-weather");
  if (icon) {
    icon.textContent = WEATHER_ICON[w] || "☀️";
    icon.title = w === "sunny" ? "晴天" : w === "rain" ? "雨天（心情-3）" : "彩虹！（心情+10）";
  }
}
setInterval(renderWeather, 60000);
setTimeout(renderWeather, 2500);

/* ===== 好友系統（NPC農場拜訪） ===== */
const NPC_FRIENDS=[
{id:"xiaoming",name:"小明",avatar:"🧑",desc:"貓咪大師，農場超豪華！",animal:{icon:"🐱",name:"金冠咪",img:"images/cat_stage3.png",level:12},deco:[{id:"castle",x:60,y:50,s:64},{id:"fountain",x:30,y:65,s:48},{id:"tree",x:15,y:55,s:48},{id:"tree",x:80,y:60,s:48},{id:"flowerbed",x:40,y:70,s:40},{id:"lamp",x:50,y:60,s:36},{id:"bench",x:70,y:72,s:40}]},
{id:"xiaohua",name:"小華",avatar:"👧",desc:"兔子愛好者，花園主人！",animal:{icon:"🐰",name:"花花跳",img:"images/rabbit_stage2.png",level:5},deco:[{id:"flower",x:20,y:60,s:40},{id:"flower",x:35,y:68,s:40},{id:"flower",x:50,y:62,s:40},{id:"flower",x:65,y:70,s:40},{id:"sunflower",x:80,y:65,s:44},{id:"flowerbed",x:45,y:75,s:40},{id:"bowdeco",x:60,y:55,s:36}]},
{id:"xiaomei",name:"小美",avatar:"👩",desc:"狐狸主人，城堡公主！",animal:{icon:"🦊",name:"月影跳",img:"images/fox_stage3.png",level:9},deco:[{id:"castle",x:50,y:48,s:72},{id:"pond",x:25,y:68,s:52},{id:"windmill",x:78,y:58,s:52},{id:"flower",x:35,y:72,s:36},{id:"mushroom",x:65,y:75,s:32},{id:"lamp",x:45,y:65,s:36}]}
];
function getSocialClaimed(){try{return JSON.parse(localStorage.getItem("wws_social")||"{}")}catch(e){return{}}}
function saveSocialClaimed(d){localStorage.setItem("wws_social",JSON.stringify(d))}
function todayStr(){return new Date().toISOString().slice(0,10)}
function openFriends(){
let m=document.getElementById("friend-modal");if(m)m.remove();
m=document.createElement("div");m.id="friend-modal";
m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
const claimed=getSocialClaimed(),today=todayStr();
const cards=NPC_FRIENDS.map(f=>{
const got=claimed[f.id]===today;
return '<div style="background:#fff;border-radius:16px;padding:14px;margin-bottom:10px;display:flex;align-items:center;gap:12px">'
+'<div style="font-size:44px">'+f.avatar+'</div>'
+'<div style="flex:1"><div style="font-size:16px;font-weight:bold">'+f.name+'</div>'
+'<div style="font-size:12px;color:#666">'+f.desc+'</div>'
+'<div style="font-size:12px;color:#999">'+f.animal.icon+' '+f.animal.name+' Lv.'+f.animal.level+'</div></div>'
+'<button onclick="visitFriend(\''+f.id+'\')" style="padding:10px 16px;font-size:14px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#66bb6a,#43a047);border:none;border-radius:12px;cursor:pointer">🏡 拜訪</button>'
+(got?'<div style="font-size:11px;color:#2e7d32">✅ 已領獎勵</div>':'<div style="font-size:11px;color:#f57f17">🎁 可領10點</div>')
+'</div>'}).join("");
m.innerHTML='<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto">'
+'<h2 style="margin:0 0 4px;font-size:20px;text-align:center">👥 我的好友</h2>'
+'<p style="text-align:center;font-size:12px;color:#666">每天首次拜訪每位好友可獲得 10 點社交獎勵！</p>'
+cards
+'<button onclick="document.getElementById(\'friend-modal\').remove()" style="margin-top:8px;width:100%;padding:12px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer">關閉</button></div>';
document.body.appendChild(m);
m.addEventListener("click",e=>{if(e.target===m)m.remove()});
}
function visitFriend(fid){
const f=NPC_FRIENDS.find(x=>x.id===fid);if(!f)return;
let m=document.getElementById("visit-modal");if(m)m.remove();
m=document.createElement("div");m.id="visit-modal";
m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:10002;display:flex;justify-content:center;align-items:center;padding:16px;";
const claimed=getSocialClaimed(),today=todayStr(),already=claimed[fid]===today;
const decos=f.deco.map(d=>{
const item=DECO_ITEMS.find(x=>x.id===d.id);const icon=item?item.icon:"❓";
return '<div style="position:absolute;left:'+d.x+'%;top:'+d.y+'%;font-size:'+(d.s||44)+'px;transform:translate(-50%,-50%)">'+icon+'</div>'}).join("");
m.innerHTML='<div style="background:#fff;border-radius:24px;padding:16px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto">'
+'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
+'<h2 style="margin:0;font-size:18px">'+f.avatar+' '+f.name+' 的農場</h2>'
+'<button onclick="document.getElementById(\'visit-modal\').remove()" style="padding:8px 14px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;cursor:pointer">✖</button></div>'
+'<div style="position:relative;width:100%;height:300px;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,#4fc3f7 0%,#81d4fa 45%,#7cc46a 45%,#5aa84f 100%)">'
+decos
+'<div style="position:absolute;left:50%;top:72%;transform:translate(-50%,-50%);text-align:center">'
+'<img src="'+f.animal.img+'" style="width:90px;height:90px;object-fit:contain" onerror="this.outerHTML=\'<div style=font-size:64px>'+f.animal.icon+'</div>\'">'
+'<div style="font-size:13px;font-weight:bold;background:rgba(255,255,255,.85);border-radius:10px;padding:2px 10px;margin-top:2px">'+f.animal.name+' Lv.'+f.animal.level+'</div></div>'
+'<div style="position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:11px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5)">👀 參觀模式（不能修改）</div></div>'
+(already
?'<div style="text-align:center;margin-top:10px;padding:10px;background:#e8f5e9;border-radius:12px;color:#2e7d32;font-weight:bold">✅ 今天已經領過 '+f.name+' 的社交獎勵了</div>'
:'<button onclick="claimSocial(\''+fid+'\')" style="margin-top:10px;width:100%;padding:14px;font-size:16px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ffa726,#fb8c00);border:none;border-radius:16px;cursor:pointer">🎁 領取社交獎勵 +10點</button>')
+'</div>';
document.body.appendChild(m);
m.addEventListener("click",e=>{if(e.target===m)m.remove()});
}
function claimSocial(fid){
const f=NPC_FRIENDS.find(x=>x.id===fid);if(!f)return;
const claimed=getSocialClaimed(),today=todayStr();
if(claimed[fid]===today){alert("今天已經領過了！");return;}
claimed[fid]=today;saveSocialClaimed(claimed);
kidPoints+=10;
try{localStorage.setItem("wws_points",kidPoints)}catch(e){}
const kp=document.getElementById("kid-points");if(kp)kp.textContent=kidPoints;
if(typeof updatePointsDisplay==="function")updatePointsDisplay();
if(typeof updateRpgHud==="function")updateRpgHud();
alert("🎉 拜訪 "+f.name+" 獲得社交獎勵 10 點！");
visitFriend(fid);
}

/* ===== 錯題改數字重出 ===== */
/* 只重新出題，絕不顯示答案 */
function _parseNum(s) {
  s = String(s).trim();
  var parts = s.split(".");
  return { val: parseFloat(s), places: (parts[1] || "").length, digits: parts[0].length };
}
function _fmtNum(v, places) {
  if (places === 0) return String(Math.round(v));
  return Number(v).toFixed(places);
}
function _sameShapeNum(orig) {
  var intPart;
  if (orig.digits <= 1) intPart = 1 + Math.floor(Math.random() * 9);
  else intPart = Math.pow(10, orig.digits - 1) + Math.floor(Math.random() * 9 * Math.pow(10, orig.digits - 1));
  if (orig.places === 0) return { str: String(intPart), val: intPart };
  var dec = "";
  for (var i = 0; i < orig.places; i++) dec += Math.floor(Math.random() * 10);
  var str = intPart + "." + dec;
  return { str: str, val: parseFloat(str) };
}
function _roundP(v, places) {
  var f = Math.pow(10, places);
  return Math.round(v * f) / f;
}
function _calcNum(a, op, b) {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return b === 0 ? NaN : a / b;
  return NaN;
}
function _replaceNumbersInOrder(text, newStrs) {
  var i = 0;
  return String(text).replace(/\d+(?:\.\d+)?/g, function(m) {
    if (i >= newStrs.length) return m;
    return newStrs[i++];
  });
}
function _makeOptions(answerStr, ansVal, places) {
  var opts = [answerStr];
  var seen = {};
  seen[answerStr] = 1;
  var deltas = [1, -1, 2, -2, 3, -3, 10, -10, 5, -5];
  if (places > 0) { deltas.push(0.5, -0.5); }
  for (var k = 0; k < deltas.length; k++) {
    if (opts.length >= 4) break;
    var c = _roundP(ansVal + deltas[k], places);
    if (!isFinite(c) || c < 0) continue;
    if (Math.abs(c - ansVal) < 1e-9) continue;
    var s = _fmtNum(c, places);
    if (seen[s]) continue;
    seen[s] = 1; opts.push(s);
  }
  var extra = Math.ceil(ansVal) + 7;
  var guard = 0;
  while (opts.length < 4 && guard < 50) {
    guard++;
    var s2 = _fmtNum(extra, places);
    if (!seen[s2]) { seen[s2] = 1; opts.push(s2); }
    extra += 3;
  }
  return opts;
}
function _regenCalc(q) {
  if (/[\/]/.test(q.question)) return null; /* 分數題跳過 */
  var m = q.question.match(/^\s*(\d+(?:\.\d+)?)\s*([+\-×÷])\s*(\d+(?:\.\d+)?)\s*=\s*(__|\?)\s*$/);
  if (!m) return null;
  var op = m[2];
  var A = _parseNum(m[1]), B = _parseNum(m[3]);
  var origAns = _parseNum(String(q.answer));
  if (isNaN(origAns.val)) return null;
  var tail = m[4];
  for (var t = 0; t < 12; t++) {
    var na, nb, nv;
    var places = Math.max(A.places, B.places, origAns.places);
    if (op === "÷") {
      if (A.places > 0 || B.places > 0 || origAns.places > 0) return null;
      nb = _sameShapeNum(B);
      var kk = _sameShapeNum(origAns);
      if (nb.val === 0 || kk.val === 0) continue;
      na = { str: String(nb.val * kk.val), val: nb.val * kk.val };
      nv = kk.val;
    } else {
      na = _sameShapeNum(A); nb = _sameShapeNum(B);
      nv = _roundP(_calcNum(na.val, op, nb.val), places);
      if (!isFinite(nv)) continue;
      if (nv < 0 && origAns.val >= 0) {
        if (op === "-") { var tmp = na; na = nb; nb = tmp; nv = _roundP(_calcNum(na.val, op, nb.val), places); }
        else continue;
      }
      if (nv < 0) continue;
    }
    if (na.str === m[1] && nb.str === m[3]) continue;
    var ansStr = _fmtNum(nv, origAns.places);
    return {
      question: na.str + " " + op + " " + nb.str + " = " + tail,
      answer: ansStr,
      hint: _replaceNumbersInOrder(q.hint || "", [na.str, nb.str]),
      type: q.type, grade: q.grade,
      options: _makeOptions(ansStr, nv, origAns.places),
      addedAt: Date.now()
    };
  }
  return null;
}
function _regenFill(q) {
  if (/[\/]/.test(q.question)) return null;
  var m = q.question.match(/^\s*(\d+(?:\.\d+)?)\s*([+\-×÷])\s*__\s*=\s*(\d+(?:\.\d+)?)\s*$/);
  var leftBlank = false;
  if (!m) {
    m = q.question.match(/^\s*__\s*([+\-×÷])\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)\s*$/);
    leftBlank = true;
  }
  if (!m) return null;
  var op = leftBlank ? m[1] : m[2];
  var origAns = _parseNum(String(q.answer));
  if (isNaN(origAns.val)) return null;
  var places = origAns.places;
  for (var t = 0; t < 12; t++) {
    var na, nb, nc, missVal, question, hintNums;
    if (!leftBlank) {
      var A = _parseNum(m[1]);
      na = _sameShapeNum(A);
      var miss = _sameShapeNum(origAns);
      missVal = miss.val;
      if (op === "+") {
        nc = { str: _fmtNum(_roundP(na.val + missVal, places), places), val: _roundP(na.val + missVal, places) };
      } else if (op === "-") {
        if (missVal > na.val) continue;
        nc = { str: _fmtNum(_roundP(na.val - missVal, places), places), val: _roundP(na.val - missVal, places) };
      } else if (op === "×") {
        if (places > 0) return null;
        nc = { str: String(na.val * missVal), val: na.val * missVal };
      } else if (op === "÷") {
        if (places > 0 || missVal === 0) { if (places > 0) return null; continue; }
        var cc = Math.round(na.val / missVal);
        nc = { str: String(cc), val: cc };
        na = { str: String(cc * missVal), val: cc * missVal };
      } else continue;
      question = na.str + " " + op + " __ = " + nc.str;
      hintNums = [na.str, nc.str];
    } else {
      var B = _parseNum(m[2]);
      nb = _sameShapeNum(B);
      var miss2 = _sameShapeNum(origAns);
      missVal = miss2.val;
      if (op === "+") {
        nc = { str: _fmtNum(_roundP(missVal + nb.val, places), places), val: _roundP(missVal + nb.val, places) };
      } else if (op === "-") {
        nc = { str: _fmtNum(_roundP(missVal - nb.val, places), places), val: _roundP(missVal - nb.val, places) };
        if (nc.val < 0) continue;
      } else if (op === "×") {
        if (places > 0) return null;
        nc = { str: String(missVal * nb.val), val: missVal * nb.val };
      } else { continue; }
      question = "__ " + op + " " + nb.str + " = " + nc.str;
      hintNums = [nb.str, nc.str];
    }
    if (question === q.question) continue;
    var ansStr = _fmtNum(missVal, places);
    return {
      question: question, answer: ansStr,
      hint: _replaceNumbersInOrder(q.hint || "", hintNums),
      type: q.type, grade: q.grade,
      options: _makeOptions(ansStr, missVal, places),
      addedAt: Date.now()
    };
  }
  return null;
}
function _regenCompare(q) {
  var m = q.question.match(/^\s*(\d+(?:\.\d+)?)\s*__\s*(\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  var A = _parseNum(m[1]), B = _parseNum(m[2]);
  for (var t = 0; t < 12; t++) {
    var na = _sameShapeNum(A), nb = _sameShapeNum(B);
    if (na.str === m[1] && nb.str === m[2]) continue;
    var ans = na.val > nb.val ? "＞" : (na.val < nb.val ? "＜" : "＝");
    return {
      question: na.str + " __ " + nb.str,
      answer: ans,
      hint: _replaceNumbersInOrder(q.hint || "", [na.str, nb.str]),
      type: q.type, grade: q.grade,
      options: ["＞", "＜", "＝"],
      addedAt: Date.now()
    };
  }
  return null;
}
function _regenTrueFalse(q) {
  var m = q.question.match(/^(.*?)=\s*(\d+(?:\.\d+)?)\s*，對不對？\s*$/);
  if (!m || /[\/]/.test(m[1])) return null;
  var em = m[1].match(/^\s*(\d+(?:\.\d+)?)\s*([+\-×÷])\s*(\d+(?:\.\d+)?)\s*$/);
  if (!em) return null;
  var op = em[2];
  var A = _parseNum(em[1]), B = _parseNum(em[3]);
  var stated = _parseNum(m[2]);
  if (op === "÷" && (A.places > 0 || B.places > 0)) return null;
  for (var t = 0; t < 12; t++) {
    var na = _sameShapeNum(A), nb = _sameShapeNum(B);
    if (op === "÷" && nb.val === 0) continue;
    var places = Math.max(A.places, B.places, stated.places);
    var actual = _roundP(_calcNum(na.val, op, nb.val), places);
    if (!isFinite(actual)) continue;
    if (op === "-" && actual < 0) continue;
    var makeTrue = Math.random() < 0.5;
    var shownStr, ans;
    if (makeTrue) {
      shownStr = _fmtNum(actual, stated.places);
      ans = "⭕";
    } else {
      var delta = actual >= 10 ? 2 : 1;
      var wrong = _roundP(actual + (Math.random() < 0.5 ? delta : -delta), stated.places);
      if (wrong < 0) wrong = _roundP(actual + delta, stated.places);
      if (Math.abs(wrong - actual) < 1e-9) continue;
      shownStr = _fmtNum(wrong, stated.places);
      ans = "❌";
    }
    var question = na.str + " " + op + " " + nb.str + " = " + shownStr + "，對不對？";
    if (question === q.question) continue;
    return {
      question: question, answer: ans,
      hint: _replaceNumbersInOrder(q.hint || "", [na.str, nb.str]),
      type: q.type, grade: q.grade,
      options: ["⭕", "❌"],
      addedAt: Date.now()
    };
  }
  return null;
}
function _regenWord(q) {
  var numStrs = q.question.match(/\d+(?:\.\d+)?/g) || [];
  if (numStrs.length !== 2 || /[\/]/.test(q.question)) return null;
  var ansParsed = _parseNum(String(q.answer));
  if (isNaN(ansParsed.val)) return null;
  var n1 = _parseNum(numStrs[0]), n2 = _parseNum(numStrs[1]);
  var a = n1.val, b = n2.val, ans = ansParsed.val;
  var eps = 1e-9, op = null;
  if (Math.abs(a + b - ans) < eps) op = "+";
  else if (Math.abs(a - b - ans) < eps) op = "-";
  else if (Math.abs(b - a - ans) < eps) op = "-r";
  else if (Math.abs(a * b - ans) < eps) op = "×";
  else if (b !== 0 && Math.abs(a / b - ans) < eps) op = "÷";
  if (!op) return null;
  if (op === "÷" && (n1.places > 0 || n2.places > 0)) return null;
  var places = ansParsed.places;
  for (var t = 0; t < 12; t++) {
    var x = _sameShapeNum(n1), y = _sameShapeNum(n2), nv;
    if (op === "+") nv = _roundP(x.val + y.val, places);
    else if (op === "-") {
      if (ans >= 0 && x.val < y.val) { var s1 = x; x = y; y = s1; }
      nv = _roundP(x.val - y.val, places);
      if (nv < 0) continue;
    } else if (op === "-r") {
      if (y.val < x.val) { var s2 = x; x = y; y = s2; }
      nv = _roundP(y.val - x.val, places);
      if (nv < 0) continue;
    } else if (op === "×") nv = _roundP(x.val * y.val, places);
    else if (op === "÷") {
      if (y.val === 0) continue;
      var kk = _sameShapeNum(ansParsed);
      if (kk.val === 0) continue;
      x = { str: String(y.val * kk.val), val: y.val * kk.val };
      nv = kk.val;
    }
    if (!isFinite(nv)) continue;
    var ansStr = _fmtNum(nv, places);
    var newQ = _replaceNumbersInOrder(q.question, [x.str, y.str]);
    if (newQ === q.question) continue;
    return {
      question: newQ, answer: ansStr,
      hint: _replaceNumbersInOrder(q.hint || "", [x.str, y.str]),
      type: q.type, grade: q.grade,
      options: _makeOptions(ansStr, nv, places),
      addedAt: Date.now()
    };
  }
  return null;
}
function regenErrorQuestion(q) {
  try {
    var r = null;
    var type = q.type || "";
    if (type === "計算題" || type === "選擇題") r = _regenCalc(q);
    else if (type === "填充題") r = _regenFill(q);
    else if (type === "比大小") r = _regenCompare(q);
    else if (type === "是非題") r = _regenTrueFalse(q);
    else if (type === "應用題") r = _regenWord(q);
    if (r) { r._origQuestion = q.question; return r; }
  } catch (e) {}
  return q;
}


/* ===== 放置獎勵系統（微放置養成） ===== */
(function(){
var st=document.createElement("style");
st.textContent="@keyframes idleFloat{0%{opacity:0;transform:translate(-50%,-30%)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-130%)}}"
+"@keyframes discoveryBounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-10px)}}"
+"#discovery-bubble{position:absolute;left:50%;top:-14px;transform:translateX(-50%);font-size:34px;z-index:60;cursor:pointer;animation:discoveryBounce 1s ease infinite;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));}"
+"#income-badge{position:absolute;top:8px;right:8px;z-index:55;padding:8px 14px;font-size:15px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ffa726,#fb8c00);border:none;border-radius:20px;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,.3);animation:discoveryBounce 1.2s ease infinite;}";
document.head.appendChild(st);
})();

/* 共用：發放點數（更新顯示+HUD+今日統計） */
function grantPoints(n){
if(!n||n<=0)return;
kidPoints+=n;
lsSet(LS_KEYS.points,kidPoints);
var kp=document.getElementById("kid-points");
if(kp)kp.textContent=kidPoints;
if(typeof updatePointsDisplay==="function")updatePointsDisplay();
if(typeof updateRpgHud==="function")updateRpgHud();
if(typeof addTodayPoints==="function")addTodayPoints(n);
}

/* 農場飄字 */
function floatText(txt,xPct,yPct){
var farm=document.getElementById("farm-scene");
if(!farm)return;
var el=document.createElement("div");
el.textContent=txt;
el.style.cssText="position:absolute;left:"+(xPct||50)+"%;top:"+(yPct||40)+"%;font-size:20px;font-weight:bold;color:#ffd54f;text-shadow:0 2px 4px rgba(0,0,0,.55);z-index:50;pointer-events:none;animation:idleFloat 2s ease forwards;";
farm.appendChild(el);
setTimeout(function(){el.remove();},2100);
}

/* ---------- 1. 散步發現 ---------- */
function getDiscovery(){try{return JSON.parse(localStorage.getItem("wws_discovery")||"{}");}catch(e){return{};}}
function saveDiscovery(d){try{localStorage.setItem("wws_discovery",JSON.stringify(d));}catch(e){}}
function checkWalkDiscovery(){
var d=getDiscovery(),now=Date.now();
if(now-(d.last||0)<30*60000)return;                 /* 30 分鐘冷卻 */
if(document.getElementById("discovery-bubble"))return; /* 已有未領取 */
if(Math.random()>0.35)return;                          /* 35% 機率 */
d.last=now;saveDiscovery(d);
showDiscoveryBubble();
}
function showDiscoveryBubble(){
var walker=document.getElementById("animal-walker");
if(!walker||document.getElementById("discovery-bubble"))return;
var b=document.createElement("div");
b.id="discovery-bubble";
b.textContent="❗";
b.title="小動物發現了東西！點我領取";
b.onclick=function(e){e.stopPropagation();claimDiscovery();};
walker.appendChild(b);
}
function claimDiscovery(){
var b=document.getElementById("discovery-bubble");
if(b)b.remove();
var a=(typeof getAnimal==="function")?getAnimal():null;
var key=a?a.audioKey:"cat";
var roll=Math.random(),msg;
if(roll<0.5){
var pts=5+Math.floor(Math.random()*11); /* 5-15 點 */
grantPoints(pts);
msg="🎁 散步發現小禮物！\n獲得 "+pts+" 點！";
}else if(roll<0.8){
if(typeof addFood==="function")addFood("feed",1);
if(typeof renderFeedZone==="function")renderFeedZone();
msg="🎁 散步發現小禮物！\n獲得 🍚 普通飼料 x1！";
}else{
if(typeof addMood==="function")addMood(key,10);
msg="🎁 發現漂亮的小花！\n小動物心情 +10 😊";
}
floatText("🎁",50,30);
markDailyIdleDone();
setTimeout(function(){alert(msg);},300);
}

/* ---------- 2. 裝飾產出 ---------- */
const DECO_INCOME={
well:{points:5,label:"💧 水井產出"},
appletree:{points:8,label:"🍎 蘋果樹產出"},
fountain:{points:10,label:"⛲ 噴泉產出"},
castle:{points:20,label:"🏰 城堡稅收"}
};
function getDecoIncome(){try{return JSON.parse(localStorage.getItem("wws_decoincome")||"{}");}catch(e){return{};}}
function saveDecoIncome(d){try{localStorage.setItem("wws_decoincome",JSON.stringify(d));}catch(e){}}
function checkDecoIncome(){
var st=getDecoIncome(),now=Date.now();
if(now-(st.last||0)<3600000)return; /* 每小時結算一次 */
var placed=(typeof getDeco==="function")?getDeco():[];
var total=0,labels=[];
placed.forEach(function(p){
var inc=DECO_INCOME[p.id];
if(inc){total+=inc.points;labels.push(inc.label+" +"+inc.points);}
});
st.last=now;
if(total>0){
st.pending=(st.pending||0)+total;
st.log=labels;
floatText("💰 待領取 +"+total,50,35);
}
saveDecoIncome(st);
renderIncomeBadge();
}
function renderIncomeBadge(){
var farm=document.getElementById("farm-scene");
if(!farm)return;
var old=document.getElementById("income-badge");
if(old)old.remove();
var pending=getDecoIncome().pending||0;
if(pending<=0)return;
var b=document.createElement("button");
b.id="income-badge";
b.textContent="💰 +"+pending+" 領取";
b.onclick=claimDecoIncome;
farm.appendChild(b);
}
function claimDecoIncome(){
var st=getDecoIncome(),pending=st.pending||0;
if(pending<=0){alert("目前沒有待領取的產出喔！\n多放水井、蘋果樹、噴泉、城堡可以自動賺點數 🏡");return;}
grantPoints(pending);
st.pending=0;saveDecoIncome(st);
renderIncomeBadge();
markDailyIdleDone();
var log=(st.log||[]).join("\n");
setTimeout(function(){alert("💰 領取裝飾產出！\n"+log+"\n共獲得 "+pending+" 點！");},300);
}

/* ---------- 3. 離線獎勵 ---------- */
function touchLastSeen(){try{localStorage.setItem("wws_lastseen",String(Date.now()));}catch(e){}}
function checkOfflineReward(){
var last=0;
try{last=parseInt(localStorage.getItem("wws_lastseen")||"0",10)||0;}catch(e){}
touchLastSeen();
if(!last)return; /* 首次開啟不發 */
var hours=Math.min(8,Math.floor((Date.now()-last)/3600000));
if(hours<1)return;
var pts=hours*10,xp=hours*5;
grantPoints(pts);
var a=(typeof getAnimal==="function")?getAnimal():null;
if(a&&typeof addAnimalXP==="function")addAnimalXP(a.audioKey,xp);
setTimeout(function(){
alert("🎁 離線獎勵！\n小動物在你離開的 "+hours+" 小時裡乖乖長大～\n獲得 "+pts+" 點、"+xp+" 經驗！");
},1500);
}

/* ---------- 4. 每日任務擴充 ---------- */
const DAILY_TASKS=[
{id:"boss",name:"⚔️ 打敗 1 隻魔王",reward:30},
{id:"friend",name:"👥 拜訪 1 位好友",reward:15},
{id:"idle",name:"🎁 領取 1 次放置獎勵",reward:10}
];
function getDailyTasks(){
var d={};
try{d=JSON.parse(localStorage.getItem("wws_dailytasks")||"{}");}catch(e){}
if(d.date!==todayStr())d={date:todayStr(),done:{}};
return d;
}
function saveDailyTasks(d){try{localStorage.setItem("wws_dailytasks",JSON.stringify(d));}catch(e){}}
function markDailyTask(id){
var d=getDailyTasks();
if(d.done[id])return;
d.done[id]=true;saveDailyTasks(d);
var task=null;
DAILY_TASKS.forEach(function(t){if(t.id===id)task=t;});
if(task){
grantPoints(task.reward);
setTimeout(function(){alert("📅 每日任務完成！\n"+task.name+"\n獲得 "+task.reward+" 點！");},600);
}
renderDailyTasks();
}
/* 對外掛鉤：魔王系統打敗魔王時呼叫 markDailyBossDone() */
function markDailyBossDone(){markDailyTask("boss");}
function markDailyFriendDone(){markDailyTask("friend");}
function markDailyIdleDone(){markDailyTask("idle");}
function renderDailyTasks(){
var d=getDailyTasks();
var list=document.getElementById("daily-task-list");
if(!list){
var container=document.getElementById("daily-task");
if(!container)return;
list=document.createElement("div");
list.id="daily-task-list";
list.style.cssText="margin-top:8px;display:flex;flex-direction:column;gap:6px;";
container.appendChild(list);
}
var doneCount=0;
var html="";
DAILY_TASKS.forEach(function(t){
var done=!!d.done[t.id];
if(done)doneCount++;
html+='<div style="display:flex;justify-content:space-between;align-items:center;background:'+(done?"#e8f5e9":"#fff")+';border-radius:10px;padding:8px 12px;font-size:14px;">'
+'<span>'+(done?"✅":"⬜")+" "+t.name+'</span>'
+'<span style="color:#b8860b;font-weight:bold">+'+t.reward+'點</span></div>';
});
list.innerHTML=html;
var title=document.querySelector("#daily-task .dt-title");
if(title)title.textContent="📅 今日任務（"+doneCount+"/"+DAILY_TASKS.length+"）";
}

/* 好友拜訪掛鉤：拜訪即算完成每日好友任務 */
(function hookFriendDaily(){
if(typeof visitFriend==="function"&&!visitFriend._idleHooked){
var _orig=visitFriend;
var wrapped=function(fid){try{markDailyFriendDone();}catch(e){}return _orig.apply(this,arguments);};
wrapped._idleHooked=true;
visitFriend=wrapped;
}
})();

/* ---------- 初始化 ---------- */
function initIdleSystem(){
checkOfflineReward();   /* 離線獎勵（只在載入時算一次） */
checkDecoIncome();
renderIncomeBadge();
renderDailyTasks();
checkWalkDiscovery();
setInterval(function(){
checkWalkDiscovery();
checkDecoIncome();
touchLastSeen();
},60000); /* 每分鐘檢查 */
}
if(document.readyState==="loading"){
document.addEventListener("DOMContentLoaded",function(){setTimeout(initIdleSystem,2000);});
}else{
setTimeout(initIdleSystem,2000);
}

/* ===== 魔王戰鬥系統 ===== */
const BOSSES = [
  {id:'slime', name:'史萊姆王', icon:'🟢', img:'images/boss/boss_slime.webp', hp:100, reward:{points:50, xp:30}},
  {id:'wolf', name:'暗黑狼王', icon:'🐺', img:'images/boss/boss_wolf.webp', hp:300, reward:{points:150, xp:80}},
  {id:'wizard', name:'混沌法師', icon:'🧙', img:'images/boss/boss_wizard.webp', hp:600, reward:{points:300, xp:150}},
  {id:'dragon', name:'深淵魔龍', icon:'🐉', img:'images/boss/boss_dragon.webp', hp:1200, reward:{points:600, xp:300}},
  {id:'demon', name:'終極魔王', icon:'👹', img:'images/boss/boss_demon.webp', hp:2500, reward:{points:1200, xp:600}},
];
const BOSS_GRADE_DMG = {"低年級":10, "中年級":25, "高年級":50};
const BOSS_GRADE_LABEL = {"低年級":"🌱 低年級 ×1", "中年級":"🌿 中年級 ×2.5", "高年級":"🌳 高年級 ×5"};
let bossBattle = null;
let bossSelGrade = "低年級";
let bossSelId = "slime";

function getBossWins(){ try{ return JSON.parse(localStorage.getItem("wws_boss_wins")||"{}"); }catch(e){ return {}; } }
function saveBossWins(d){ localStorage.setItem("wws_boss_wins", JSON.stringify(d)); }

function bossImgHtml(boss, size){
  const s = size || 120;
  return '<span style="position:relative;display:inline-block;width:'+s+'px;height:'+s+'px;">'
    + '<span style="font-size:'+Math.round(s*0.75)+'px;line-height:'+s+'px;">'+boss.icon+'</span>'
    + '<img src="'+boss.img+'" alt="'+boss.name+'" style="position:absolute;top:0;left:0;width:'+s+'px;height:'+s+'px;object-fit:contain;" onerror="this.remove();">'
    + '</span>';
}

function openBossBattle(){
  const old = document.getElementById("boss-select-modal");
  if (old) old.remove();
  const wins = getBossWins();
  const cards = BOSSES.map(function(b){
    const w = wins[b.id] || 0;
    const sel = bossSelId === b.id;
    return '<div onclick="bossSelId=\''+b.id+'\';openBossBattle();" style="background:'+(sel?'#fff3e0':'#fff')+';border:'+(sel?'3px solid #ff9800':'2px solid #e0e0e0')+';border-radius:16px;padding:12px;text-align:center;cursor:pointer;position:relative;">'
      + (w>0?'<div style="position:absolute;top:6px;right:6px;background:#4caf50;color:#fff;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:10px;">🏆×'+w+'</div>':'')
      + '<div>'+bossImgHtml(b, 72)+'</div>'
      + '<div style="font-size:15px;font-weight:bold;margin-top:4px;">'+b.name+'</div>'
      + '<div style="font-size:12px;color:#c62828;">❤️ '+b.hp+'</div>'
      + '<div style="font-size:12px;color:#f57f17;">🪙'+b.reward.points+' ⭐'+b.reward.xp+'</div>'
      + '</div>';
  }).join("");
  const grades = Object.keys(BOSS_GRADE_LABEL).map(function(g){
    const sel = bossSelGrade === g;
    return '<button onclick="bossSelGrade=\''+g+'\';openBossBattle();" style="flex:1;padding:10px 4px;font-size:14px;font-weight:bold;border-radius:12px;border:'+(sel?'3px solid #4caf50':'2px solid #e0e0e0')+';background:'+(sel?'#e8f5e9':'#fff')+';cursor:pointer;">'+BOSS_GRADE_LABEL[g]+'</button>';
  }).join("");
  const m = document.createElement("div");
  m.id = "boss-select-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:10002;display:flex;justify-content:center;align-items:center;padding:16px;";
  m.innerHTML = '<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:520px;width:100%;max-height:88vh;overflow-y:auto;">'
    + '<h2 style="margin:0 0 4px;font-size:22px;text-align:center;">👹 魔王戰</h2>'
    + '<p style="text-align:center;font-size:13px;color:#666;margin:0 0 12px;">答對打擊魔王！答錯會被反擊！難度越高傷害越高！</p>'
    + '<div style="font-size:14px;font-weight:bold;margin-bottom:6px;">1️⃣ 選擇難度（傷害倍率）</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:14px;">'+grades+'</div>'
    + '<div style="font-size:14px;font-weight:bold;margin-bottom:6px;">2️⃣ 選擇魔王</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">'+cards+'</div>'
    + '<button onclick="startBossBattle()" style="width:100%;padding:14px;font-size:18px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ef5350,#c62828);border:none;border-radius:16px;cursor:pointer;box-shadow:0 4px 12px rgba(239,83,80,.4);">⚔️ 開戰！</button>'
    + '<button onclick="document.getElementById(\'boss-select-modal\').remove();" style="margin-top:10px;width:100%;padding:10px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">關閉</button>'
    + '</div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e){ if(e.target===m) m.remove(); });
}

function startBossBattle(){
  const sel = document.getElementById("boss-select-modal");
  if (sel) sel.remove();
  const boss = BOSSES.find(function(b){ return b.id===bossSelId; }) || BOSSES[0];
  bossBattle = {
    boss: boss, grade: bossSelGrade,
    bossHp: boss.hp, maxBossHp: boss.hp,
    playerHp: 100, maxPlayerHp: 100,
    askedIds: [], over: false, q: null
  };
  quizStreak = 0;
  renderBossArena();
  nextBossQuestion();
}

function renderBossArena(){
  const old = document.getElementById("boss-arena-modal");
  if (old) old.remove();
  const b = bossBattle.boss;
  const a = getAnimal();
  const m = document.createElement("div");
  m.id = "boss-arena-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#1a1a2e 0%,#3d0c0c 100%);z-index:10002;display:flex;justify-content:center;align-items:flex-start;padding:12px;overflow-y:auto;";
  m.innerHTML = '<style>'
    + '@keyframes bossShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-14px) rotate(-4deg)}40%{transform:translateX(12px) rotate(3deg)}60%{transform:translateX(-8px)}80%{transform:translateX(6px)}}'
    + '@keyframes playerShake{0%,100%{transform:translateX(0)}25%{transform:translateX(10px)}50%{transform:translateX(-10px)}75%{transform:translateX(6px)}}'
    + '@keyframes dmgFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-70px) scale(1.3)}}'
    + '@keyframes bossIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}'
    + '.boss-shake{animation:bossShake .45s ease;}'
    + '.player-shake{animation:playerShake .45s ease;}'
    + '.dmg-num{position:absolute;font-weight:bold;pointer-events:none;animation:dmgFloat 1.1s ease forwards;z-index:50;text-shadow:0 2px 4px rgba(0,0,0,.5);}'
    + '</style>'
    + '<div id="boss-arena-inner" style="width:100%;max-width:480px;position:relative;">'
    + '<div style="background:rgba(0,0,0,.45);border:2px solid #c62828;border-radius:16px;padding:12px;margin-bottom:10px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;color:#fff;"><span style="font-size:17px;font-weight:bold;">'+b.icon+' '+b.name+'</span><span id="boss-hp-text" style="font-size:14px;font-weight:bold;">'+b.hp+'/'+b.hp+'</span></div>'
    + '<div style="height:16px;background:#330000;border-radius:8px;margin-top:6px;overflow:hidden;border:1px solid #7f0000;"><div id="boss-hp-fill" style="height:100%;width:100%;background:linear-gradient(90deg,#ef5350,#ff7961);border-radius:8px;transition:width .4s;"></div></div>'
    + '</div>'
    + '<div id="boss-sprite-wrap" style="text-align:center;position:relative;min-height:150px;animation:bossIdle 2.5s ease-in-out infinite;">'
    + '<div id="boss-sprite">'+bossImgHtml(b, 140)+'</div>'
    + '<div id="boss-dmg-layer" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;"></div>'
    + '</div>'
    + '<div id="boss-player-bar" style="background:rgba(0,0,0,.45);border:2px solid #2e7d32;border-radius:16px;padding:10px 12px;margin:10px 0;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;color:#fff;"><span style="font-size:14px;font-weight:bold;">'+a.icon+' '+getEvolutionInfo(a.audioKey).name+' <span style="font-size:12px;color:#ffd54f;">'+BOSS_GRADE_LABEL[bossBattle.grade]+'</span></span><span style="font-size:13px;">🔥連擊 <b id="boss-streak">x0</b></span></div>'
    + '<div style="height:12px;background:#0a330a;border-radius:6px;margin-top:6px;overflow:hidden;"><div id="player-hp-fill" style="height:100%;width:100%;background:linear-gradient(90deg,#66bb6a,#9ccc65);border-radius:6px;transition:width .4s;"></div></div>'
    + '<div id="player-hp-text" style="font-size:12px;color:#a5d6a7;text-align:right;">100/100</div>'
    + '</div>'
    + '<div style="background:#fff;border-radius:16px;padding:16px;">'
    + '<div id="boss-q-text" style="font-size:19px;font-weight:bold;line-height:1.7;text-align:center;min-height:60px;">載入題目中…</div>'
    + '<div id="boss-q-opts" style="display:flex;flex-direction:column;gap:10px;margin-top:12px;"></div>'
    + '<div id="boss-q-fb" style="text-align:center;font-size:16px;font-weight:bold;min-height:28px;margin-top:8px;"></div>'
    + '</div>'
    + '<button onclick="bossEscape()" style="margin-top:10px;width:100%;padding:10px;background:rgba(255,255,255,.15);color:#fff;border:2px solid rgba(255,255,255,.4);border-radius:12px;font-size:14px;font-weight:bold;cursor:pointer;">🏳️ 逃跑</button>'
    + '</div>';
  document.body.appendChild(m);
}

function updateBossBars(){
  if(!bossBattle) return;
  const bf = document.getElementById("boss-hp-fill");
  const bt = document.getElementById("boss-hp-text");
  if(bf) bf.style.width = Math.max(0, bossBattle.bossHp / bossBattle.maxBossHp * 100) + "%";
  if(bt) bt.textContent = Math.max(0, bossBattle.bossHp) + "/" + bossBattle.maxBossHp;
  const pf = document.getElementById("player-hp-fill");
  const pt = document.getElementById("player-hp-text");
  if(pf) pf.style.width = Math.max(0, bossBattle.playerHp / bossBattle.maxPlayerHp * 100) + "%";
  if(pt) pt.textContent = Math.max(0, bossBattle.playerHp) + "/" + bossBattle.maxPlayerHp;
  const st = document.getElementById("boss-streak");
  if(st) st.textContent = "x" + quizStreak;
}

function bossDamageNum(text, color, isPlayer){
  const layer = document.getElementById("boss-dmg-layer");
  if(!layer) return;
  const d = document.createElement("div");
  d.className = "dmg-num";
  d.style.cssText += "left:"+(20+Math.random()*60)+"%;top:30%;font-size:"+(isPlayer?22:34)+"px;color:"+color+";";
  d.textContent = text;
  layer.appendChild(d);
  setTimeout(function(){ d.remove(); }, 1150);
}

async function nextBossQuestion(){
  if(!bossBattle || bossBattle.over) return;
  const qt = document.getElementById("boss-q-text");
  const qo = document.getElementById("boss-q-opts");
  const qf = document.getElementById("boss-q-fb");
  if(qf) qf.textContent = "";
  if(qo) qo.innerHTML = "";
  if(qt) qt.textContent = getAnimal().icon + " 正在想題目…";
  try{
    const bank = await loadBank(bossBattle.grade);
    let q = bank ? pickFromBank(bossBattle.grade, bossBattle.askedIds) : null;
    if(!q){ if(qt) qt.textContent = "題庫載入失敗，請稍後再試"; return; }
    if(q.id) bossBattle.askedIds.push(q.id);
    bossBattle.q = q;
    if(qt) qt.textContent = q.question;
    if(qo){
      qo.innerHTML = "";
      const opts = q.options || [];
      if(!opts.length){
        qo.innerHTML = '<p style="text-align:center;color:#888;">這題沒有選項，請回農場用拍照模式作答</p>';
        return;
      }
      opts.forEach(function(opt){
        const b = document.createElement("button");
        b.style.cssText = "font-size:20px;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#7e57c2,#5c6bc0);color:#fff;font-weight:bold;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,.2);";
        if(opt==="⭕"||opt==="❌") b.style.fontSize = "34px";
        b.textContent = opt;
        b.onclick = function(){ submitBossAnswer(opt, b); };
        qo.appendChild(b);
      });
    }
  }catch(e){
    if(qt) qt.textContent = "題目載入失敗，請重試";
  }
}

function submitBossAnswer(opt, btn){
  if(!bossBattle || bossBattle.over || !bossBattle.q) return;
  const q = bossBattle.q;
  const qf = document.getElementById("boss-q-fb");
  document.querySelectorAll("#boss-q-opts button").forEach(function(b){ b.disabled = true; });
  const correct = normAns(String(opt).trim()) === normAns(q.answer);
  const a = getAnimal();
  if(correct){
    quizStreak++;
    if(typeof checkAchv === "function") checkAchv("streak", quizStreak);
    if(typeof incStat === "function") incStat("correct", 1);
    if(typeof addMood === "function") addMood(a.audioKey, 3);
    const base = BOSS_GRADE_DMG[bossBattle.grade];
    const isCrit = Math.random() < 0.15;
    let dmg = Math.round(base * (1 + quizStreak * 0.1) * (isCrit ? 2 : 1));
    let skillMsg = "";
    try{
      const skill = triggerCorrectSkill();
      if(skill.bonus === -1){ dmg *= 2; skillMsg = " " + skill.msg; }
      else if(skill.bonus > 0){ dmg += skill.bonus; skillMsg = " " + skill.msg; }
    }catch(e){}
    bossBattle.bossHp -= dmg;
    updateBossBars();
    const sp = document.getElementById("boss-sprite");
    if(sp){ sp.classList.remove("boss-shake"); void sp.offsetWidth; sp.classList.add("boss-shake"); }
    bossDamageNum((isCrit?"💥 ":"")+"-"+dmg, isCrit?"#ffeb3b":"#ffffff", false);
    if(qf){ qf.style.color = "#2e7d32"; qf.textContent = "⚔️ 命中！"+(isCrit?" 暴擊！":"")+skillMsg; }
    if(btn){ btn.style.background = "linear-gradient(135deg,#66bb6a,#43a047)"; }
    try{ if(typeof playAnimalSound==="function") playAnimalSound("praise"+(1+Math.floor(Math.random()*3)), a.praise[Math.floor(Math.random()*a.praise.length)]); }catch(e){}
    setTimeout(function(){
      if(!bossBattle || bossBattle.over) return;
      if(bossBattle.bossHp <= 0){ bossVictory(); }
      else { nextBossQuestion(); }
    }, 1100);
  }else{
    let keepMsg = "";
    try{
      const skill = triggerWrongSkill();
      if(skill.keep){ keepMsg = " " + skill.msg; } else { quizStreak = 0; }
    }catch(e){ quizStreak = 0; }
    if(typeof addMood === "function") addMood(a.audioKey, -5);
    const counter = 10 + Math.floor(Math.random()*11);
    bossBattle.playerHp -= counter;
    updateBossBars();
    const pb = document.getElementById("boss-player-bar");
    if(pb){ pb.classList.remove("player-shake"); void pb.offsetWidth; pb.classList.add("player-shake"); }
    const sp = document.getElementById("boss-sprite");
    if(sp){ sp.style.animation = "none"; }
    bossDamageNum("-"+counter, "#ff5252", true);
    if(qf){ qf.style.color = "#c62828"; qf.textContent = "💢 魔王反擊！-"+counter+" HP"+keepMsg; }
    if(btn){ btn.style.background = "linear-gradient(135deg,#9e9e9e,#757575)"; }
    try{ if(typeof playAnimalSound==="function") playAnimalSound("encourage", a.encourage); }catch(e){}
    setTimeout(function(){
      if(sp) sp.style.animation = "";
      if(!bossBattle || bossBattle.over) return;
      if(bossBattle.playerHp <= 0){ bossDefeat(); }
      else { nextBossQuestion(); }
    }, 1300);
  }
  updateBossBars();
}

function bossVictory(){
  if(!bossBattle) return;
  bossBattle.over = true;
  const b = bossBattle.boss;
  const wins = getBossWins();
  const prev = wins[b.id] || 0;
  const isFirst = prev === 0;
  wins[b.id] = prev + 1;
  saveBossWins(wins);
  const today = new Date().toISOString().slice(0,10);
  const dk = "wws_boss_daily";
  const dailyFirst = localStorage.getItem(dk) !== today;
  if(dailyFirst) localStorage.setItem(dk, today);
  let pts = b.reward.points, xp = b.reward.xp;
  const bonusLines = [];
  if(isFirst){ pts = Math.round(pts*1.5); xp = Math.round(xp*1.5); bonusLines.push("🎉 首次擊敗 +50%！"); }
  if(dailyFirst){ pts = Math.round(pts*1.5); xp = Math.round(xp*1.5); bonusLines.push("☀️ 每日首勝 ×1.5！"); }
  const sat = (typeof getSatiety==="function") ? getSatiety(getAnimal().audioKey) : 100;
  if(sat < 20){ xp = Math.ceil(xp/2); bonusLines.push("😢 肚子餓，經驗減半"); }
  addPoints(pts);
  addAnimalXP(getAnimal().audioKey, xp);
  if(typeof addMood==="function") addMood(getAnimal().audioKey, 10);
  try{ if(typeof launchConfetti==="function") launchConfetti(); }catch(e){}
  const arena = document.getElementById("boss-arena-modal");
  if(arena) arena.remove();
  const m = document.createElement("div");
  m.id = "boss-result-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10003;display:flex;justify-content:center;align-items:center;padding:16px;";
  m.innerHTML = '<div style="background:#fff;border-radius:24px;padding:28px;max-width:360px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4);">'
    + '<div style="font-size:56px;">🏆</div>'
    + '<h2 style="margin:8px 0;color:#f57f17;">勝利！</h2>'
    + '<p style="font-size:16px;">打敗了 <b>'+b.icon+' '+b.name+'</b>！</p>'
    + (bonusLines.length?'<div style="background:#fff8e1;border-radius:12px;padding:8px;margin:8px 0;font-size:14px;color:#e65100;">'+bonusLines.join("<br>")+'</div>':'')
    + '<div style="display:flex;gap:10px;justify-content:center;margin:12px 0;">'
    + '<div style="background:#fff3e0;border-radius:12px;padding:10px 18px;"><div style="font-size:13px;color:#999;">獲得點數</div><div style="font-size:22px;font-weight:bold;color:#f57f17;">🪙 '+pts+'</div></div>'
    + '<div style="background:#e8f5e9;border-radius:12px;padding:10px 18px;"><div style="font-size:13px;color:#999;">獲得經驗</div><div style="font-size:22px;font-weight:bold;color:#2e7d32;">⭐ '+xp+'</div></div>'
    + '</div>'
    + '<div style="font-size:13px;color:#999;">累計擊敗 '+b.name+' ×'+(prev+1)+'</div>'
    + '<button onclick="document.getElementById(\'boss-result-modal\').remove();openBossBattle();" style="margin-top:14px;width:100%;padding:14px;font-size:16px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ef5350,#c62828);border:none;border-radius:16px;cursor:pointer;">再打一場！</button>'
    + '<button onclick="document.getElementById(\'boss-result-modal\').remove();" style="margin-top:8px;width:100%;padding:10px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">回農場休息</button>'
    + '</div>';
  document.body.appendChild(m);
}

function bossDefeat(){
  if(!bossBattle) return;
  bossBattle.over = true;
  const b = bossBattle.boss;
  const arena = document.getElementById("boss-arena-modal");
  if(arena) arena.remove();
  const m = document.createElement("div");
  m.id = "boss-result-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10003;display:flex;justify-content:center;align-items:center;padding:16px;";
  m.innerHTML = '<div style="background:#fff;border-radius:24px;padding:28px;max-width:340px;width:100%;text-align:center;">'
    + '<div style="font-size:56px;">😵</div>'
    + '<h2 style="margin:8px 0;color:#666;">被打敗了…</h2>'
    + '<p style="font-size:15px;color:#666;">'+b.icon+' '+b.name+' 太強了！<br>多練習、升級小動物再來挑戰吧！</p>'
    + '<button onclick="document.getElementById(\'boss-result-modal\').remove();startBossBattle();" style="margin-top:14px;width:100%;padding:14px;font-size:16px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#66bb6a,#43a047);border:none;border-radius:16px;cursor:pointer;">💪 再試一次</button>'
    + '<button onclick="document.getElementById(\'boss-result-modal\').remove();openBossBattle();" style="margin-top:8px;width:100%;padding:10px;background:#78909c;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">換個魔王 / 難度</button>'
    + '<button onclick="document.getElementById(\'boss-result-modal\').remove();" style="margin-top:8px;width:100%;padding:10px;background:#e0e0e0;color:#666;border:none;border-radius:12px;font-size:14px;cursor:pointer;">回農場</button>'
    + '</div>';
  document.body.appendChild(m);
}

function bossEscape(){
  if(!bossBattle) return;
  if(confirm("確定要逃跑嗎？魔王血量會重置喔！")){
    bossBattle.over = true;
    const arena = document.getElementById("boss-arena-modal");
    if(arena) arena.remove();
  }
}

/* 魔王戰按鈕：加到農場按鈕列 */
setTimeout(function(){
  try{
    const bar = document.querySelector(".farm-ui-bar");
    if(bar && !document.getElementById("boss-battle-btn")){
      const b = document.createElement("button");
      b.id = "boss-battle-btn";
      b.className = "farm-btn";
      b.style.background = "linear-gradient(135deg,#ef5350,#b71c1c)";
      b.textContent = "👹 魔王戰";
      b.onclick = openBossBattle;
      bar.appendChild(b);
    }
  }catch(e){}
}, 1800);
