/**
 * script.js — センサー検知・画面切替ロジック
 *
 * 絵の中身は variants.js を編集してください。
 * レイアウト・色は style.css を編集してください。
 * このファイルは基本的に触らなくてOKです。
 */

// ============================================================
// 設定（調整したい場合はここだけ変える）
// ============================================================
const THRESHOLD     = 18;   // 振りの強さのしきい値（大きいほど強く振る必要がある）
const TILT_LIMIT    = 40;   // 傾き許容角（度）。画面が上向きのときだけ検知する
const COOLDOWN_MS   = 1200; // 連続検知を防ぐ待機時間（ミリ秒）
const AUTO_RESET_SEC = 5;   // 振り上げ後、自動で戻るまでの秒数

// ============================================================
// 状態
// ============================================================
let variantIdx     = 0;     // 現在選ばれているバリアントの番号
let isAfter        = false; // 振った後の状態かどうか
let animating      = false; // 切替アニメーション中かどうか
let autoResetTimer = null;  // 自動リセット用タイマーID
let lastTrigger    = 0;     // 最後に検知した時刻

// ============================================================
// DOM参照
// ============================================================
const picture    = document.getElementById('picture');
const picSvg     = document.getElementById('pic-svg');
const stateLabel = document.getElementById('state-label');
const zDisp      = document.getElementById('z-disp');
const tiltDisp   = document.getElementById('tilt-disp');
const gauge      = document.getElementById('gauge');
const hint       = document.getElementById('hint');
const debugArea  = document.getElementById('debug-buttons');

// ============================================================
// バリアント切替ボタンを variants.js の数に合わせて自動生成
// ============================================================
VARIANTS.forEach((v, i) => {
  const btn = document.createElement('button');
  btn.textContent = `絵${String.fromCharCode(65 + i)}`; // 絵A, 絵B, 絵C ...
  btn.addEventListener('click', () => {
    variantIdx = i;
    // 振った後の状態でバリアント切替したら振る前にリセット
    if (isAfter) {
      switchToBefore();
    } else {
      render(variantIdx, false);
    }
  });
  debugArea.appendChild(btn);
});

// リセットボタン
const resetBtn = document.createElement('button');
resetBtn.textContent = 'リセット';
resetBtn.addEventListener('click', switchToBefore);
debugArea.appendChild(resetBtn);

// ============================================================
// 描画
// ============================================================
function render(idx, after) {
  const v = VARIANTS[idx];
  picSvg.innerHTML         = after ? v.svgAfter  : v.svgBefore;
  picture.style.background = after ? v.bgAfter   : v.bgBefore;
  stateLabel.textContent   = after ? v.labelAfter : v.labelBefore;
}

render(0, false);

// ============================================================
// 切替（形はそのまま、色だけ変化）
// ============================================================
function switchToAfter() {
  if (isAfter || animating) return;
  animating = true;
  picture.style.opacity = '0';
  setTimeout(() => {
    render(variantIdx, true);
    picture.style.opacity = '1';
    isAfter   = true;
    animating = false;
    startAutoReset();
    hint.textContent = `タップで元に戻す（${AUTO_RESET_SEC}秒で自動リセット）`;
  }, 160);
}

function switchToBefore() {
  if (!isAfter || animating) return;
  clearAutoReset();
  animating = true;
  picture.style.opacity = '0';
  setTimeout(() => {
    render(variantIdx, false);
    picture.style.opacity = '1';
    isAfter   = false;
    animating = false;
    hint.textContent = '上に強く振り上げてください';
  }, 160);
}

// ============================================================
// 自動リセットタイマー
// ============================================================
function startAutoReset() {
  clearAutoReset();
  let remaining = AUTO_RESET_SEC;
  const tick = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      hint.textContent = `タップで元に戻す（${remaining}秒で自動リセット）`;
    } else {
      clearInterval(tick);
    }
  }, 1000);
  autoResetTimer = setTimeout(() => {
    clearInterval(tick);
    switchToBefore();
  }, AUTO_RESET_SEC * 1000);
}

function clearAutoReset() {
  if (autoResetTimer) {
    clearTimeout(autoResetTimer);
    autoResetTimer = null;
  }
}

// ============================================================
// タップで手動リセット
// ============================================================
picture.addEventListener('click', () => { if (isAfter) switchToBefore(); });

// PCテスト用：スペースキーで切替
document.addEventListener('keydown', e => {
  if (e.code === 'Space') isAfter ? switchToBefore() : switchToAfter();
});

// ============================================================
// 加速度センサー
// ============================================================
function onMotion(e) {
  const a = e.accelerationIncludingGravity;
  if (!a) return;

  const ax = a.x || 0;
  const ay = a.y || 0;
  const az = a.z || 0;

  // 傾き計算（画面が上を向いているか）
  const tilt = Math.atan2(Math.sqrt(ax * ax + ay * ay), Math.abs(az)) * 180 / Math.PI;

  zDisp.textContent    = az.toFixed(2);
  tiltDisp.textContent = tilt.toFixed(1);

  // ゲージ（z値がしきい値に対してどのくらいか）
  gauge.style.width = Math.min(100, Math.abs(az) / THRESHOLD * 100) + '%';

  if (isAfter) return;

  const now = Date.now();
  if (now - lastTrigger < COOLDOWN_MS) return;
  if (tilt > TILT_LIMIT) return; // 傾きすぎは無視

  if (az > THRESHOLD) {
    lastTrigger = now;
    switchToAfter();
  }
}

// ============================================================
// 開始ボタン
// ============================================================
document.getElementById('start-btn').addEventListener('click', async () => {
  // iOS13+ はセンサー使用の許可ダイアログが必要
  if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      if (result !== 'granted') {
        alert('センサーの使用を許可してください');
        return;
      }
    } catch (err) {
      alert('エラー: ' + err);
      return;
    }
  }

  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('main-screen').style.display  = 'flex';
  window.addEventListener('devicemotion', onMotion);
});
