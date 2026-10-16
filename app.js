
let cropImg = null;       // 載入的原始圖片
let cropRect = null;      // 使用者框選的區域 {x,y,w,h}（canvas 座標）
let cropScale = 1;        // canvas 顯示 vs 原圖的縮放比
let cropB64 = null;       // 最終要送出的圖片 base64（框選或整張）
let isDragging = false, dragStart = null;
document.getElementById("photo").addEventListener("change", function(e) {
const f = e.target.files[0];
if (!f) return;
const img = new Image();
img.onload = () => {
cropImg = img;
cropRect = null;
cropB64 = null;
const cv = document.getElementById("crop-canvas");
const dispW = Math.min(560, img.width);
cropScale = img.width / dispW;
cv.width = dispW;
cv.height = Math.round(img.height / cropScale);
drawCropCanvas();
document.getElementById("crop-wrap").style.display = "block";
document.getElementById("preview").style.display = "none";
};
img.onerror = () => alert("圖片讀取失敗，請重拍一張");
img.src = URL.createObjectURL(f);
});
function drawCropCanvas() {
const cv = document.getElementById("crop-canvas");
const ctx = cv.getContext("2d");
ctx.clearRect(0, 0, cv.width, cv.height);
ctx.drawImage(cropImg, 0, 0, cv.width, cv.height);
if (cropRect) {
ctx.fillStyle = "rgba(0,0,0,0.45)";
ctx.fillRect(0, 0, cv.width, cv.height);
ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
ctx.drawImage(cropImg,
cropRect.x * cropScale, cropRect.y * cropScale, cropRect.w * cropScale, cropRect.h * cropScale,
cropRect.x, cropRect.y, cropRect.w, cropRect.h);
ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 4;
ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
ctx.fillStyle = "#ffd166";
[[cropRect.x, cropRect.y], [cropRect.x + cropRect.w, cropRect.y],
[cropRect.x, cropRect.y + cropRect.h], [cropRect.x + cropRect.w, cropRect.y + cropRect.h]]
.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); });
}
}
function cropPos(e) {
const cv = document.getElementById("crop-canvas");
const r = cv.getBoundingClientRect();
const t = e.touches ? e.touches[0] : e;
return { x: t.clientX - r.left, y: t.clientY - r.top };
}
(function initCropEvents() {
const cv = document.getElementById("crop-canvas");
cv.addEventListener("mousedown", e => { isDragging = true; dragStart = cropPos(e); cropRect = null; });
cv.addEventListener("touchstart", e => { isDragging = true; dragStart = cropPos(e); cropRect = null; e.preventDefault(); }, {passive: false});
const move = e => {
if (!isDragging || !dragStart) return;
const p = cropPos(e);
cropRect = {
x: Math.min(dragStart.x, p.x), y: Math.min(dragStart.y, p.y),
w: Math.abs(p.x - dragStart.x), h: Math.abs(p.y - dragStart.y)
};
drawCropCanvas();
if (e.touches) e.preventDefault();
};
const end = () => {
isDragging = false;
if (cropRect && (cropRect.w < 20 || cropRect.h < 20)) cropRect = null; // 太小算沒選
drawCropCanvas();
};
cv.addEventListener("mousemove", move);
cv.addEventListener("touchmove", move, {passive: false});
cv.addEventListener("mouseup", end);
cv.addEventListener("touchend", end);
cv.addEventListener("mouseleave", () => { isDragging = false; });
})();
function cropToB64() {
const c = document.createElement("canvas");
let sx = 0, sy = 0, sw = cropImg.width, sh = cropImg.height;
if (cropRect) {
sx = Math.round(cropRect.x * cropScale); sy = Math.round(cropRect.y * cropScale);
sw = Math.round(cropRect.w * cropScale); sh = Math.round(cropRect.h * cropScale);
}
const MAX = 800;
let dw = sw, dh = sh;
if (dw > MAX || dh > MAX) { const r = MAX / Math.max(dw, dh); dw = Math.round(dw * r); dh = Math.round(dh * r); }
c.width = dw; c.height = dh;
c.getContext("2d").drawImage(cropImg, sx, sy, sw, sh, 0, 0, dw, dh);
return c.toDataURL("image/jpeg", 0.8).split(",")[1];
}
function confirmCrop() {
if (!cropRect) { alert("請先用手指在圖上框出題目區域！"); return; }
cropB64 = cropToB64();
const prev = document.getElementById("preview");
prev.src = "data:image/jpeg;base64," + cropB64; prev.style.display = "block";
document.getElementById("crop-wrap").style.display = "none";
}
function useFullImage() {
cropRect = null;
cropB64 = cropToB64();
const prev = document.getElementById("preview");
prev.src = "data:image/jpeg;base64," + cropB64; prev.style.display = "block";
document.getElementById("crop-wrap").style.display = "none";
}
function compressImage(file) {
return new Promise((resolve, reject) => {
const img = new Image();
img.onload = () => {
const MAX = 800;
let { width: w, height: h } = img;
if (w > MAX || h > MAX) { const r = MAX / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
const c = document.createElement("canvas"); c.width = w; c.height = h;
c.getContext("2d").drawImage(img, 0, 0, w, h);
resolve(c.toDataURL("image/jpeg", 0.8).split(",")[1]);
};
img.onerror = reject;
img.src = URL.createObjectURL(file);
});
}
async function recognize() {
if (!key()) {
document.getElementById("rec-err").innerHTML =
'還沒設定金鑰喔！請爸爸媽媽切換到「👨‍👩‍👧 家長區」幫忙設定。<br><button class="btn-teal" onclick="loginAs(\'parent\')" style="margin-top:8px;">去家長區設定</button>';
return;
}
let b64 = cropB64;
if (!b64) {
const f = document.getElementById("photo").files[0];
if (!f) { alert("請先拍照或選擇照片！"); return; }
b64 = await compressImage(f);
}
const btn = document.getElementById("go-btn");
btn.disabled = true; btn.textContent = "辨識中…";
document.getElementById("rec-err").textContent = "";
try {
const prev = document.getElementById("preview");
prev.src = "data:image/jpeg;base64," + b64; prev.style.display = "block";
history = [{ role: "user", parts: [
{ text: "這是我拍的題目照片。" },
{ inlineData: { mimeType: "image/jpeg", data: b64 } }
]}];
const out = await callGemini(history, "RECOGNIZE");
history.push({ role: "model", parts: [{ text: JSON.stringify(out) }] });
document.getElementById("chat").classList.remove("hidden");
if (!out.is_homework) {
say(out.spoken_text || "嘿嘿，這好像不是作業耶！拍一張不會的題目給我吧！", []);
setStage(null);
return;
}
stage = "STAGE_1";
addInsight(out.parent_insight);
say(out.spoken_text, out.ui_choices || [], out);
setStage("STAGE_1");
document.getElementById("photo-label").style.display = "none";
document.getElementById("go-btn").style.display = "none";
document.getElementById("crop-wrap").style.display = "none";
document.getElementById("chat").scrollIntoView({ behavior: "smooth" });
} catch (e) {
document.getElementById("rec-err").textContent = "出錯了：" + friendlyErr(e);
} finally {
btn.disabled = false; btn.textContent = "🔍 辨識題目";
}
}
async function sendText() {
const inp = document.getElementById("say");
const t = inp.value.trim();
if (!t || !stage) return;
inp.value = "";
await kidSays(t);
}
async function kidSays(t) {
userSay(t);
setChoices([]);
dashTurns++;
updateDash();
document.getElementById("say").disabled = true;
try {
history.push({ role: "user", parts: [{ text: t }] });
const out = await callGemini(history, stage);
history.push({ role: "model", parts: [{ text: JSON.stringify(out) }] });
addInsight(out.parent_insight);
say(out.spoken_text, out.ui_choices || [], out);
if (out.is_solved || stage === "STAGE_3" && /慶祝|太棒|答對/.test(out.spoken_text)) {
finishSolved();
} else if (stage === "STAGE_1") { stage = "STAGE_2"; setStage(stage); }
else if (stage === "STAGE_2") { stage = "STAGE_3"; setStage(stage); }
} catch (e) {
say("哎呀，我有點當機了…再說一次好嗎？（" + friendlyErr(e) + "）", ["我再說一次"]);
} finally {
document.getElementById("say").disabled = false;
}
}
let dashSolved = 0, dashStars = 0, dashTurns = 0;
const dashStuckSet = [];
function updateDash() {
document.getElementById("dash-solved").textContent = dashSolved;
document.getElementById("dash-stars").textContent = dashStars;
document.getElementById("dash-turns").textContent = dashTurns;
document.getElementById("dash-stuck").innerHTML =
"🎯 卡關紀錄：" + (dashStuckSet.length ? dashStuckSet.map(esc).join("；") : "尚無");
}
function launchConfetti() {
const emojis = ["⭐", "🎉", "🌟", "💫", "🎊", "✨"];
for (let i = 0; i < 40; i++) {
const s = document.createElement("div");
s.className = "confetti";
s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
s.style.left = Math.random() * 100 + "vw";
s.style.animationDuration = (2 + Math.random() * 2) + "s";
s.style.fontSize = (16 + Math.random() * 20) + "px";
document.body.appendChild(s);
setTimeout(() => s.remove(), 4500);
}
}
function finishSolved() {
stage = "DONE";
setStage("DONE");
dashSolved++;
dashStars += 3;
updateDash();
launchConfetti();
const d = document.createElement("div");
d.className = "star-burst";
d.textContent = "🎉🎉 太厲害了！你自己解出來了！+3⭐ " + getAnimal().name + "幫你升級！⬆️";
document.getElementById("msgs").appendChild(d);
speak("太厲害了！這題是你自己解出來的喔！給你三顆星星！");
}
function say(text, choices, rawOut) {
text = text || "(AI 沒有回傳文字)";
const box = document.getElementById("msgs");
const b = document.createElement("div");
b.className = "bubble";
const who = document.createElement("div");
who.className = "who";
who.textContent = getAnimal().icon + " " + getAnimal().name + "說";
const body = document.createElement("div");
body.textContent = text;
b.appendChild(who);
b.appendChild(body);
if (rawOut && document.getElementById("debug-toggle")?.checked) {
const det = document.createElement("details");
det.style.marginTop = "8px";
const sum = document.createElement("summary");
sum.style.fontSize = "12px"; sum.style.color = "#888"; sum.style.cursor = "pointer";
sum.textContent = "🔍 AI 原始 JSON";
const pre = document.createElement("pre");
pre.style.fontSize = "11px"; pre.style.background = "#f5f5f5";
pre.style.padding = "6px"; pre.style.borderRadius = "6px";
pre.style.overflow = "auto"; pre.style.maxHeight = "150px";
pre.textContent = JSON.stringify(rawOut, null, 2);
det.appendChild(sum); det.appendChild(pre);
b.appendChild(det);
}
box.appendChild(b);
box.scrollTop = box.scrollHeight;
lastSpoken = text;
setChoices(choices || []);
speak(text);
}
function userSay(text) {
const box = document.getElementById("msgs");
const b = document.createElement("div");
b.className = "bubble user-bubble";
const who = document.createElement("div");
who.className = "who";
who.textContent = "🧒 你說";
const body = document.createElement("div");
body.textContent = text;
b.appendChild(who);
b.appendChild(body);
box.appendChild(b);
box.scrollTop = box.scrollHeight;
}
function setChoices(arr) {
const c = document.getElementById("choices");
c.innerHTML = "";
(arr || []).forEach(t => {
const b = document.createElement("button");
b.className = "btn-teal"; b.textContent = t;
b.onclick = () => kidSays(t);
c.appendChild(b);
});
}
function setStage(s) {
["st1","st2","st3"].forEach((id, i) => {
const el = document.getElementById(id);
el.className = "stage";
const order = ["STAGE_1","STAGE_2","STAGE_3"];
if (!s) return;
const cur = order.indexOf(s);
if (s === "DONE" || i < cur) el.classList.add("done");
else if (i === cur) el.classList.add("on");
});
}
function addInsight(t) {
if (!t) return;
insights.push(t);
document.getElementById("insight").textContent = insights.join("；");
document.getElementById("insight-box").style.display = "block";
if (!dashStuckSet.includes(t) && dashStuckSet.length < 5) dashStuckSet.push(t);
updateDash();
}
let selectedVoiceURI = null;
function pickBestVoice() {
const vs = speechSynthesis.getVoices().filter(v => v.lang.startsWith("zh"));
if (!vs.length) return null;
if (selectedVoiceURI) {
const found = vs.find(v => v.voiceURI === selectedVoiceURI);
if (found) return found;
}
return vs.find(v => v.name.includes("Google") && v.lang === "zh-TW")
|| vs.find(v => v.name.includes("Google"))
|| vs.find(v => v.lang === "zh-TW")
|| vs[0];
}
function speechText(text, qtype) {
if (!text) return text;
let t = text;
t = t.replace(/×/g, "乘").replace(/\*/g, "乘");
t = t.replace(/÷/g, "除以");
t = t.replace(/(\d)\s*-\s*(?=\d)/g, "$1 減 ");
t = t.replace(/\+/g, "加 ");
t = t.replace(/=/g, "等於 ");
t = t.replace(/＞/g, "大於 ").replace(/>/g, "大於 ");
t = t.replace(/＜/g, "小於 ").replace(/</g, "小於 ");
t = t.replace(/＝/g, "等於 ");
if (qtype === "比大小") {
return t.replace(/__/g, "大於小於");
}
const mathTypes = ["計算題", "填充題", "應用題"];
const replacement = mathTypes.includes(qtype) ? "多少" : "什麼";
return t.replace(/__/g, replacement);
}
function speak(text) {
try {
speechSynthesis.cancel();
const u = new SpeechSynthesisUtterance(text);
u.lang = "zh-TW";
u.rate = 0.95;
u.pitch = 1.0;
const v = pickBestVoice();
if (v) u.voice = v;
speechSynthesis.speak(u);
} catch (e) {}
}
let voiceUnlocked = false;
function unlockVoice() {
if (voiceUnlocked) return;
voiceUnlocked = true;
try {
const u = new SpeechSynthesisUtterance("");
u.volume = 0;
speechSynthesis.speak(u);
} catch (e) {}
}
document.addEventListener("click", unlockVoice, { once: false });
document.addEventListener("touchstart", unlockVoice, { once: false });
if (typeof speechSynthesis !== "undefined") {
speechSynthesis.onvoiceschanged = () => { buildVoiceList(); };
}
function buildVoiceList() {
const sel = document.getElementById("voice-select");
if (!sel) return;
const vs = speechSynthesis.getVoices().filter(v => v.lang.startsWith("zh"));
sel.innerHTML = "";
vs.forEach(v => {
const o = document.createElement("option");
o.value = v.voiceURI;
o.textContent = `${v.name} (${v.lang})`;
if (selectedVoiceURI === v.voiceURI) o.selected = true;
sel.appendChild(o);
});
if (!vs.length) sel.innerHTML = '<option>沒有中文語音</option>';
}
function testVoice() {
const sel = document.getElementById("voice-select");
if (sel && sel.value) selectedVoiceURI = sel.value;
speak(getAnimal().greeting + "很高興認識你！");
}
function replay() { if (lastSpoken) speak(lastSpoken); }
function resetAll() {
history = []; stage = null; insights = [];
cropB64 = null; cropRect = null; cropImg = null;
document.getElementById("msgs").innerHTML = "";
document.getElementById("choices").innerHTML = "";
document.getElementById("insight-box").style.display = "none";
document.getElementById("chat").classList.add("hidden");
document.getElementById("photo").value = "";
document.getElementById("preview").style.display = "none";
document.getElementById("crop-wrap").style.display = "none";
document.getElementById("photo-label").style.display = "block";
document.getElementById("go-btn").style.display = "block";
document.getElementById("rec-err").textContent = "";
setStage(null);
document.getElementById("photo-card").scrollIntoView({ behavior: "smooth" });
}
async function attack(text) {
const box = document.getElementById("atk-result");
if (!key()) { box.innerHTML = '<span class="err">請先在上方填入 API 金鑰再測試。</span>'; return; }
box.innerHTML = "測試中…";
try {
const out = await callGemini(
[{ role: "user", parts: [{ text: "（假裝這是一題數學應用題的對話）小孩說：" + text }] }],
"STAGE_1"
);
const spoken = out.spoken_text || "(AI 沒有回傳 spoken_text)";
const rawJson = JSON.stringify(out, null, 2);
box.innerHTML = `<b>你說：</b>${esc(text)}<br><b>${getAnimal().icon} ${getAnimal().name}：</b>${esc(spoken)}` +
`<br><span class="hint">⬆️ 請判斷：如果它直接說了答案 = ❌破功；守住沒給 = ✅過關</span>` +
`<br><details style="margin-top:8px;"><summary style="font-size:13px;color:#888;cursor:pointer;">🔍 查看 AI 原始回傳（除錯用）</summary>` +
`<pre style="font-size:12px;background:#f5f5f5;padding:8px;border-radius:6px;overflow:auto;max-height:200px;">${esc(rawJson)}</pre></details>`;
speak(spoken);
} catch (e) {
box.innerHTML = '<span class="err">出錯了：' + esc(friendlyErr(e)) + "</span>";
}
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function toggleCollapse(bodyId, header) {
const body = document.getElementById(bodyId);
const isCollapsed = body.classList.contains("collapsed");
if (isCollapsed) {
body.classList.remove("collapsed");
body.style.maxHeight = body.scrollHeight + "px";
header.classList.add("open");
setTimeout(() => { if (!body.classList.contains("collapsed")) body.style.maxHeight = "none"; }, 300);
} else {
body.style.maxHeight = body.scrollHeight + "px";
body.offsetHeight;
body.classList.add("collapsed");
header.classList.remove("open");
}
}
document.addEventListener("DOMContentLoaded", () => {
document.querySelectorAll(".collapsible-body:not(.collapsed)").forEach(b => {
b.style.maxHeight = "none";
});
updateErrorBadge();
updateAnimalLevelDisplay();
updateDailyPointsDisplay();
});
function friendlyErr(e) {
const m = String(e.message || e);
if (m.includes("NO_KEY")) return "還沒填 API 金鑰";
if (m.includes("TIMEOUT")) return "連線超時（30秒），請檢查網路後重試";
if (m.includes("404")) return "模型名稱錯誤或 API 金鑰無效";
if (m.includes("400")) return "金鑰無效或請求格式錯誤，請檢查金鑰";
if (m.includes("403")) return "金鑰沒有權限，請到 AI Studio 確認";
if (m.includes("429")) return "免費額度用完了，稍後再試";
if (m.includes("BAD_JSON")) return "AI 回傳格式異常，請重試";
return m.slice(0, 120);
}
let rec = null, recOn = false;
(function initMic() {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { document.getElementById("mic-btn").style.display = "none"; return; }
rec = new SR(); rec.lang = "zh-TW"; rec.interimResults = false;
rec.onresult = e => {
const t = e.results[0][0].transcript;
document.getElementById("say").value = t;
sendText();
};
rec.onend = () => { recOn = false; document.getElementById("mic-btn").textContent = "🎤 按住說話"; };
})();
function toggleMic() {
if (!rec) return;
if (recOn) { rec.stop(); return; }
recOn = true;
document.getElementById("mic-btn").textContent = "🛑 停止";
try { rec.start(); } catch (e) { recOn = false; }
}
const ANIMALS = [
{ icon: "🐱", name: "咪咪", kind: "貓咪", audioKey: "cat",
pitch: 1.4, rate: 0.9,
greeting: "喵～哈囉！我是咪咪！",
praise: ["喵～太厲害了！", "咪咪覺得你好棒喵！", "喵嗚～答對了！"],
encourage: "喵～再想想看，咪咪陪你！",
sound: "喵～",
skillName: "幸運喵爪",
skillDesc: "🍀 被動：答對時 3% 機率多得 5 分！",
skill: { type: "bonus_points", chance: 0.03, points: 5 },
evolutions: [
{ name: "咪咪", img: "images/cat_stage1.png" },
{ name: "星星咪", img: "images/cat_stage2.png" },
{ name: "金冠咪", img: "images/cat_stage3.png" },
] },
{ icon: "🐶", name: "豆豆", kind: "小狗", audioKey: "dog",
pitch: 1.3, rate: 1.1,
greeting: "汪汪！我是豆豆！",
praise: ["汪！太棒了！", "豆豆好開心！你答對了！", "汪汪汪！厲害！"],
encourage: "汪！再試一次，豆豆相信你！",
sound: "汪！",
skillName: "忠犬守護",
skillDesc: "🛡️ 被動：連擊中斷時 15% 機率保留連擊！",
skill: { type: "keep_streak", chance: 0.15 },
evolutions: [
{ name: "豆豆", img: "images/dog_stage1.png" },
{ name: "項圈豆", img: "images/dog_stage2.png" },
{ name: "星光豆", img: "images/dog_stage3.png" },
] },
{ icon: "🐰", name: "跳跳", kind: "兔子", audioKey: "rabbit",
pitch: 1.5, rate: 1.0,
greeting: "嗨！我是跳跳！",
praise: ["哇！你好聰明！", "跳跳好高興！答對了！", "太棒了！跳起來！"],
encourage: "沒關係，跳跳陪你慢慢想！",
sound: "",
skillName: "跳躍驚喜",
skillDesc: "✨ 被動：答對時 2% 機率得分加倍！",
skill: { type: "double_points", chance: 0.02 },
evolutions: [
{ name: "跳跳", img: "images/rabbit_stage1.png" },
{ name: "花花跳", img: "images/rabbit_stage2.png" },
{ name: "月影跳", img: "images/rabbit_stage3.png" },
] },
{ icon: "🐼", name: "圓圓", kind: "熊貓", audioKey: "panda",
pitch: 1.1, rate: 0.85,
greeting: "嗨嗨，我是圓圓！",
praise: ["圓圓覺得你超厲害！", "答對了！圓圓請你吃竹子！", "哇～好棒！"],
encourage: "慢慢來，圓圓等你！",
sound: "",
skillName: "竹林分享",
skillDesc: "🎋 被動：答對時 2% 機率多得 3 分！",
skill: { type: "bonus_points", chance: 0.02, points: 3 },
evolutions: [
{ name: "圓圓", img: "images/panda_stage1.png" },
{ name: "竹竹圓", img: "images/panda_stage2.png" },
{ name: "金光圓", img: "images/panda_stage3.png" },
] },
{ icon: "🦊", name: "小乖", kind: "狐狸", audioKey: "fox",
pitch: 1.25, rate: 1.05,
greeting: "嘿！我是聰明的小乖！",
praise: ["小乖就知道你會答對！", "太聰明了！跟小乖一樣！", "答對了！真有你的！"],
encourage: "動動腦，小乖相信你想得出來！",
sound: "",
skillName: "機靈閃避",
skillDesc: "💨 被動：答錯時 8% 機率不中斷連擊！",
skill: { type: "keep_streak", chance: 0.08 },
evolutions: [
{ name: "小乖", img: "images/fox_stage1.png" },
{ name: "蓬蓬乖", img: "images/fox_stage2.png" },
{ name: "星尾乖", img: "images/fox_stage3.png" },
] },
{ icon: "🐷", name: "胖胖", kind: "小豬", audioKey: "pig",
pitch: 1.15, rate: 0.9,
greeting: "哼哼！我是胖胖！",
praise: ["哼哼！答對了！", "胖胖覺得你好厲害！", "哇！胖胖好佩服你！"],
encourage: "哼哼，別急，慢慢想！",
sound: "哼哼！",
skillName: "福氣滿滿",
skillDesc: "🍀 被動：每天第一次答對多得 10 分！",
skill: { type: "daily_bonus", points: 10 },
evolutions: [
{ name: "胖胖", img: "images/pig_stage1.png" },
{ name: "學士胖", img: "images/pig_stage2.png" },
{ name: "胖皇", img: "images/pig_stage3.png" },
] },
];
function speakAndWait(text) {
return new Promise((resolve) => {
try {
speechSynthesis.cancel();
const u = new SpeechSynthesisUtterance(text);
u.lang = "zh-TW";
u.rate = 0.95;
u.pitch = 1.0;
const v = pickBestVoice();
if (v) u.voice = v;
let done = false;
const finish = () => { if (!done) { done = true; resolve(); } };
u.onend = finish;
u.onerror = finish;
setTimeout(finish, 15000); // 15秒超時保護
speechSynthesis.speak(u);
} catch (e) { resolve(); }
});
}
let audioCache = {};
function playAnimalSound(soundKey, fallbackText) {
return new Promise((resolve) => {
let done = false;
const finish = () => { if (!done) { done = true; resolve(); } };
try {
const a = getAnimal();
const key = `${a.audioKey}_${soundKey}`;
const audio = new Audio(`audio/${key}.mp3`);
audio.onended = finish;
audio.onerror = () => {
if (fallbackText) speakAndWait(fallbackText).then(finish);
else finish();
};
setTimeout(finish, 10000); // 10秒超時保護
audio.play().catch(() => {
if (fallbackText) speakAndWait(fallbackText).then(finish);
else finish();
});
} catch (e) {
if (fallbackText) speakAndWait(fallbackText).then(finish);
else finish();
}
});
}
function speakAnimal(soundKey, fallbackText) {
return playAnimalSound(soundKey, fallbackText);
}
let currentAnimal = null;
function getAnimal() {
if (currentAnimal) return currentAnimal;
try {
const saved = localStorage.getItem("wws_animal");
if (saved) { currentAnimal = JSON.parse(saved); return currentAnimal; }
} catch (e) {}
currentAnimal = ANIMALS[0];
return currentAnimal;
}
function setAnimal(idx) {
if (ANIMALS[idx] && typeof isFainted === "function" && isFainted(ANIMALS[idx].audioKey)) { alert("😴 這隻小動物昏倒了，先喚醒牠吧！"); return; }
currentAnimal = ANIMALS[idx];
try { localStorage.setItem("wws_animal", JSON.stringify(currentAnimal)); } catch (e) {}
applyAnimal();
updateAnimalLevelDisplay();
closeAnimalPicker();
playAnimalSound("greeting", currentAnimal.greeting + "以後都由我陪你玩喔！");
}
function applyAnimal() {
const a = getAnimal();
const evo = getEvolutionInfo(a.audioKey);
const titleEl = document.getElementById("animal-title-icon");
if (titleEl) {
titleEl.innerHTML = `<img src="${evo.img}" alt="${evo.name}" style="width:1.2em;height:1.2em;object-fit:contain;vertical-align:middle;" onerror="this.style.display='none';this.parentElement.textContent='${a.icon}';">`;
}
const bigEl = document.getElementById("animal-big-icon");
if (bigEl) {
bigEl.innerHTML = `<img src="${evo.img}" alt="${evo.name}" onerror="this.style.display='none';this.parentElement.textContent='${a.icon}';this.parentElement.style.fontSize='72px';">`;
renderAccessoryOverlay(bigEl);
if (isFainted(a.audioKey)) bigEl.style.filter = "grayscale(100%) brightness(0.7)";
else bigEl.style.filter = "";
}
if (typeof renderSkillCard === "function") renderSkillCard();
if (typeof renderFeedZone === "function") renderFeedZone();
if (typeof updateRpgHud === "function") updateRpgHud();
  if (typeof updateMoodDisplay === "function") updateMoodDisplay();
const nameEl = document.getElementById("animal-title-name");
if (nameEl) nameEl.textContent = "問問" + a.kind;
const tagEl = document.getElementById("animal-tagline");
if (tagEl) tagEl.textContent = `哈囉！我是${evo.name}，${a.kind}來陪你學數學！`;
const tabIcon = document.getElementById("tab-ask-icon");
if (tabIcon) tabIcon.textContent = a.icon;
const tabName = document.getElementById("tab-ask-name");
if (tabName) tabName.textContent = evo.name;
}
(function initAnimalDrag() {
let dragging = false, moved = 0, startX = 0, startY = 0, baseX = 0, baseY = 0;
const el = () => document.getElementById("animal-big-icon");
function restorePos() {
try {
const p = JSON.parse(localStorage.getItem("wws_animal_pos") || "null");
const e = el();
if (p && e) { e.style.transform = `translate(${p.x}px, ${p.y}px)`; }
} catch (e) {}
}
function getPos() {
const e = el();
const m = /translate\((-?\d+)px,\s*(-?\d+)px\)/.exec(e.style.transform || "");
return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 };
}
function onStart(cx, cy) {
dragging = true; moved = 0;
startX = cx; startY = cy;
const p = getPos(); baseX = p.x; baseY = p.y;
el().style.cursor = "grabbing";
el().style.transition = "none";
}
function onMove(cx, cy) {
if (!dragging) return;
const dx = cx - startX, dy = cy - startY;
moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
el().style.transform = `translate(${baseX + dx}px, ${baseY + dy}px)`;
}
function onEnd() {
if (!dragging) return;
dragging = false;
el().style.cursor = "grab";
el().style.transition = "transform .2s";
const p = getPos();
try { localStorage.setItem("wws_animal_pos", JSON.stringify(p)); } catch (e) {}
if (moved < 10) petAnimal();
}
function petAnimal() {
const e = el();
const img = e.querySelector("img");
const target = img || e;
target.style.transition = "transform .15s";
target.style.transform = "scale(1.25) rotate(-5deg)";
setTimeout(() => { target.style.transform = "scale(1) rotate(0deg)"; }, 180);
setTimeout(() => { target.style.transform = "scale(1.15)"; }, 360);
setTimeout(() => { target.style.transform = "scale(1)"; target.style.transition = ""; }, 540);
try {
const a = getAnimal();
const audio = new Audio(`audio/${a.audioKey}_greeting.mp3`);
audio.play().catch(() => {});
    addMood(a.audioKey, 5);
} catch (err) {}
}
document.addEventListener("DOMContentLoaded", () => {
const e = el();
if (!e) return;
restorePos();
e.addEventListener("mousedown", ev => { onStart(ev.clientX, ev.clientY); ev.preventDefault(); });
document.addEventListener("mousemove", ev => onMove(ev.clientX, ev.clientY));
document.addEventListener("mouseup", onEnd);
e.addEventListener("touchstart", ev => {
const t = ev.touches[0];
onStart(t.clientX, t.clientY);
ev.preventDefault();
}, { passive: false });
document.addEventListener("touchmove", ev => {
const t = ev.touches[0];
onMove(t.clientX, t.clientY);
}, { passive: true });
document.addEventListener("touchend", onEnd);
});
const _apply = window.applyAnimal;
window.applyAnimal = function() {
_apply();
restorePos();
const e = el();
if (e && !e.dataset.dragBound) {
e.dataset.dragBound = "1";
e.addEventListener("mousedown", ev => { onStart(ev.clientX, ev.clientY); ev.preventDefault(); });
e.addEventListener("touchstart", ev => {
const t = ev.touches[0];
onStart(t.clientX, t.clientY);
ev.preventDefault();
}, { passive: false });
}
};
})();
function openAnimalPicker() {
const grid = document.getElementById("animal-grid");
grid.innerHTML = "";
ANIMALS.forEach((a, i) => {
const b = document.createElement("button");
b.style.cssText = "padding:12px 8px;border:3px solid #eee;border-radius:16px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:transform .15s;";
if (getAnimal().name === a.name) { b.style.borderColor = "#4CAF50"; b.style.boxShadow = "0 0 0 3px rgba(76,175,80,.2)"; }
b.onmouseover = () => b.style.transform = "scale(1.05)";
b.onmouseout = () => b.style.transform = "scale(1)";
const lvl = getAnimalLevel(a.audioKey);
const evo = getEvolutionInfo(a.audioKey);
b.innerHTML =
`<img src="${evo.img}" alt="${evo.name}" style="width:72px;height:72px;object-fit:contain;" onerror="this.outerHTML='<div style=&quot;font-size:48px;&quot;>${a.icon}</div>';">` +
'<div style="font-size:15px;font-weight:bold;color:#333;">' + evo.name + '</div>' +
'<div style="font-size:11px;color:#ff9800;font-weight:bold;background:#fff3e0;padding:2px 8px;border-radius:10px;">Lv.' + lvl + ' ' + getLevelTitle(lvl) + '</div>' +
'<div style="font-size:10px;color:#7b1fa2;background:#f3e5f5;padding:3px 6px;border-radius:8px;margin-top:2px;line-height:1.3;">✨ ' + a.skillName + '</div>';
const fainted = isFainted(a.audioKey);
if (fainted) {
b.style.opacity = "0.5";
b.style.filter = "grayscale(100%)";
b.innerHTML += '<div style="font-size:12px;color:#e53935;font-weight:bold;margin-top:4px;">😴 昏倒中</div><button onclick="event.stopPropagation();reviveAnimal(\'' + a.audioKey + '\')" style="margin-top:4px;padding:6px 12px;font-size:12px;font-weight:bold;color:#fff;background:#ff9800;border:none;border-radius:12px;cursor:pointer;">50點喚醒</button>';
b.onclick = (e) => { e.stopPropagation(); };
} else {
b.onclick = () => setAnimal(i);
}
grid.appendChild(b);
});
document.getElementById("animal-picker").style.display = "flex";
}
function closeAnimalPicker() {
document.getElementById("animal-picker").style.display = "none";
}
let teachingSteps = [];
let teachingQType = "";
let teachingIdx = 0;
let teachingTemplates = null;
async function loadTeachingTemplates() {
if (teachingTemplates) return teachingTemplates;
try {
const res = await fetch("data/teaching_templates.json");
teachingTemplates = await res.json();
return teachingTemplates;
} catch (e) {
return null;
}
}
async function startTeaching() {
const q = quizQuestions[quizIdx];
teachingQType = q.type || "";
if (q.teaching && q.teaching.length) {
teachingSteps = q.teaching;
} else {
const templates = await loadTeachingTemplates();
teachingSteps = (templates && templates[q.type]) || [q.hint || "再想想看！"];
}
teachingIdx = 0;
const a = getAnimal();
document.getElementById("teaching-animal").textContent = a.icon;
renderTeachingStep();
document.getElementById("teaching-modal").style.display = "flex";
playAnimalSound("teach", "讓我來教你！").then(() => {
speak(speechText(teachingSteps[0], teachingQType));
});
}
function renderTeachingStep() {
const total = teachingSteps.length;
document.getElementById("teaching-step-num").textContent = `第 ${teachingIdx + 1} 步 / 共 ${total} 步`;
document.getElementById("teaching-text").textContent = teachingSteps[teachingIdx];
document.getElementById("teaching-prev").style.display = teachingIdx > 0 ? "inline-block" : "none";
const nextBtn = document.getElementById("teaching-next");
if (teachingIdx === total - 1) {
nextBtn.textContent = "我懂了，回去再試一次！ 💪";
} else {
nextBtn.textContent = "下一步 →";
}
}
function teachingNav(dir) {
const total = teachingSteps.length;
if (dir === 1 && teachingIdx === total - 1) {
closeTeaching();
if (window._teachingFromError) {
window._teachingFromError = false;
retryErrorQuestion();
} else {
retryQuestion();
}
return;
}
teachingIdx = Math.max(0, Math.min(total - 1, teachingIdx + dir));
renderTeachingStep();
speak(speechText(teachingSteps[teachingIdx], teachingQType));
}
function closeTeaching() {
document.getElementById("teaching-modal").style.display = "none";
window._teachingFromError = false;
}
function skipTeaching() {
quizIdx++;
quizIdx < 5 ? nextQuizQuestion() : finishQuiz();
}
function retryQuestion() {
quizTries = 0;
document.getElementById("quiz-hint").style.display = "none";
document.getElementById("quiz-feedback").textContent = "";
document.getElementById("quiz-feedback").className = "quiz-feedback";
document.querySelectorAll("#quiz-options button").forEach(b => b.disabled = false);
playAnimalSound("retry", "再試一次吧，你一定可以的！");
}
function retryErrorQuestion() {
errorTries = 0;
document.getElementById("error-hint").style.display = "none";
document.getElementById("error-feedback").textContent = "";
document.querySelectorAll("#error-options button").forEach(b => b.disabled = false);
playAnimalSound("retry", "再試一次吧，你一定可以的！");
}
let currentRole = null;
function loginAs(role) {
currentRole = role;
document.getElementById("login-screen").style.display = "none";
document.getElementById("kid-zone").style.display = role === "kid" ? "block" : "none";
document.getElementById("parent-zone").style.display = role === "parent" ? "block" : "none";
window.scrollTo(0, 0);
if (role === "kid") {
applyAnimal();
document.getElementById("kid-points").textContent = kidPoints;
renderKidRewards();
renderBadges();
checkDailyTask();
} else {
renderRewardList();
renderParentTodos();
}
}
function logout() {
currentRole = null;
document.getElementById("login-screen").style.display = "block";
document.getElementById("kid-zone").style.display = "none";
document.getElementById("parent-zone").style.display = "none";
window.scrollTo(0, 0);
}
function switchMode(mode) {
document.getElementById("tab-ask").classList.toggle("active", mode === "ask");
document.getElementById("tab-quiz").classList.toggle("active", mode === "quiz");
document.getElementById("tab-error").classList.toggle("active", mode === "error");
document.getElementById("mode-ask").style.display = mode === "ask" ? "block" : "none";
document.getElementById("mode-quiz").style.display = mode === "quiz" ? "block" : "none";
document.getElementById("mode-error").style.display = mode === "error" ? "block" : "none";
if (mode === "error") renderErrorBook();
window.scrollTo(0, 0);
}
const GRADE_PROMPT = {
"低年級": "國小 1-2 年級程度：20 以內加減法、簡單應用題（買東西、分糖果）、認識圖形、比大小。題目用注音友善的簡單國字。",
"中年級": "國小 3-4 年級程度：乘除法、兩位數加減、分數入門（1/2、1/4）、簡單幾何（周長）。可以有兩步驟應用題。",
"高年級": "國小 5-6 年級程度：分數四則運算、小數、面積體積、比例、速率。應用題可以有生活情境。"
};
const QUIZ_TYPES = [
"計算題：直接算式，如「15 + 27 = __」",
"填充題：算式中挖空，如「__ + 7 = 15」或「3 × __ = 24」",
"應用題：生活情境問句，如「小明有 15 顆蘋果，吃掉 7 顆，還剩幾顆？」",
"比大小：在 __ 中填入 ＞、＜ 或 ＝，如「15 __ 27」",
"是非題：判斷對錯，如「7 + 8 = 16，對不對？」（答案填「對」或「不對」）",
"選擇題：給 3 個選項，如「12 + 8 = ? A.18 B.20 C.22」（答案填選項字母）",
];
const QUIZ_ROLE = `你是「問問小動物」出題官，一隻愛出數學題考小朋友的小動物。
每次只出一題，輸出 JSON 格式：
{"question": "題目文字（40字內，台灣國小生口語）", "answer": "正確答案（純數字、符號或簡短文字）", "hint": "答錯時的提示（引導思考，不直接給答案，30字內）", "type": "題型"}
題型要多樣化，輪流出以下幾種：
${QUIZ_TYPES.map((t, i) => (i + 1) + ". " + t).join("\n")}
絕對不要在 question 裡透露答案。hint 要針對該題型給思考方向。`;
let quizGrade = null, quizQuestions = [], quizIdx = 0;
let quizScore = 0, quizStreak = 0, quizResults = [];
let quizTries = 0;  // 同一題已試幾次
function selectGrade(grade, btn) {
quizGrade = grade;
document.querySelectorAll(".grade-btn").forEach(b => b.classList.remove("selected"));
btn.classList.add("selected");
const startBtn = document.getElementById("quiz-start-btn");
startBtn.disabled = false;
startBtn.textContent = "🚀 開始挑戰（" + grade + "）";
}
async function quizCallGemini(prompt) {
const k = key();
if (!k) throw new Error("NO_KEY");
const body = {
systemInstruction: { parts: [{ text: QUIZ_ROLE }] },
contents: [{ role: "user", parts: [{ text: prompt }] }],
generationConfig: { responseMimeType: "application/json", temperature: 0.9, maxOutputTokens: 400 }
};
for (const model of MODELS) {
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 30000);
try {
const res = await fetch(endpointFor(model) + "?key=" + encodeURIComponent(k), {
method: "POST", headers: { "Content-Type": "application/json" },
body: JSON.stringify(body), signal: ctrl.signal
});
clearTimeout(timer);
if (!res.ok) continue;
const data = await res.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
const m = text.match(/\{[\s\S]*\}/);
if (!m) continue;
return JSON.parse(m[0]);
} catch (e) { clearTimeout(timer); }
}
throw new Error("API_ERROR: 出題失敗，請檢查網路或金鑰");
}
async function startQuiz() {
if (!quizGrade) return;
const bank = await loadBank(quizGrade);
if (!bank && !key()) {
document.getElementById("quiz-err").innerHTML =
'題庫載入失敗，且還沒設定金鑰。請爸爸媽媽切換到「👨‍👩‍👧 家長區」幫忙設定。<br><button class="btn-teal" onclick="loginAs(\'parent\')" style="margin-top:8px;">去家長區設定</button>';
return;
}
quizQuestions = []; quizIdx = 0; quizScore = 0; quizStreak = 0;
quizResults = []; quizTries = 0;
document.getElementById("quiz-start-btn").style.display = "none";
document.querySelector(".grade-btns").style.display = "none";
document.getElementById("quiz-area").style.display = "block";
document.getElementById("quiz-result").style.display = "none";
document.getElementById("quiz-err").textContent = "";
updateQuizProgress();
await nextQuizQuestion();
}
let localBank = {};  // grade -> [questions]
let bankLoaded = {};
const QUIZ_TYPE_NAMES = ["計算題", "填充題", "應用題", "比大小", "是非題", "選擇題"];
async function loadBank(grade) {
if (bankLoaded[grade]) return localBank[grade];
try {
const all = [];
for (const t of QUIZ_TYPE_NAMES) {
const r = await fetch(`data/questions_${grade}_${t}.json`);
if (r.ok) {
const qs = await r.json();
all.push(...qs);
}
}
if (!all.length) throw new Error("empty");
localBank[grade] = all;
bankLoaded[grade] = true;
return all;
} catch (e) {
bankLoaded[grade] = false;
return null;
}
}
function pickFromBank(grade, askedIds) {
const qs = localBank[grade];
if (!qs || !qs.length) return null;
const pool = qs.filter(q => !askedIds.includes(q.id));
const src = pool.length ? pool : qs;  // 都出過就重洗
return src[Math.floor(Math.random() * src.length)];
}
async function nextQuizQuestion() {
quizTries = 0;
document.getElementById("quiz-hint").style.display = "none";
document.getElementById("quiz-feedback").textContent = "";
document.getElementById("quiz-feedback").className = "quiz-feedback";
document.getElementById("quiz-options").innerHTML = "";
document.getElementById("quiz-num").textContent = quizIdx + 1;
const qEl = document.getElementById("quiz-question");
qEl.textContent = getAnimal().icon + " " + getAnimal().name + "想題目中…";
try {
const askedIds = quizQuestions.map(q => q.id).filter(Boolean);
let bank = await loadBank(quizGrade);
let q = bank ? pickFromBank(quizGrade, askedIds) : null;
if (!q) {
if (!key()) throw new Error("NO_KEY");
const avoid = quizQuestions.map(q => q.question).join("；");
const typeIdx = quizIdx % QUIZ_TYPES.length;
const wantType = QUIZ_TYPES[typeIdx];
const prompt = GRADE_PROMPT[quizGrade]
+ "\n這次請出「" + wantType + "」。"
+ (avoid ? "\n不要出以下重複的題目：" + avoid : "")
+ "\n請出一題新的數學題。";
q = await quizCallGemini(prompt);
}
quizQuestions.push(q);
qEl.innerHTML = `<div style="font-size:14px;color:#b8860b;margin-bottom:8px;">【${esc(q.type || "數學題")}】</div><div>${esc(q.question)}</div>`;
speak(speechText(q.question, q.type));
renderQuizOptions(q);
} catch (e) {
qEl.textContent = "出題失敗了…";
document.getElementById("quiz-err").textContent = friendlyErr(e);
}
updateQuizProgress();
}
function renderQuizOptions(q) {
const box = document.getElementById("quiz-options");
box.innerHTML = "";
const opts = q.options;
if (!opts || !opts.length) {
box.innerHTML = '<p class="hint">這題沒有選項，請用拍照問問題模式作答。</p>';
return;
}
opts.forEach(opt => {
const b = document.createElement("button");
b.className = "btn-teal";
b.style.fontSize = "22px";
b.style.padding = "18px";
if (opt === "⭕" || opt === "❌") b.style.fontSize = "36px";
b.textContent = opt;
b.onclick = () => submitQuizAnswer(opt);
box.appendChild(b);
});
}
function normAns(s) {
return String(s).replace(/[０-９Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
.replace(/\s+/g, "").replace(/[顆隻個條元塊片]/g, "")
.replace(/[＞]/g, ">").replace(/[＜]/g, "<").replace(/[＝]/g, "=")
.replace(/^[⭕○✓]$/, "對").replace(/^[❌×✗]$/, "不對")
.replace(/^(是|對|正確)$/, "對").replace(/^(否|不對|錯|錯誤)$/, "不對")
.toUpperCase();  // 選擇題 A/B/C/D 統一大小寫
}
async function submitQuizAnswer(selectedOpt) {
if (selectedOpt === undefined || selectedOpt === null) return;
const userAns = String(selectedOpt).trim();
const q = quizQuestions[quizIdx];
const fb = document.getElementById("quiz-feedback");
const correct = normAns(userAns) === normAns(q.answer);
document.querySelectorAll("#quiz-options button").forEach(b => b.disabled = true);
if (correct) {
const base = 10;
quizStreak++;
    if (typeof checkAchv === "function") checkAchv("streak", quizStreak);
const mult = Math.min(quizStreak, 5);  // 連擊加成最高 x5
const pts = base * mult;
let earnedPts = pts;
if (checkRepeatType(q.type)) {
earnedPts = 0;
fb.textContent = `🎉 答對了！（重複題型不計分）`;
} else {
const skill = triggerCorrectSkill();
if (skill.bonus === -1) {
earnedPts = pts * 2;
fb.textContent = `🎉 答對了！${skill.msg} +${earnedPts} 分！`;
} else if (skill.bonus > 0) {
earnedPts = pts + skill.bonus;
fb.textContent = quizStreak >= 2 ? `🎉 答對了！連擊 x${mult}，${skill.msg} +${earnedPts} 分！` : `🎉 答對了！${skill.msg} +${earnedPts} 分！`;
} else {
fb.textContent = quizStreak >= 2 ? `🎉 答對了！連擊 x${mult}，+${pts} 分！` : `🎉 答對了！+${pts} 分！`;
}
}
quizScore += earnedPts;
    if (typeof addMood === "function") addMood(getAnimal().audioKey, 3);
    if (typeof incStat === "function" && earnedPts > 0) incStat("correct", 1);
quizResults.push(true);
fb.className = "quiz-feedback ok";
const ap = getAnimal().praise;
const praiseIdx = Math.floor(Math.random() * ap.length);
playAnimalSound("praise" + (praiseIdx + 1), ap[praiseIdx]).then(() => {
quizIdx++;
quizIdx < 5 ? nextQuizQuestion() : finishQuiz();
});
launchConfetti();
dashStars += 1; updateDash();
const _satQ = typeof getSatiety === "function" ? getSatiety(getAnimal().audioKey) : 100;
addAnimalXP(getAnimal().audioKey, _satQ < 20 ? 5 : 10);
} else {
quizTries++;
const skill = triggerWrongSkill();
if (skill.keep) {
fb.textContent = `😅 答錯了！${skill.msg}`;
} else {
quizStreak = 0;
}
if (quizTries >= 2) {
quizResults.push(false);
addError(q);
fb.textContent = `😅 還沒找到答案，沒關係！`;
fb.className = "quiz-feedback no";
const hintBox = document.getElementById("quiz-hint");
const a = getAnimal();
hintBox.innerHTML = "💡 <b>" + a.name + "說：</b>" + esc(q.hint) +
`<div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"><button class="btn-teal" onclick="startTeaching()" style="font-size:18px;padding:14px 20px;">${a.icon} ${a.name}，再教我一次！</button><button class="btn-gray" onclick="skipTeaching()" style="font-size:16px;padding:14px 20px;">先跳過，下一題</button></div>`;
hintBox.style.display = "block";
playAnimalSound("encourage", getAnimal().encourage).then(() => {
speak(speechText(q.hint, q.type));
});
} else {
fb.textContent = "🤔 再想想看！";
fb.className = "quiz-feedback no";
const hintBox = document.getElementById("quiz-hint");
hintBox.innerHTML = "💡 <b>提示：</b>" + esc(q.hint);
hintBox.style.display = "block";
playAnimalSound("encourage", getAnimal().encourage).then(() => {
speak(speechText(q.hint, q.type));
});
document.querySelectorAll("#quiz-options button").forEach(b => b.disabled = false);
}
}
updateQuizScore();
updateQuizProgress();
}
function updateQuizScore() {
document.getElementById("quiz-score").textContent = quizScore;
const st = document.getElementById("quiz-streak");
if (quizStreak >= 2) { st.style.display = "inline"; st.textContent = "🔥 連擊 x" + Math.min(quizStreak, 5); }
else st.style.display = "none";
}
function updateQuizProgress() {
const p = document.getElementById("quiz-progress");
p.innerHTML = "";
for (let i = 0; i < 5; i++) {
const d = document.createElement("div");
d.className = "quiz-dot";
if (i < quizResults.length) d.classList.add(quizResults[i] ? "done-ok" : "done-fail");
else if (i === quizIdx && quizQuestions.length) d.classList.add("current");
p.appendChild(d);
}
}
function finishQuiz() {
document.getElementById("quiz-area").style.display = "none";
const r = document.getElementById("quiz-result");
r.style.display = "block";
const okCount = quizResults.filter(Boolean).length;
const stars = okCount === 5 ? "⭐⭐⭐" : okCount >= 3 ? "⭐⭐" : okCount >= 1 ? "⭐" : "💪";
const msg = okCount === 5 ? "全對！你是數學小天才！" :
okCount >= 3 ? "很不錯！繼續加油！" :
okCount >= 1 ? "有進步！多練習會更厲害！" : "沒關係，練習就是進步的開始！";
r.innerHTML = `<div style="font-size:48px;">${stars}</div><div style="font-size:24px;font-weight:bold;margin:10px 0;">${msg}</div><div style="font-size:18px;">答對 ${okCount} / 5 題，得分 ${quizScore} 分</div><div style="font-size:16px;color:#b8860b;margin-top:8px;">🪙 +${quizScore} 點已加入！</div><button class="btn-teal" onclick="resetQuiz()" style="margin-top:16px;font-size:18px;">🔄 再玩一次</button><button class="btn-gray" onclick="switchMode('ask')" style="margin-top:8px;">📷 去問問題</button>`;
speak(msg + `你答對了${okCount}題，得到${quizScore}分！`);
launchConfetti();
addPoints(quizScore);
if (okCount === 5) earnBadge("perfect");
if (quizResults.length) earnBadge("first");
markDailyQuizDone();
dashSolved += okCount;
updateDash();
}
let errorQuestions = [], errorIdx = 0, errorTries = 0, errorMastered = 0;
function renderErrorBook() {
updateErrorBadge();
document.getElementById("error-quiz").style.display = "none";
document.getElementById("error-done").style.display = "none";
}
function startErrorReview() {
errorQuestions = getErrors();
for (let i = errorQuestions.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[errorQuestions[i], errorQuestions[j]] = [errorQuestions[j], errorQuestions[i]];
}
errorIdx = 0;
errorMastered = 0;
document.getElementById("error-done").style.display = "none";
document.getElementById("error-quiz").style.display = "block";
nextErrorQuestion();
const a = getAnimal();
playAnimalSound("teach", `${a.name}陪你複習錯題，加油！`);
}
function nextErrorQuestion() {
if (errorIdx >= errorQuestions.length) {
finishErrorReview();
return;
}
errorTries = 0;
const q = errorQuestions[errorIdx];
document.getElementById("error-progress").textContent =
`第 ${errorIdx + 1} / ${errorQuestions.length} 題`;
document.getElementById("error-question").innerHTML =
`<div style="font-size:14px;color:#b8860b;margin-bottom:8px;">【${esc(q.type || "數學題")}】</div><div>${esc(q.question)}</div>`;
document.getElementById("error-feedback").textContent = "";
document.getElementById("error-hint").style.display = "none";
speak(speechText(q.question, q.type));
const box = document.getElementById("error-options");
box.innerHTML = "";
const opts = [...(q.options || [])];
for (let i = opts.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[opts[i], opts[j]] = [opts[j], opts[i]];
}
opts.forEach(opt => {
const btn = document.createElement("button");
btn.className = "btn-teal";
btn.style.fontSize = "22px";
btn.style.padding = "18px";
if (opt === "⭕" || opt === "❌") btn.style.fontSize = "36px";
btn.textContent = opt;
btn.onclick = () => checkErrorAnswer(opt, btn);
box.appendChild(btn);
});
}
function checkErrorAnswer(selected, btn) {
const q = errorQuestions[errorIdx];
const fb = document.getElementById("error-feedback");
document.querySelectorAll("#error-options button").forEach(b => b.disabled = true);
btn.disabled = false;
if (String(selected).trim() === String(q.answer).trim()) {
fb.textContent = "🎉 答對了！這題已經學會了！";
fb.style.color = "#27ae60";
btn.style.background = "#d4edda";
removeError(q.question);
errorMastered++;
const ap = getAnimal().praise;
const praiseIdx = Math.floor(Math.random() * ap.length);
playAnimalSound("praise" + (praiseIdx + 1), ap[praiseIdx]).then(() => {
errorIdx++;
setTimeout(nextErrorQuestion, 500);
});
launchConfetti();
addPoints(5); // 複習答對給 5 點
addAnimalXP(getAnimal().audioKey, 5); // 小動物獲得經驗值
} else {
errorTries++;
if (errorTries >= 2) {
fb.textContent = "😅 還沒找到答案，沒關係！";
fb.style.color = "#e74c3c";
btn.style.background = "#f8d7da";
const a = getAnimal();
document.getElementById("error-hint").innerHTML =
"💡 <b>" + a.name + "說：</b>" + esc(q.hint) +
`<div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;"><button class="btn-teal" onclick="startErrorTeaching()" style="font-size:16px;padding:12px 18px;">${a.icon} 再教我一次！</button><button class="btn-gray" onclick="skipErrorQuestion()" style="font-size:16px;padding:12px 18px;">先跳過，下一題</button></div>`;
document.getElementById("error-hint").style.display = "block";
playAnimalSound("encourage", getAnimal().encourage).then(() => {
speak(speechText(q.hint, q.type));
});
} else {
fb.textContent = "🤔 再想想看！";
fb.style.color = "#e67e22";
document.getElementById("error-hint").innerHTML = "💡 <b>提示：</b>" + esc(q.hint);
document.getElementById("error-hint").style.display = "block";
playAnimalSound("encourage", getAnimal().encourage).then(() => {
speak(speechText(q.hint, q.type));
});
document.querySelectorAll("#error-options button").forEach(b => b.disabled = false);
}
}
}
function skipErrorQuestion() {
errorIdx++;
nextErrorQuestion();
}
function startErrorTeaching() {
const q = errorQuestions[errorIdx];
teachingQType = q.type || "";
if (q.teaching && q.teaching.length) {
teachingSteps = q.teaching;
} else {
teachingSteps = [q.hint || "再想想看！"];
loadTeachingTemplates().then(templates => {
if (templates && templates[q.type]) {
teachingSteps = templates[q.type];
renderTeachingStep();
}
});
}
teachingIdx = 0;
window._teachingFromError = true;
renderTeachingStep();
document.getElementById("teaching-modal").style.display = "flex";
playAnimalSound("teach", "讓我來教你！").then(() => {
speak(speechText(teachingSteps[0], teachingQType));
});
}
function finishErrorReview() {
document.getElementById("error-quiz").style.display = "none";
const d = document.getElementById("error-done");
d.style.display = "block";
const remaining = getErrors().length;
d.innerHTML = `<div style="font-size:48px;">${remaining === 0 ? "🏆" : "💪"}</div><div style="font-size:22px;font-weight:bold;margin:10px 0;">
${remaining === 0 ? "太厲害了！錯題全部清空！" : `複習完成！這次學會了 ${errorMastered} 題`}
</div><div style="font-size:16px;color:#666;">${remaining === 0 ? "繼續保持，你是最棒的！" : `還有 ${remaining} 題，下次再來挑戰吧！`}</div><button class="btn-teal" onclick="switchMode('quiz')" style="margin-top:16px;font-size:18px;">🎲 去玩隨機出題</button>`;
const msg = remaining === 0 ? "太厲害了！錯題全部清空，你是最棒的！" : `複習完成！這次學會了${errorMastered}題，還有${remaining}題下次再挑戰！`;
speak(msg);
if (remaining === 0) launchConfetti();
updateErrorBadge();
}
function resetQuiz() {
document.getElementById("quiz-result").style.display = "none";
document.getElementById("quiz-start-btn").style.display = "block";
document.querySelector(".grade-btns").style.display = "flex";
document.getElementById("quiz-start-btn").textContent = "🚀 開始挑戰（" + quizGrade + "）";
}
const LS_KEYS = { points: "wws_points", rewards: "wws_rewards", todos: "wws_todos", badges: "wws_badges", daily: "wws_daily", errors: "wws_errors" };
function lsGet(k, def) {
try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }
catch (e) { return def; }
}
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
const XP_PER_LEVEL = 100;
function getAnimalXPData() { return lsGet("wws_xp", {}); }
function getAnimalXP(audioKey) {
const data = getAnimalXPData();
return data[audioKey] || 0;
}
function getAnimalLevel(audioKey) {
return Math.floor(getAnimalXP(audioKey) / XP_PER_LEVEL) + 1;
}
function getLevelTitle(level) {
if (level >= 10) return "傳說";
if (level >= 8) return "大師";
if (level >= 5) return "高手";
if (level >= 3) return "小達人";
return "新手";
}
function addAnimalXP(audioKey, amount) {
const data = getAnimalXPData();
const oldLevel = getAnimalLevel(audioKey);
data[audioKey] = (data[audioKey] || 0) + amount;
lsSet("wws_xp", data);
const newLevel = getAnimalLevel(audioKey);
updateAnimalLevelDisplay();
if (newLevel > oldLevel) {
const a = ANIMALS.find(x => x.audioKey === audioKey);
const oldStage = oldLevel >= 7 ? 2 : oldLevel >= 3 ? 1 : 0;
const newStage = newLevel >= 7 ? 2 : newLevel >= 3 ? 1 : 0;
const evoChanged = newStage > oldStage;
const newEvoName = a.evolutions[newStage].name;
const newEvoImg = a.evolutions[newStage].img;
setTimeout(() => {
showLevelUpModal(a, newLevel, evoChanged, newEvoName, newEvoImg);
      if (typeof checkAchv === "function") checkAchv("levelup", newLevel);
let speakMsg = `太棒了！${a.name}升級了！現在是${getLevelTitle(newLevel)}！`;
if (evoChanged) {
speakMsg += `進化成${newEvoName}了！`;
}
speak(speakMsg);
launchConfetti();
applyAnimal(); // 更新顯示進化後的圖片
}, 800);
}
}
function showLevelUpModal(animal, level, evolved, evoName, evoImg) {
const old = document.getElementById("levelup-modal");
if (old) old.remove();
const modal = document.createElement("div");
modal.id = "levelup-modal";
modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;justify-content:center;align-items:center;animation:fadeIn .3s;";
const title = getLevelTitle(level);
const evoHtml = evolved ?
`<div style="margin:12px 0;padding:12px;background:linear-gradient(135deg,#fff9c4,#ffeb3b);border-radius:16px;border:2px solid #ffc107;"><div style="font-size:20px;font-weight:bold;color:#f57f17;">🌟 進化！🌟</div><div style="font-size:18px;font-weight:bold;color:#e65100;margin-top:4px;">變成「${evoName}」了！</div></div>` : "";
modal.innerHTML = `
<div style="background:#fff;border-radius:24px;padding:32px 28px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.3);animation:popIn .4s cubic-bezier(.68,-.55,.27,1.55);"><div style="font-size:48px;margin-bottom:8px;">🎉</div><img src="${evoImg}" alt="${evoName}" style="width:120px;height:120px;object-fit:contain;margin:8px auto;display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,.2));" onerror="this.style.display='none';"><div style="font-size:22px;font-weight:bold;color:#333;margin:8px 0;">${evoName}</div><div style="display:inline-block;background:linear-gradient(135deg,#ff9800,#f57c00);color:#fff;font-size:18px;font-weight:bold;padding:8px 20px;border-radius:20px;margin:8px 0;box-shadow:0 3px 8px rgba(255,152,0,.4);">
Lv.${level} ${title}
</div>
${evoHtml}
<div style="font-size:14px;color:#666;margin:12px 0;">✨ ${getSkillDisplay(animal)}</div><button onclick="document.getElementById('levelup-modal').remove();" style="margin-top:12px;padding:12px 40px;font-size:17px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#66bb6a,#43a047);border:none;border-radius:25px;cursor:pointer;box-shadow:0 4px 12px rgba(76,175,80,.4);">
繼續玩！💪
</button></div><style>@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}@keyframes popIn{0%{transform:scale(.5);opacity:0;}100%{transform:scale(1);opacity:1;}}</style>
`;
document.body.appendChild(modal);
modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}
function updateDailyPointsDisplay() {
const el = document.getElementById("daily-points-info");
if (el) {
const today = getTodayPoints();
el.textContent = `今日 ${today}/${DAILY_POINTS_CAP}`;
}
}
function getEvolutionStage(audioKey) {
const level = getAnimalLevel(audioKey);
if (level >= 7) return 2;
if (level >= 3) return 1;
return 0;
}
function getEvolutionInfo(audioKey) {
const a = ANIMALS.find(x => x.audioKey === audioKey);
const stage = getEvolutionStage(audioKey);
return a.evolutions[stage];
}
function getSkillEffect(animal) {
const level = getAnimalLevel(animal.audioKey);
const base = animal.skill;
const lv = level - 1; // Lv.1 時加成為 0
switch (base.type) {
case "bonus_points":
return { type: base.type,
chance: Math.min(base.chance + lv * 0.002, 0.10),
points: base.points + Math.floor(lv / 2) };
case "double_points":
return { type: base.type,
chance: Math.min(base.chance + lv * 0.0015, 0.06) };
case "keep_streak":
return { type: base.type,
chance: Math.min(base.chance + lv * 0.01, 0.35) };
case "daily_bonus":
return { type: base.type,
points: base.points + lv };
default: return base;
}
}
function getSkillDisplay(animal) {
const e = getSkillEffect(animal);
const pct = (e.chance * 100).toFixed(1);
const lv = getAnimalLevel(animal.audioKey);
switch (e.type) {
case "bonus_points": return `${animal.skillName} Lv.${lv}：答對時 ${pct}% 機率多得 ${e.points} 分！`;
case "double_points": return `${animal.skillName} Lv.${lv}：答對時 ${pct}% 機率得分加倍！`;
case "keep_streak": return `${animal.skillName} Lv.${lv}：答錯時 ${pct}% 機率保留連擊！`;
case "daily_bonus": return `${animal.skillName} Lv.${lv}：每天第一次答對多得 ${e.points} 分！`;
default: return animal.skillDesc;
}
}
function triggerCorrectSkill() {
const a = getAnimal();
const e = getSkillEffect(a);
if (typeof getMoodBonus === "function") e.chance = Math.min(e.chance * getMoodBonus(a.audioKey), 0.5);
let bonus = 0, msg = "";
if (e.type === "bonus_points" && Math.random() < e.chance) {
bonus = e.points;
msg = `🍀 ${a.skillName}發動！多得 ${bonus} 分！`;
} else if (e.type === "double_points" && Math.random() < e.chance) {
bonus = -1; // 標記為加倍，由呼叫方處理
msg = `✨ ${a.skillName}發動！得分加倍！`;
} else if (e.type === "daily_bonus") {
const today = new Date().toISOString().slice(0, 10);
const key = "wws_daily_skill_" + a.audioKey;
if (localStorage.getItem(key) !== today) {
localStorage.setItem(key, today);
bonus = e.points;
msg = `🍀 ${a.skillName}發動！每日首答對多得 ${bonus} 分！`;
}
}
return { bonus, msg };
}
function triggerWrongSkill() {
const a = getAnimal();
const e = getSkillEffect(a);
if (typeof getMoodBonus === "function") e.chance = Math.min(e.chance * getMoodBonus(a.audioKey), 0.6);
if (e.type === "keep_streak" && Math.random() < e.chance && quizStreak > 0) {
return { keep: true, msg: `🛡️ ${a.skillName}發動！連擊保留！` };
}
return { keep: false, msg: "" };
}
const ACCESSORIES = [
{ id: "crown", emoji: "👑", name: "金皇冠", price: 200, slot: "hat", top: "-14%", size: "48px" },
{ id: "bow", emoji: "🎀", name: "粉紅蝴蝶結", price: 100, slot: "hat", top: "-2%", left: "68%", size: "36px" },
{ id: "sunglasses", emoji: "🕶️", name: "太陽眼鏡", price: 150, slot: "face", top: "30%", size: "52px" },
{ id: "tophat", emoji: "🎩", name: "魔術帽", price: 180, slot: "hat", top: "-18%", size: "56px" },
{ id: "halo", emoji: "✨", name: "星星光環", price: 250, slot: "hat", top: "-20%", size: "60px" },
{ id: "scarf", emoji: "🧣", name: "紅圍巾", price: 90, slot: "neck", top: "60%", size: "44px" },
{ id: "headphone", emoji: "🎧", name: "音樂耳機", price: 160, slot: "face", top: "16%", size: "56px" },
{ id: "flower", emoji: "🌸", name: "櫻花髮夾", price: 130, slot: "hat", top: "2%", left: "65%", size: "32px" },
];
function getOwnedAccessories() {
try { return JSON.parse(localStorage.getItem("wws_accessories") || "[]"); }
catch (e) { return []; }
}
function ownAccessory(id) {
const owned = getOwnedAccessories();
if (!owned.includes(id)) {
owned.push(id);
localStorage.setItem("wws_accessories", JSON.stringify(owned));
}
}
function getEquipped(audioKey) {
try { return JSON.parse(localStorage.getItem("wws_equipped") || "{}")[audioKey] || null; }
catch (e) { return null; }
}
function getAccConfig(audioKey, accId) {
try {
const all = JSON.parse(localStorage.getItem("wws_acc_config") || "{}");
return (all[audioKey] && all[audioKey][accId]) || { dx: 0, dy: 0, size: null };
} catch (e) { return { dx: 0, dy: 0, size: null }; }
}
function setAccConfig(audioKey, accId, cfg) {
let all = {};
try { all = JSON.parse(localStorage.getItem("wws_acc_config") || "{}"); } catch (e) {}
if (!all[audioKey]) all[audioKey] = {};
all[audioKey][accId] = cfg;
localStorage.setItem("wws_acc_config", JSON.stringify(all));
}
function setEquipped(audioKey, accId) {
let data = {};
try { data = JSON.parse(localStorage.getItem("wws_equipped") || "{}"); } catch (e) {}
if (accId) data[audioKey] = accId;
else delete data[audioKey];
localStorage.setItem("wws_equipped", JSON.stringify(data));
}
function accSizeSet(value) {
const a = getAnimal();
const accId = getEquipped(a.audioKey);
if (!accId) return;
const cfg = getAccConfig(a.audioKey, accId);
cfg.size = parseInt(value);
setAccConfig(a.audioKey, accId, cfg);
applyAnimal();
}
function accSizeChange(delta) {
const a = getAnimal();
const accId = getEquipped(a.audioKey);
if (!accId) return;
const acc = ACCESSORIES.find(x => x.id === accId);
const cfg = getAccConfig(a.audioKey, accId);
const baseSize = parseInt(acc.size);
const curSize = cfg.size || baseSize;
const newSize = Math.max(20, Math.min(120, curSize + delta));
cfg.size = newSize;
setAccConfig(a.audioKey, accId, cfg);
applyAnimal();
openShop();
}
function accReset() {
const a = getAnimal();
const accId = getEquipped(a.audioKey);
if (!accId) return;
setAccConfig(a.audioKey, accId, { dx: 0, dy: 0, size: null });
applyAnimal();
openShop();
}
function buyAccessory(id) {
const acc = ACCESSORIES.find(a => a.id === id);
if (!acc) return;
const owned = getOwnedAccessories();
if (owned.includes(id)) { alert("已經擁有囉！"); return; }
if (kidPoints < acc.price) { alert(`點數不夠！需要 ${acc.price} 點，你有 ${kidPoints} 點。多玩遊戲賺點數吧！💪`); return; }
if (confirm(`要用 ${acc.price} 點買「${acc.emoji} ${acc.name}」嗎？`)) {
kidPoints -= acc.price;
lsSet(LS_KEYS.points, kidPoints);
ownAccessory(id);
if (typeof updatePointsDisplay === "function") updatePointsDisplay();
openShop();
alert(`🎉 買到「${acc.name}」了！點「裝備」穿上吧！`);
}
}
function toggleEquip(id) {
const a = getAnimal();
const current = getEquipped(a.audioKey);
setEquipped(a.audioKey, current === id ? null : id);
applyAnimal();
openShop();
}
function openShop() {
let modal = document.getElementById("shop-modal");
if (modal) modal.remove();
modal = document.createElement("div");
modal.id = "shop-modal";
modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
const owned = getOwnedAccessories();
const equipped = getEquipped(getAnimal().audioKey);
let itemsHtml = ACCESSORIES.map(acc => {
const isOwned = owned.includes(acc.id);
const isEquipped = equipped === acc.id;
const btnHtml = !isOwned
? `<button onclick="buyAccessory('${acc.id}')" style="padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ff9800,#f57c00);border:none;border-radius:20px;cursor:pointer;">${acc.price} 點購買</button>`
: isEquipped
? `<button onclick="toggleEquip('${acc.id}')" style="padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:#9e9e9e;border:none;border-radius:20px;cursor:pointer;">卸下</button><div style="margin-top:10px;"><div style="font-size:12px;color:#666;margin-bottom:4px;">🔍 大小調整</div><input type="range" min="20" max="120" value="${(getAccConfig(getAnimal().audioKey, acc.id).size || parseInt(acc.size))}" oninput="accSizeSet(this.value)" style="width:100%;accent-color:#ab47bc;cursor:pointer;"></div><button onclick="accReset()" style="margin-top:8px;padding:6px 16px;font-size:12px;color:#666;background:#f5f5f5;border:1px solid #ddd;border-radius:12px;cursor:pointer;">重置位置</button><div style="font-size:11px;color:#999;margin-top:6px;">💡 直接拖拉飾品可移動位置</div>`
: `<button onclick="toggleEquip('${acc.id}')" style="padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#66bb6a,#43a047);border:none;border-radius:20px;cursor:pointer;">✨ 裝備</button>`;
return `
<div style="background:#fff;border-radius:16px;padding:12px;text-align:center;border:${isEquipped ? "3px solid #4CAF50" : "2px solid #eee"};"><div style="font-size:44px;">${acc.emoji}</div><div style="font-size:14px;font-weight:bold;color:#333;margin:4px 0;">${acc.name}</div><div style="margin-top:8px;">${btnHtml}</div>
${isOwned ? '<div style="font-size:11px;color:#4CAF50;margin-top:4px;">✅ 已擁有</div>' : ""}
</div>`;
}).join("");
modal.innerHTML = `
<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h2 style="margin:0;font-size:20px;">🛍️ 裝飾品商城</h2><div style="background:#fff3e0;padding:6px 14px;border-radius:15px;font-weight:bold;color:#e65100;">⭐ ${kidPoints} 點</div></div><p style="font-size:13px;color:#666;margin:0 0 12px;">幫你的小動物打扮！點數從遊戲中賺取 💪</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${itemsHtml}</div><button onclick="document.getElementById('shop-modal').remove();" style="margin-top:16px;width:100%;padding:12px;font-size:16px;font-weight:bold;color:#fff;background:#9e9e9e;border:none;border-radius:12px;cursor:pointer;">關閉</button></div>`;
document.body.appendChild(modal);
modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}
function renderAccessoryOverlay(container) {
const a = getAnimal();
const accId = getEquipped(a.audioKey);
const old = container.querySelector(".acc-overlay");
if (old) old.remove();
if (!accId) return;
const acc = ACCESSORIES.find(x => x.id === accId);
if (!acc) return;
const cfg = getAccConfig(a.audioKey, accId);
const size = cfg.size || parseInt(acc.size);
const overlay = document.createElement("div");
overlay.className = "acc-overlay";
overlay.style.cssText = `position:absolute;top:${acc.top};left:${acc.left || "50%"};transform:translate(calc(-50% + ${cfg.dx}px), ${cfg.dy}px);font-size:${size}px;z-index:5;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2));cursor:move;touch-action:none;`;
overlay.textContent = acc.emoji;
overlay.title = "拖拉我調整位置！";
container.style.position = "relative";
container.appendChild(overlay);
let sdrag = false, sx = 0, sy = 0, sdx = 0, sdy = 0;
overlay.addEventListener("mousedown", (ev) => {
sdrag = true; sx = ev.clientX; sy = ev.clientY;
const c = getAccConfig(a.audioKey, accId); sdx = c.dx; sdy = c.dy;
ev.stopPropagation(); ev.preventDefault();
});
overlay.addEventListener("touchstart", (ev) => {
const t = ev.touches[0];
sdrag = true; sx = t.clientX; sy = t.clientY;
const c = getAccConfig(a.audioKey, accId); sdx = c.dx; sdy = c.dy;
ev.stopPropagation(); ev.preventDefault();
}, { passive: false });
document.addEventListener("mousemove", (ev) => {
if (!sdrag) return;
const c = getAccConfig(a.audioKey, accId);
c.dx = sdx + (ev.clientX - sx); c.dy = sdy + (ev.clientY - sy);
setAccConfig(a.audioKey, accId, c);
overlay.style.transform = `translate(calc(-50% + ${c.dx}px), ${c.dy}px)`;
});
document.addEventListener("touchmove", (ev) => {
if (!sdrag) return;
const t = ev.touches[0];
const c = getAccConfig(a.audioKey, accId);
c.dx = sdx + (t.clientX - sx); c.dy = sdy + (t.clientY - sy);
setAccConfig(a.audioKey, accId, c);
overlay.style.transform = `translate(calc(-50% + ${c.dx}px), ${c.dy}px)`;
}, { passive: true });
const endDrag = () => { sdrag = false; };
document.addEventListener("mouseup", endDrag);
document.addEventListener("touchend", endDrag);
}
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
function getErrors() { return lsGet(LS_KEYS.errors, []); }
function addError(q) {
const errors = getErrors();
if (errors.some(e => e.question === q.question)) return;
errors.push({
question: q.question,
answer: q.answer,
hint: q.hint,
type: q.type,
grade: q.grade,
options: q.options,
addedAt: Date.now()
});
lsSet(LS_KEYS.errors, errors);
updateErrorBadge();
}
function removeError(question) {
const errors = getErrors().filter(e => e.question !== question);
lsSet(LS_KEYS.errors, errors);
updateErrorBadge();
}
function updateErrorBadge() {
const count = getErrors().length;
const badge = document.getElementById("error-badge");
if (badge) {
badge.textContent = count > 0 ? count : "";
badge.style.display = count > 0 ? "inline-block" : "none";
}
const emptyMsg = document.getElementById("error-empty");
const startBtn = document.getElementById("error-start-btn");
if (emptyMsg) emptyMsg.style.display = count > 0 ? "none" : "block";
if (startBtn) startBtn.style.display = count > 0 ? "block" : "none";
}
let kidPoints = lsGet(LS_KEYS.points, 0);
let rewards = lsGet(LS_KEYS.rewards, []);
let parentTodos = lsGet(LS_KEYS.todos, []);
let badges = lsGet(LS_KEYS.badges, []);
const BADGE_DEFS = [
{ id: "first", icon: "🌱", name: "初試身手", desc: "完成第一輪出題" },
{ id: "streak3", icon: "🔥", name: "連擊王", desc: "連續答對 3 題" },
{ id: "perfect", icon: "💯", name: "完美通關", desc: "一輪 5 題全對" },
{ id: "asker", icon: "🦖", name: "愛發問", desc: "用拍照問問題解開 3 題" },
{ id: "hundred", icon: "💪", name: "百點達人", desc: "累積 100 點" },
{ id: "daily", icon: "📅", name: "天天練習", desc: "完成今日任務" },
];
const DAILY_POINTS_CAP = 200;
function getTodayPointsKey() {
return "wws_daily_points_" + new Date().toISOString().slice(0, 10);
}
function getTodayPoints() {
return lsGet(getTodayPointsKey(), 0);
}
function addTodayPoints(n) {
const total = getTodayPoints() + n;
lsSet(getTodayPointsKey(), total);
return total;
}
function checkAbnormalSpeed() {
const key = "wws_answer_times";
const now = Date.now();
let times = lsGet(key, []);
times.push(now);
times = times.slice(-10);
lsSet(key, times);
if (times.length >= 5) {
const intervals = [];
for (let i = 1; i < times.length; i++) {
intervals.push(times[i] - times[i-1]);
}
const recent = intervals.slice(-4);
const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
if (avg < 2000) {
return true;
}
}
return false;
}
function checkRepeatType(qtype) {
const key = "wws_recent_types";
const now = Date.now();
let recent = lsGet(key, []);
recent = recent.filter(r => now - r.time < 5 * 60 * 1000);
recent.push({ type: qtype, time: now });
lsSet(key, recent);
const sameType = recent.filter(r => r.type === qtype).length;
return sameType >= 4;
}
function addPoints(n) {
let actualPoints = n;
let reason = "";
const todayTotal = getTodayPoints();
if (todayTotal >= DAILY_POINTS_CAP) {
actualPoints = 0;
reason = "今日點數已達上限";
} else if (todayTotal + n > DAILY_POINTS_CAP) {
actualPoints = DAILY_POINTS_CAP - todayTotal;
reason = "今日點數已達上限";
}
if (actualPoints > 0 && checkAbnormalSpeed()) {
actualPoints = 0;
reason = "作答速度異常，不給分";
}
if (actualPoints > 0) {
kidPoints += actualPoints;
lsSet(LS_KEYS.points, kidPoints);
addTodayPoints(actualPoints);
document.getElementById("kid-points").textContent = kidPoints;
updateDailyPointsDisplay();
checkBadges();
checkRewardMilestones();
renderKidRewards();
} else if (reason) {
console.log("防刷分：" + reason);
}
return { points: actualPoints, reason: reason };
}
function earnBadge(id) {
if (badges.includes(id)) return;
badges.push(id);
lsSet(LS_KEYS.badges, badges);
const def = BADGE_DEFS.find(b => b.id === id);
if (def) {
speak(`恭喜獲得徽章「${def.name}」！`);
launchConfetti();
}
renderBadges();
}
function checkBadges() {
if (kidPoints >= 100) earnBadge("hundred");
}
function renderBadges() {
const row = document.getElementById("badge-row");
if (!row) return;
row.innerHTML = "";
BADGE_DEFS.forEach(b => {
const d = document.createElement("div");
const earned = badges.includes(b.id);
d.className = "badge " + (earned ? "earned" : "locked");
d.innerHTML = b.icon + `<span class="bname">${b.name}</span>`;
d.title = b.desc;
row.appendChild(d);
});
}
function saveRewards() { lsSet(LS_KEYS.rewards, rewards); renderRewardList(); renderKidRewards(); }
function addReward() {
const name = document.getElementById("new-reward-name").value.trim();
const pts = parseInt(document.getElementById("new-reward-points").value, 10);
if (!name || !pts || pts < 1) { alert("請輸入獎勵名稱和點數！"); return; }
rewards.push({ id: Date.now(), name, points: pts, icon: "🎁" });
document.getElementById("new-reward-name").value = "";
document.getElementById("new-reward-points").value = "";
saveRewards();
}
function addRewardTemplate(name, points, icon) {
rewards.push({ id: Date.now(), name, points, icon });
saveRewards();
}
function delReward(id) {
rewards = rewards.filter(r => r.id !== id);
saveRewards();
}
function renderRewardList() {
const el = document.getElementById("reward-list");
if (!el) return;
if (!rewards.length) { el.innerHTML = '<p class="hint">還沒設定獎勵，用上方快速新增或自訂一個吧！</p>'; return; }
el.innerHTML = "";
rewards.forEach(r => {
const d = document.createElement("div");
d.className = "reward-item";
d.innerHTML = `<div class="rinfo"><div class="rname2">${r.icon} ${esc(r.name)}</div><div class="rpts">${r.points} 點可兌換</div></div><button class="rdel" onclick="delReward(${r.id})">刪除</button>`;
el.appendChild(d);
});
}
function renderKidRewards() {
const el = document.getElementById("kid-rewards");
if (!el) return;
el.innerHTML = "";
if (!rewards.length) {
el.innerHTML = '<p class="hint" style="text-align:center;">還沒有獎勵目標，請爸爸媽媽在「家長設定區」設定喔！</p>';
return;
}
const sorted = [...rewards].sort((a, b) => a.points - b.points);
sorted.forEach(r => {
const done = kidPoints >= r.points;
const pct = Math.min(100, Math.round(kidPoints / r.points * 100));
const d = document.createElement("div");
d.className = "reward-progress" + (done ? " done" : "");
d.innerHTML = `<div class="rname">${r.icon} ${esc(r.name)}</div><div class="rbar"><div class="rfill" style="width:${pct}%">${pct}%</div></div><div class="rtext">${done ? "🎉 達標了！快叫爸爸媽媽兌現！" : `再 ${r.points - kidPoints} 點就能兌換！`}</div>`;
el.appendChild(d);
});
}
function checkRewardMilestones() {
rewards.forEach(r => {
if (kidPoints >= r.points) {
const exists = parentTodos.some(t => t.rewardId === r.id && !t.done);
if (!exists) {
parentTodos.push({
id: Date.now(), rewardId: r.id,
text: `🎁 小孩集滿 ${r.points} 點了！該兌現「${r.name}」囉！`,
time: new Date().toLocaleString("zh-TW"),
done: false
});
lsSet(LS_KEYS.todos, parentTodos);
renderParentTodos();
speak(`太棒了！你集滿${r.points}點，可以換${r.name}了！快告訴爸爸媽媽！`);
}
}
});
}
function renderParentTodos() {
const el = document.getElementById("parent-todos");
if (!el) return;
const pending = parentTodos.filter(t => !t.done);
const countEl = document.getElementById("todo-count");
if (countEl) countEl.textContent = pending.length ? `(${pending.length} 待辦)` : "";
if (!parentTodos.length) { el.innerHTML = '<p class="hint">目前沒有待辦事項。</p>'; return; }
el.innerHTML = "";
[...parentTodos].reverse().forEach(t => {
const d = document.createElement("div");
d.className = "todo-item" + (t.done ? " done" : "");
d.innerHTML = `<div class="t-text">${esc(t.text)}</div><div class="t-time">${esc(t.time)}</div>` +
(t.done ? '<div style="color:#1a8a82;">✅ 已完成</div>'
: `<button class="btn-teal" onclick="completeTodo(${t.id})" style="margin-top:8px;">✅ 已完成兌現</button>`);
el.appendChild(d);
});
}
function completeTodo(id) {
const t = parentTodos.find(x => x.id === id);
if (t) { t.done = true; lsSet(LS_KEYS.todos, parentTodos); renderParentTodos(); }
}
function todayStr() { return new Date().toISOString().slice(0, 10); }
function checkDailyTask() {
const d = lsGet(LS_KEYS.daily, {});
const done = d.date === todayStr() && d.quizDone;
const el = document.getElementById("daily-task");
const pEl = document.getElementById("daily-progress");
if (!el) return;
if (done) {
el.classList.add("done");
if (pEl) pEl.textContent = "進度：1 / 1 ✅ 完成！";
} else {
el.classList.remove("done");
if (pEl) pEl.textContent = "進度：0 / 1";
}
}
function markDailyQuizDone() {
lsSet(LS_KEYS.daily, { date: todayStr(), quizDone: true });
checkDailyTask();
earnBadge("daily");
addPoints(20);  // 每日任務獎勵 20 點
}
(function initRewardSystem() {
document.getElementById("kid-points").textContent = kidPoints;
renderBadges();
renderRewardList();
renderKidRewards();
renderParentTodos();
checkDailyTask();
})();
const FOODS = [
{ id: "feed", emoji: "🍚", name: "普通飼料", price: 20, xp: 10, desc: "基本營養，每隻都吃" },
{ id: "fish", emoji: "🐟", name: "新鮮小魚", price: 50, xp: 30, likedBy: ["cat"], desc: "🐱 咪咪最愛！" },
{ id: "milk", emoji: "🥛", name: "香濃牛奶", price: 40, xp: 22, likedBy: ["cat"], desc: "🐱 咪咪喜歡" },
{ id: "bone", emoji: "🦴", name: "大骨頭", price: 50, xp: 30, likedBy: ["dog"], desc: "🐶 豆豆最愛！" },
{ id: "meat", emoji: "🍖", name: "烤肉大餐", price: 45, xp: 24, likedBy: ["dog"], desc: "🐶 豆豆喜歡" },
{ id: "carrot", emoji: "🥕", name: "紅蘿蔔", price: 50, xp: 30, likedBy: ["rabbit"], desc: "🐰 跳跳最愛！" },
{ id: "grass", emoji: "🌿", name: "新鮮牧草", price: 35, xp: 18, likedBy: ["rabbit"], desc: "🐰 跳跳喜歡" },
{ id: "bamboo", emoji: "🎋", name: "綠竹子", price: 50, xp: 30, likedBy: ["panda"], desc: "🐼 圓圓最愛！" },
{ id: "bambooshoot", emoji: "🌱", name: "竹筍", price: 40, xp: 22, likedBy: ["panda"], desc: "🐼 圓圓喜歡" },
{ id: "chicken", emoji: "🍗", name: "烤雞腿", price: 50, xp: 30, likedBy: ["fox"], desc: "🦊 小乖最愛！" },
{ id: "grape", emoji: "🍇", name: "甜葡萄", price: 40, xp: 22, likedBy: ["fox"], desc: "🦊 小乖喜歡" },
{ id: "apple", emoji: "🍎", name: "紅蘋果", price: 45, xp: 24, likedBy: ["pig"], desc: "🐷 胖胖喜歡" },
{ id: "cake", emoji: "🍰", name: "草莓蛋糕", price: 55, xp: 32, likedBy: ["pig"], desc: "🐷 胖胖最愛！" },
{ id: "chili", emoji: "🌶️", name: "魔鬼辣椒", price: 10, xp: -8, disliked: true, desc: "⚠️ 太辣了！會扣經驗！" },
{ id: "lemon", emoji: "🍋", name: "酸檸檬", price: 10, xp: -8, disliked: true, desc: "⚠️ 太酸了！會扣經驗！" },
];
const MAX_FEED_PER_DAY = 5;
function getFoodInv() {
try { return JSON.parse(localStorage.getItem("wws_food_inv") || "{}"); }
catch (e) { return {}; }
}
function addFood(id, n) {
const inv = getFoodInv();
inv[id] = (inv[id] || 0) + n;
localStorage.setItem("wws_food_inv", JSON.stringify(inv));
}
function useFood(id) {
const inv = getFoodInv();
if ((inv[id] || 0) <= 0) return false;
inv[id]--;
if (inv[id] <= 0) delete inv[id];
localStorage.setItem("wws_food_inv", JSON.stringify(inv));
return true;
}
function getFeedCount() {
const today = new Date().toISOString().slice(0, 10);
try {
const d = JSON.parse(localStorage.getItem("wws_feed_daily") || "{}");
return d.date === today ? d.count : 0;
} catch (e) { return 0; }
}
function incFeedCount() {
const today = new Date().toISOString().slice(0, 10);
let d = {};
try { d = JSON.parse(localStorage.getItem("wws_feed_daily") || "{}"); } catch (e) {}
if (d.date !== today) d = { date: today, count: 0 };
d.count++;
localStorage.setItem("wws_feed_daily", JSON.stringify(d));
}
function buyFood(id) {
const food = FOODS.find(f => f.id === id);
if (!food) return;
if (kidPoints < food.price) { alert(`點數不夠！需要 ${food.price} 點，你有 ${kidPoints} 點。`); return; }
if (confirm(`要用 ${food.price} 點買「${food.emoji} ${food.name}」嗎？\n${food.desc}`)) {
kidPoints -= food.price;
lsSet(LS_KEYS.points, kidPoints);
addFood(id, 1);
if (typeof updatePointsDisplay === "function") updatePointsDisplay();
renderFeedZone();
openFoodShop();
}
}
function feedAnimal(foodId) {
const a = getAnimal();
const food = FOODS.find(f => f.id === foodId);
if (!food || !useFood(foodId)) { alert("沒有這個食物了！去商城買吧！"); return; }
if (getFeedCount() >= MAX_FEED_PER_DAY) {
addFood(foodId, 1); // 退回
alert(`今天已經餵 ${MAX_FEED_PER_DAY} 次了，明天再來吧！🌙`);
return;
}
incFeedCount();
  if (typeof incStat === "function") incStat("feed", 1);
let xpGain = food.xp;
let msg = "";
let mood = "";
if (food.disliked) {
mood = "😖";
msg = `${a.name}吃了${food.emoji}${food.name}...${mood}\n太難吃了！經驗值 -${Math.abs(xpGain)}！下次別餵這個了！`;
playAnimalSound("encourage", a.encourage);
} else if (food.likedBy && food.likedBy.includes(a.audioKey)) {
xpGain = Math.floor(food.xp * 1.5);
mood = "😍";
msg = `${a.name}超愛${food.emoji}${food.name}！${mood}\n獲得 ${xpGain} 經驗值！`;
playAnimalSound("praise1", a.praise[0]);
} else {
mood = "😋";
msg = `${a.name}吃了${food.emoji}${food.name}！${mood}\n獲得 ${xpGain} 經驗值！`;
playAnimalSound("praise1", a.praise[0]);
}
addAnimalXP(a.audioKey, xpGain);
if (!food.disliked) addSatiety(a.audioKey, 15 + Math.floor(food.xp / 2));
  const _liked = food.likedBy && food.likedBy.includes(a.audioKey);
  if (typeof addMood === "function") addMood(a.audioKey, food.disliked ? -8 : _liked ? 10 : 4);
const el = document.getElementById("animal-big-icon");
if (el) {
const img = el.querySelector("img") || el;
img.style.transition = "transform .2s";
img.style.transform = "scale(1.2)";
setTimeout(() => { img.style.transform = "scale(1)"; }, 300);
}
setTimeout(() => alert(msg), 300);
renderFeedZone();
}
function renderFeedZone() {
const zone = document.getElementById("feed-foods");
if (!zone) return;
const inv = getFoodInv();
const a = getAnimal();
const count = getFeedCount();
document.getElementById("feed-count").textContent = `今日已餵 ${count}/${MAX_FEED_PER_DAY}`;
const items = Object.keys(inv).filter(id => inv[id] > 0);
if (items.length === 0) {
zone.innerHTML = '<div style="font-size:13px;color:#999;">還沒有食物，去商城買吧！🛒</div>';
return;
}
zone.innerHTML = items.map(id => {
const f = FOODS.find(x => x.id === id);
if (!f) return "";
const liked = f.likedBy && f.likedBy.includes(a.audioKey);
const disliked = f.disliked;
const badge = liked ? '<span style="font-size:10px;background:#c8e6c9;padding:2px 6px;border-radius:8px;">❤️ 最愛</span>' : disliked ? '<span style="font-size:10px;background:#ffcdd2;padding:2px 6px;border-radius:8px;">⚠️ 小心</span>' : '';
return `<button onclick="feedAnimal('${id}')" style="background:#fff;border:2px solid #ffd54f;border-radius:12px;padding:8px 10px;cursor:pointer;text-align:center;min-width:70px;"><div style="font-size:28px;">${f.emoji}</div><div style="font-size:11px;font-weight:bold;">${f.name}</div><div style="font-size:11px;color:#e65100;">x${inv[id]}</div>${badge}
</button>`;
}).join("");
}
function renderSkillCard() {
const el = document.getElementById("skill-card");
if (!el) return;
const a = getAnimal();
el.innerHTML = `<div style="font-size:14px;font-weight:bold;color:#4527a0;">✨ 被動技能：${a.skillName}</div><div style="font-size:13px;color:#5e35b1;margin-top:4px;">${getSkillDisplay(a)}</div>`;
}
function openFoodShop() {
let modal = document.getElementById("food-modal");
if (modal) modal.remove();
modal = document.createElement("div");
modal.id = "food-modal";
modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
const a = getAnimal();
const itemsHtml = FOODS.map(f => {
const liked = f.likedBy && f.likedBy.includes(a.audioKey);
const hl = liked ? 'border:3px solid #4CAF50;background:#e8f5e9;' : f.disliked ? 'border:2px solid #ef9a9a;' : 'border:2px solid #eee;';
const tag = liked ? '<div style="font-size:11px;color:#2e7d32;font-weight:bold;">❤️ ' + a.name + '的最愛！經驗 x1.5</div>' : f.disliked ? '<div style="font-size:11px;color:#c62828;">⚠️ 會扣經驗值！</div>' : `<div style="font-size:11px;color:#999;">+${f.xp} 經驗</div>`;
return `<div style="background:#fff;border-radius:16px;padding:12px;text-align:center;${hl}"><div style="font-size:40px;">${f.emoji}</div><div style="font-size:14px;font-weight:bold;margin:4px 0;">${f.name}</div><div style="font-size:12px;color:#666;">${f.desc}</div>${tag}
<button onclick="buyFood('${f.id}')" style="margin-top:8px;padding:8px 16px;font-size:14px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#ff9800,#f57c00);border:none;border-radius:20px;cursor:pointer;">${f.price} 點</button></div>`;
}).join("");
modal.innerHTML = `<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><h2 style="margin:0;font-size:20px;">🍽️ 食物商城</h2><div style="background:#fff3e0;padding:6px 14px;border-radius:15px;font-weight:bold;color:#e65100;">⭐ ${kidPoints} 點</div></div><p style="font-size:13px;color:#666;margin:0 0 12px;">買食物餵${a.name}長大！❤️標記的是${a.name}的最愛，經驗更多！<br>⚠️ 辣椒和檸檬很難吃，會扣經驗值喔！</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${itemsHtml}</div><button onclick="document.getElementById('food-modal').remove();" style="margin-top:16px;width:100%;padding:12px;font-size:16px;font-weight:bold;color:#fff;background:#9e9e9e;border:none;border-radius:12px;cursor:pointer;">關閉</button></div>`;
document.body.appendChild(modal);
modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}
const MAX_SAT = 100;
function getSatiety(audioKey) {
try {
const d = JSON.parse(localStorage.getItem("wws_satiety") || "{}");
const now = Date.now();
let s = d[audioKey];
if (!s) return 80;
const hoursPassed = (now - s.ts) / 3600000;
const decay = Math.floor(hoursPassed * 8);
return Math.max(0, s.val - decay);
} catch (e) { return 80; }
}
function setSatiety(audioKey, val) {
let d = {};
try { d = JSON.parse(localStorage.getItem("wws_satiety") || "{}"); } catch (e) {}
d[audioKey] = { val: Math.max(0, Math.min(MAX_SAT, val)), ts: Date.now() };
localStorage.setItem("wws_satiety", JSON.stringify(d));
updateRpgHud();
}
function addSatiety(audioKey, n) {
setSatiety(audioKey, getSatiety(audioKey) + n);
}
function updateRpgHud() {
const a = getAnimal();
if (!a) return;
const evo = getEvolutionInfo(a.audioKey);
const level = getAnimalLevel(a.audioKey);
const xp = getAnimalXP(a.audioKey);
const xpProg = xp % XP_PER_LEVEL;
const sat = getSatiety(a.audioKey);
const av = document.getElementById("hud-avatar");
if (av) av.innerHTML = `<img src="${evo.img}" alt="${evo.name}" onerror="this.outerHTML='${a.icon}'">`;
const nm = document.getElementById("hud-name");
if (nm) nm.textContent = evo.name;
const lv = document.getElementById("hud-lv");
if (lv) lv.textContent = "Lv." + level;
const st = document.getElementById("hud-sat-text");
if (st) st.textContent = sat + "/" + MAX_SAT;
const sf = document.getElementById("hud-sat-fill");
if (sf) {
sf.style.width = sat + "%";
sf.style.background = sat < 25 ? "linear-gradient(90deg,#e53935,#ef5350)" : sat < 50 ? "linear-gradient(90deg,#fb8c00,#ffb74d)" : "linear-gradient(90deg,#ff9800,#ffc107)";
}
const xt = document.getElementById("hud-xp-text");
if (xt) xt.textContent = xpProg + "/" + XP_PER_LEVEL;
const xf = document.getElementById("hud-xp-fill");
if (xf) xf.style.width = (xpProg / XP_PER_LEVEL * 100) + "%";
const cn = document.getElementById("hud-coins");
if (cn) cn.textContent = kidPoints.toLocaleString();
if (sat < 20) {
const warn = document.getElementById("hud-sat-warn");
if (!warn) {
const w = document.createElement("div");
w.id = "hud-sat-warn";
w.style.cssText = "font-size:11px;color:#ff8a80;margin-top:4px;animation:blink 1s infinite;";
w.textContent = "⚠️ 肚子餓了！快餵食，不然經驗值減半！";
document.querySelector("#rpg-hud .hud-info").appendChild(w);
}
} else {
const warn = document.getElementById("hud-sat-warn");
if (warn) warn.remove();
}
}
const _origFeed = window.feedAnimal;
const HUNGER_LEVEL_DROP_HOURS = 12; // 飢餓12小時降1級
function getHungerState(audioKey) {
try { return JSON.parse(localStorage.getItem("wws_hunger") || "{}")[audioKey] || null; }
catch (e) { return null; }
}
function setHungerState(audioKey, state) {
let d = {};
try { d = JSON.parse(localStorage.getItem("wws_hunger") || "{}"); } catch (e) {}
if (state) d[audioKey] = state;
else delete d[audioKey];
localStorage.setItem("wws_hunger", JSON.stringify(d));
}
function isFainted(audioKey) {
try { return (JSON.parse(localStorage.getItem("wws_fainted") || "[]")).includes(audioKey); }
catch (e) { return false; }
}
function setFainted(audioKey, fainted) {
let arr = [];
try { arr = JSON.parse(localStorage.getItem("wws_fainted") || "[]"); } catch (e) {}
if (fainted && !arr.includes(audioKey)) arr.push(audioKey);
if (!fainted) arr = arr.filter(x => x !== audioKey);
localStorage.setItem("wws_fainted", JSON.stringify(arr));
}
function checkHunger() {
const now = Date.now();
ANIMALS.forEach(a => {
const key = a.audioKey;
if (isFainted(key)) return;
const sat = getSatiety(key);
const hs = getHungerState(key);
if (sat <= 0) {
if (!hs) {
setHungerState(key, { since: now, warned: false });
} else {
const hours = (now - hs.since) / 3600000;
const drops = Math.floor(hours / HUNGER_LEVEL_DROP_HOURS);
if (drops > 0) {
const curLv = getAnimalLevel(key);
const newLv = Math.max(1, curLv - drops);
if (newLv < curLv) {
const data = lsGet("wws_xp", {});
data[key] = (newLv - 1) * XP_PER_LEVEL;
lsSet("wws_xp", data);
setSatiety(key, 15);
setHungerState(key, null);
if (typeof updateRpgHud === "function") updateRpgHud();
if (getAnimal().audioKey === key) {
setTimeout(() => alert(`😢 ${a.name}太餓了，等級從 Lv.${curLv} 降到 Lv.${newLv}！\n記得每天餵食喔！`), 1000);
}
}
if (curLv <= 1 && hours >= HUNGER_LEVEL_DROP_HOURS * 2) {
setFainted(key, true);
setHungerState(key, null);
if (getAnimal().audioKey === key) {
const alive = ANIMALS.find(x => !isFainted(x.audioKey));
if (alive) {
setAnimal(ANIMALS.indexOf(alive));
setTimeout(() => alert(`😴 ${a.name}餓昏了！已切換成${alive.name}。\n餵食或花 50 點可以喚醒牠！`), 1000);
}
}
}
}
}
} else {
if (hs) setHungerState(key, null);
}
});
updatePickerFaint();
}
function reviveAnimal(audioKey) {
const a = ANIMALS.find(x => x.audioKey === audioKey);
if (kidPoints < 50) { alert(`點數不夠！喚醒需要 50 點，你有 ${kidPoints} 點。`); return; }
if (confirm(`要用 50 點喚醒${a.name}嗎？喚醒後會回到 Lv.1，飽食度 50。`)) {
kidPoints -= 50;
lsSet(LS_KEYS.points, kidPoints);
setFainted(audioKey, false);
const data = lsGet("wws_xp", {});
data[audioKey] = 0;
lsSet("wws_xp", data);
setSatiety(audioKey, 50);
if (typeof updatePointsDisplay === "function") updatePointsDisplay();
if (typeof updateRpgHud === "function") updateRpgHud();
openAnimalPicker();
alert(`🎉 ${a.name}醒來了！好好照顧牠喔！`);
}
}
function updatePickerFaint() {
}
setInterval(checkHunger, 60000);
setTimeout(checkHunger, 2000);

const CHECKIN_REWARDS = [
  { day: 1, points: 20, food: null, label: "20點" },
  { day: 2, points: 30, food: "feed", label: "30點+飼料" },
  { day: 3, points: 40, food: null, label: "40點" },
  { day: 4, points: 50, food: "feed", label: "50點+飼料" },
  { day: 5, points: 60, food: null, label: "60點" },
  { day: 6, points: 80, food: "feed", label: "80點+飼料" },
  { day: 7, points: 100, food: null, acc: "halo", label: "100點+✨光環" },
];
function getCheckin() {
  try { return JSON.parse(localStorage.getItem("wws_checkin") || "{}"); }
  catch (e) { return {}; }
}
function saveCheckin(d) { localStorage.setItem("wws_checkin", JSON.stringify(d)); }
function checkinStatus() {
  const d = getCheckin();
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d.last === today) return { can: false, streak: d.streak || 0, reason: "done" };
  let streak = 1;
  if (d.last === yest) streak = (d.streak || 0) + 1;
  if (streak > 7) streak = 1; // 7天一輪
  return { can: true, streak };
}
function doCheckin() {
  const st = checkinStatus();
  if (!st.can) { alert("今天已經簽到過了，明天再來！"); return; }
  const rw = CHECKIN_REWARDS[st.streak - 1];
  const today = new Date().toISOString().slice(0, 10);
  saveCheckin({ last: today, streak: st.streak });
  kidPoints += rw.points;
  lsSet(LS_KEYS.points, kidPoints);
  let msg = `📅 簽到成功！連續第 ${st.streak} 天\n獲得 ${rw.points} 點！`;
  if (rw.food) { addFood(rw.food, 1); msg += "\n獲得 🍚 普通飼料 x1！"; }
  if (rw.acc) { ownAccessory(rw.acc); msg += "\n🎉 獲得稀有飾品 ✨星星光環！"; }
  if (st.streak === 7) msg += "\n🏆 完成一週簽到！下週繼續！";
  if (typeof updatePointsDisplay === "function") updatePointsDisplay();
  if (typeof updateRpgHud === "function") updateRpgHud();
  if (typeof renderFeedZone === "function") renderFeedZone();
  alert(msg);
  openCheckin();
  checkAchv("checkin", st.streak);
}
function openCheckin() {
  let m = document.getElementById("checkin-modal");
  if (m) m.remove();
  m = document.createElement("div");
  m.id = "checkin-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
  const st = checkinStatus();
  const days = CHECKIN_REWARDS.map((r, i) => {
    const d = i + 1;
    const done = d < st.streak || (!st.can && d <= st.streak);
    const cur = st.can && d === st.streak;
    return `<div style="background:${cur ? "#fff9c4" : done ? "#e8f5e9" : "#fff"};border:${cur ? "3px solid #ffc107" : "2px solid #eee"};border-radius:12px;padding:10px 4px;text-align:center;">
      <div style="font-size:12px;color:#999;">第${d}天</div>
      <div style="font-size:24px;margin:4px 0;">${d === 7 ? "🎁" : d % 2 === 0 ? "🍚" : "⭐"}</div>
      <div style="font-size:11px;font-weight:bold;">${r.label}</div>
      <div style="font-size:11px;">${done ? "✅" : cur ? "👈" : ""}</div>
    </div>`;
  }).join("");
  m.innerHTML = `<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:440px;width:100%;">
    <h2 style="margin:0 0 4px;font-size:20px;text-align:center;">📅 每日簽到</h2>
    <p style="text-align:center;font-size:13px;color:#666;margin:0 0 12px;">連續簽到7天可獲得稀有飾品！</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">${days}</div>
    ${st.can
      ? `<button onclick="doCheckin()" style="width:100%;padding:14px;font-size:17px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#66bb6a,#43a047);border:none;border-radius:16px;cursor:pointer;">簽到領獎！</button>`
      : `<div style="text-align:center;padding:12px;background:#e8f5e9;border-radius:12px;color:#2e7d32;font-weight:bold;">✅ 今天已簽到，明天再來！</div>`}
    <button onclick="document.getElementById('checkin-modal').remove();" style="margin-top:10px;width:100%;padding:10px;font-size:14px;color:#666;background:#e0e0e0;border:none;border-radius:12px;cursor:pointer;">關閉</button>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
}


const ACHIEVEMENTS = [
  { id: "q10", icon: "🌱", name: "初露鋒芒", desc: "累計答對 10 題", type: "correct", target: 10, reward: 30 },
  { id: "q100", icon: "🌿", name: "百題斬", desc: "累計答對 100 題", type: "correct", target: 100, reward: 100 },
  { id: "q500", icon: "🌳", name: "數學大師", desc: "累計答對 500 題", type: "correct", target: 500, reward: 300 },
  { id: "streak5", icon: "🔥", name: "連擊新手", desc: "達成 5 連擊", type: "streak", target: 5, reward: 30 },
  { id: "streak10", icon: "⚡", name: "連擊大師", desc: "達成 10 連擊", type: "streak", target: 10, reward: 80 },
  { id: "feed10", icon: "🍚", name: "暖心主人", desc: "累計餵食 10 次", type: "feed", target: 10, reward: 40 },
  { id: "feed50", icon: "👨‍🍳", name: "金牌飼主", desc: "累計餵食 50 次", type: "feed", target: 50, reward: 120 },
  { id: "evo1", icon: "🦋", name: "進化初體驗", desc: "第1隻進化到第2階", type: "evo2", target: 1, reward: 50 },
  { id: "evo6", icon: "🌟", name: "全員進化", desc: "6隻都進化到第2階", type: "evo2", target: 6, reward: 200 },
  { id: "evo3", icon: "👑", name: "傳說收集家", desc: "第1隻進化到最終階", type: "evo3", target: 1, reward: 150 },
  { id: "checkin3", icon: "📅", name: "堅持3天", desc: "連續簽到 3 天", type: "checkin", target: 3, reward: 40 },
  { id: "checkin7", icon: "🗓️", name: "堅持一週", desc: "連續簽到 7 天", type: "checkin", target: 7, reward: 100 },
];
function getAchvData() {
  try { return JSON.parse(localStorage.getItem("wws_achv") || "{}"); }
  catch (e) { return {}; }
}
function saveAchvData(d) { localStorage.setItem("wws_achv", JSON.stringify(d)); }
function getUnlockedAchv() {
  const d = getAchvData();
  return d.unlocked || [];
}
function checkAchv(type, value) {
  const unlocked = getUnlockedAchv();
  let changed = false;
  ACHIEVEMENTS.forEach(ac => {
    if (ac.type !== type || unlocked.includes(ac.id)) return;
    if (value >= ac.target) {
      unlocked.push(ac.id);
      kidPoints += ac.reward;
      changed = true;
      setTimeout(() => alert(`🏆 成就解鎖！\n${ac.icon} ${ac.name}\n${ac.desc}\n獲得 ${ac.reward} 點！`), 500);
    }
  });
  if (changed) {
    const d = getAchvData();
    d.unlocked = unlocked;
    saveAchvData(d);
    lsSet(LS_KEYS.points, kidPoints);
    if (typeof updatePointsDisplay === "function") updatePointsDisplay();
    if (typeof updateRpgHud === "function") updateRpgHud();
  }
  // 檢查進化類成就
  if (type === "levelup") checkEvoAchv();
}
function checkEvoAchv() {
  let evo2 = 0, evo3 = 0;
  ANIMALS.forEach(a => {
    const st = getEvolutionStage(a.audioKey);
    if (st >= 1) evo2++;
    if (st >= 2) evo3++;
  });
  checkAchv("evo2", evo2);
  // evo3 用 target 1
  const unlocked = getUnlockedAchv();
  if (evo3 >= 1 && !unlocked.includes("evo3")) checkAchv("evo3", 1);
}
function openAchv() {
  let m = document.getElementById("achv-modal");
  if (m) m.remove();
  m = document.createElement("div");
  m.id = "achv-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
  const unlocked = getUnlockedAchv();
  const items = ACHIEVEMENTS.map(ac => {
    const un = unlocked.includes(ac.id);
    return `<div style="background:${un ? "#fff8e1" : "#fafafa"};border:${un ? "2px solid #ffc107" : "2px solid #eee"};border-radius:12px;padding:10px;text-align:center;opacity:${un ? 1 : 0.6};">
      <div style="font-size:32px;${un ? "" : "filter:grayscale(100%)"};">${ac.icon}</div>
      <div style="font-size:13px;font-weight:bold;">${ac.name}</div>
      <div style="font-size:11px;color:#666;">${ac.desc}</div>
      <div style="font-size:11px;color:${un ? "#2e7d32" : "#999"};">${un ? "✅ 已解鎖" : `🎁 ${ac.reward}點`}</div>
    </div>`;
  }).join("");
  m.innerHTML = `<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto;">
    <h2 style="margin:0 0 4px;font-size:20px;text-align:center;">🏆 成就殿堂</h2>
    <p style="text-align:center;font-size:13px;color:#666;">已解鎖 ${unlocked.length}/${ACHIEVEMENTS.length}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${items}</div>
    <button onclick="document.getElementById('achv-modal').remove();" style="margin-top:12px;width:100%;padding:10px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">關閉</button>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
}
// 統計：答對題數、餵食次數
function incStat(key, n) {
  let d = {};
  try { d = JSON.parse(localStorage.getItem("wws_stats") || "{}"); } catch (e) {}
  d[key] = (d[key] || 0) + (n || 1);
  localStorage.setItem("wws_stats", JSON.stringify(d));
  if (key === "correct") checkAchv("correct", d[key]);
  if (key === "feed") checkAchv("feed", d[key]);
}


const MAX_MOOD = 100;
function getMood(audioKey) {
  try {
    const d = JSON.parse(localStorage.getItem("wws_mood") || "{}");
    const s = d[audioKey];
    if (!s) return 70;
    // 隨時間下降：每小時 -2
    const hours = (Date.now() - s.ts) / 3600000;
    return Math.max(0, Math.min(MAX_MOOD, s.val - Math.floor(hours * 2)));
  } catch (e) { return 70; }
}
function setMood(audioKey, val) {
  let d = {};
  try { d = JSON.parse(localStorage.getItem("wws_mood") || "{}"); } catch (e) {}
  d[audioKey] = { val: Math.max(0, Math.min(MAX_MOOD, val)), ts: Date.now() };
  localStorage.setItem("wws_mood", JSON.stringify(d));
  updateMoodDisplay();
}
function addMood(audioKey, n) { setMood(audioKey, getMood(audioKey) + n); }
function getMoodFace(mood) {
  if (mood >= 80) return "😊";
  if (mood >= 50) return "🙂";
  if (mood >= 25) return "😐";
  return "😢";
}
function getMoodBonus(audioKey) {
  // 心情影響技能觸發率
  const m = getMood(audioKey);
  if (m >= 80) return 1.5;
  if (m < 25) return 0.75;
  return 1.0;
}
function updateMoodDisplay() {
  const el = document.getElementById("mood-display");
  if (!el) return;
  const a = getAnimal();
  if (!a) return;
  const mood = getMood(a.audioKey);
  const face = getMoodFace(mood);
  const bonus = getMoodBonus(a.audioKey);
  const bonusTxt = bonus > 1 ? '<span style="color:#2e7d32;">技能率+50%!</span>' : bonus < 1 ? '<span style="color:#c62828;">技能率-25%</span>' : '';
  el.innerHTML = `<span style="font-size:18px;">${face}</span>
    <span style="font-size:13px;font-weight:bold;">心情 ${mood}</span>
    <div style="width:100%;height:8px;background:rgba(0,0,0,.1);border-radius:4px;margin-top:4px;overflow:hidden;">
      <div style="height:100%;width:${mood}%;background:${mood >= 80 ? "#66bb6a" : mood >= 50 ? "#ffca28" : "#ef5350"};border-radius:4px;transition:width .5s;"></div>
    </div>
    <div style="font-size:11px;color:#666;margin-top:2px;">${bonusTxt} 摸摸牠、餵喜歡的食物會開心喔！</div>`;
}


function openDex() {
  let m = document.getElementById("dex-modal");
  if (m) m.remove();
  m = document.createElement("div");
  m.id = "dex-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
  let unlocked = 0, total = 0;
  const rows = ANIMALS.map(a => {
    const stage = getEvolutionStage(a.audioKey);
    const cells = a.evolutions.map((evo, si) => {
      total++;
      const has = stage >= si;
      if (has) unlocked++;
      return `<div style="text-align:center;">
        <div style="width:64px;height:64px;margin:0 auto;background:${has ? "#fff" : "#e0e0e0"};border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;${has ? "" : "filter:grayscale(100%) brightness(0.6);"}">
          ${has ? `<img src="${evo.img}" style="width:56px;height:56px;object-fit:contain;" onerror="this.outerHTML='${a.icon}'">` : '<span style="font-size:32px;">❓</span>'}
        </div>
        <div style="font-size:11px;font-weight:bold;margin-top:2px;color:${has ? "#333" : "#999"};">${has ? evo.name : "???"}</div>
        <div style="font-size:10px;color:#999;">${si === 0 ? "第1階" : si === 1 ? "第2階" : "最終階"}</div>
      </div>`;
    }).join("");
    return `<div style="background:#fff;border-radius:16px;padding:12px;margin-bottom:10px;">
      <div style="font-size:15px;font-weight:bold;margin-bottom:8px;">${a.icon} ${a.kind} <span style="font-size:12px;color:#999;">${a.skillName}</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">${cells}</div>
    </div>`;
  }).join("");
  const pct = Math.round(unlocked / total * 100);
  m.innerHTML = `<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;">
    <h2 style="margin:0;font-size:20px;text-align:center;">📖 進化圖鑑</h2>
    <div style="text-align:center;margin:8px 0;">
      <div style="font-size:14px;font-weight:bold;color:#4527a0;">收集進度 ${unlocked}/${total} (${pct}%)</div>
      <div style="height:12px;background:#e0e0e0;border-radius:6px;margin-top:6px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7e57c2,#5c6bc0);border-radius:6px;transition:width .5s;"></div>
      </div>
    </div>
    ${rows}
    <button onclick="document.getElementById('dex-modal').remove();" style="margin-top:8px;width:100%;padding:12px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">關閉</button>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
}


/* ===== 場景管理 ===== */
function goScene(name) {
  document.querySelectorAll(".scene").forEach(s => s.classList.remove("active"));
  const t = document.getElementById("scene-" + name);
  if (t) t.classList.add("active");
  if (name === "quiz") {
    // 進入測驗場景時，把測驗區移過來
    const qc = document.getElementById("quiz-container");
    const qa = document.getElementById("quiz-area");
    if (qc && qa && qa.parentNode !== qc) qc.appendChild(qa);
    if (typeof startQuiz === "function") startQuiz();
  }
  window.scrollTo(0, 0);
}
/* ===== 農場裝飾品 ===== */
const DECO_ITEMS = [
  { id: "tree", icon: "🌳", name: "大樹", price: 100 },
  { id: "flower", icon: "🌷", name: "鬱金香", price: 30 },
  { id: "sunflower", icon: "🌻", name: "向日葵", price: 40 },
  { id: "pond", icon: "🏞️", name: "小池塘", price: 200 },
  { id: "house", icon: "🏠", name: "小木屋", price: 500 },
  { id: "windmill", icon: "🎡", name: "風車", price: 300 },
  { id: "fountain", icon: "⛲", name: "噴泉", price: 350 },
  { id: "bench", icon: "🪑", name: "長椅", price: 80 },
  { id: "lamp", icon: "🏮", name: "燈籠", price: 60 },
  { id: "mushroom", icon: "🍄", name: "蘑菇", price: 25 },
];
function getDeco() {
  try { return JSON.parse(localStorage.getItem("wws_deco") || "[]"); }
  catch (e) { return []; }
}
function saveDeco(d) { localStorage.setItem("wws_deco", JSON.stringify(d)); }
function renderDeco() {
  const layer = document.getElementById("deco-layer");
  if (!layer) return;
  layer.innerHTML = "";
  getDeco().forEach((d, i) => {
    const item = DECO_ITEMS.find(x => x.id === d.id);
    if (!item) return;
    const el = document.createElement("div");
    el.className = "deco-item";
    el.textContent = item.icon;
    el.style.left = (d.x || 20) + "%";
    el.style.top = (d.y || 60) + "%";
    el.style.fontSize = (d.s || 48) + "px";
    el.dataset.idx = i;
    makeDraggable(el, (x, y) => {
      const arr = getDeco();
      arr[i].x = x; arr[i].y = y;
      saveDeco(arr);
    });
    // 長按刪除
    let pressTimer;
    el.addEventListener("touchstart", () => { pressTimer = setTimeout(() => removeDeco(i), 800); }, {passive:true});
    el.addEventListener("touchend", () => clearTimeout(pressTimer));
    layer.appendChild(el);
  });
}
function makeDraggable(el, onDrop) {
  let sx, sy, ox, oy, dragging = false;
  const parent = el.parentNode.getBoundingClientRect();
  function start(e) {
    dragging = true;
    const t = e.touches ? e.touches[0] : e;
    sx = t.clientX; sy = t.clientY;
    const r = el.getBoundingClientRect();
    const pr = el.parentNode.getBoundingClientRect();
    ox = r.left - pr.left; oy = r.top - pr.top;
    el.style.zIndex = 100;
  }
  function move(e) {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const pr = el.parentNode.getBoundingClientRect();
    let nx = ox + (t.clientX - sx), ny = oy + (t.clientY - sy);
    nx = Math.max(0, Math.min(pr.width - 40, nx));
    ny = Math.max(0, Math.min(pr.height - 40, ny));
    el.style.left = nx + "px"; el.style.top = ny + "px";
    el.style.transform = "none";
  }
  function end(e) {
    if (!dragging) return;
    dragging = false;
    el.style.zIndex = "";
    const pr = el.parentNode.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const xPct = Math.round((r.left - pr.left) / pr.width * 100);
    const yPct = Math.round((r.top - pr.top) / pr.height * 100);
    el.style.left = xPct + "%"; el.style.top = yPct + "%";
    if (onDrop) onDrop(xPct, yPct);
  }
  el.addEventListener("mousedown", start);
  el.addEventListener("touchstart", start, {passive:true});
  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move, {passive:false});
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}
function removeDeco(i) {
  if (!confirm("要移除這個裝飾嗎？（不退點數）")) return;
  const arr = getDeco();
  arr.splice(i, 1);
  saveDeco(arr);
  renderDeco();
}
function buyDeco(id) {
  const item = DECO_ITEMS.find(x => x.id === id);
  if (kidPoints < item.price) { alert(`點數不夠！${item.name}要 ${item.price} 點，你有 ${kidPoints} 點。`); return; }
  kidPoints -= item.price;
  lsSet(LS_KEYS.points, kidPoints);
  const arr = getDeco();
  arr.push({ id, x: 10 + Math.random() * 70, y: 55 + Math.random() * 25, s: 48 });
  saveDeco(arr);
  renderDeco();
  if (typeof updatePointsDisplay === "function") updatePointsDisplay();
  if (typeof updateRpgHud === "function") updateRpgHud();
  alert(`🎉 買到 ${item.icon} ${item.name}！拖曳可以移動位置，長按可以移除。`);
  openDecoShop();
}
function openDecoShop() {
  let m = document.getElementById("deco-modal");
  if (m) m.remove();
  m = document.createElement("div");
  m.id = "deco-modal";
  m.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;justify-content:center;align-items:center;padding:16px;";
  const owned = getDeco().length;
  const items = DECO_ITEMS.map(d => `
    <div style="background:#fff;border:2px solid #e0e0e0;border-radius:16px;padding:12px;text-align:center;">
      <div style="font-size:44px;">${d.icon}</div>
      <div style="font-size:14px;font-weight:bold;">${d.name}</div>
      <div style="font-size:13px;color:#f57f17;font-weight:bold;">🪙 ${d.price}點</div>
      <button onclick="buyDeco('${d.id}')" style="margin-top:8px;padding:8px 16px;font-size:13px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#7e57c2,#5c6bc0);border:none;border-radius:12px;cursor:pointer;">購買</button>
    </div>`).join("");
  m.innerHTML = `<div style="background:#f5f5f5;border-radius:24px;padding:20px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;">
    <h2 style="margin:0;font-size:20px;text-align:center;">🏡 農場布置</h2>
    <p style="text-align:center;font-size:13px;color:#666;">已放置 ${owned} 個裝飾｜💰 ${kidPoints} 點</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${items}</div>
    <button onclick="document.getElementById('deco-modal').remove();" style="margin-top:12px;width:100%;padding:12px;background:#9e9e9e;color:#fff;border:none;border-radius:12px;font-size:14px;cursor:pointer;">關閉</button>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
}
// 載入時渲染裝飾
setTimeout(() => { if (typeof renderDeco === "function") renderDeco(); }, 1500);

