/**
 * script.js — センサー検知・画面切替ロジック
 *
 * 絵の中身は variants.js を編集してください。
 * レイアウト・色は style.css を編集してください。
 * このファイルは基本的に触らなくてOKです。
 */

// ============================================================
// 設定
// ============================================================
const THRESHOLD      = 13;   // 振りの強さのしきい値
const TILT_LIMIT     = 55;   // 傾き許容角（度）
const COOLDOWN_MS    = 1200; // 連続検知防止（ミリ秒）
const AUTO_RESET_SEC = 5;    // 振り上げ後、全画面を閉じるまでの秒数

// ============================================================
// 状態
// ============================================================
let variantIdx     = 0;
let isAfter        = false;
let animating      = false;
let autoResetTimer = null;
let lastTrigger    = 0;
let isFullscreen   = false; // 全画面表示中かどうか

// ============================================================
// DOM参照
// ============================================================
const mainScreen       = document.getElementById('main-screen');
const cardTrack        = document.getElementById('card-track');
const dotArea          = document.getElementById('dot-indicator');
const stateLabel       = document.getElementById('state-label');
const hint             = document.getElementById('hint');
const flash            = document.getElementById('flash');
const overlay          = document.getElementById('fullscreen-overlay');
const fullscreenCard   = document.getElementById('fullscreen-card');
const fullscreenSvg    = document.getElementById('fullscreen-svg');
const fullscreenLabel  = document.getElementById('fullscreen-label');
const fullscreenHint   = document.getElementById('fullscreen-hint');
const fullscreenClose  = document.getElementById('fullscreen-close');

// ============================================================
// カードとドットを生成
// ============================================================
const cards = [];
const dots  = [];

VARIANTS.forEach((v, i) => {
  // カード
  const card = document.createElement('div');
  card.className = 'card' + (i === 0 ? ' active' : '');
  card.dataset.idx = i;
  card.style.background = v.bgBefore;
  card.innerHTML = `
    <div class="card-inner">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${v.svgBefore}</svg>
    </div>
  `;
  // タップ → 全画面へ
  card.addEventListener('click', () => {
    selectVariant(i);
    openFullscreen(i);
  });
  cardTrack.appendChild(card);
  cards.push(card);

  // ドット
  const dot = document.createElement('div');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dotArea.appendChild(dot);
  dots.push(dot);
});

// ============================================================
// scroll-snap ベースのカルーセル
// スクロール位置を監視して、中央に来ているカードをactiveにする
// ============================================================
function getActiveIndexFromScroll() {
  // 各カードの中心がtrackの中心に最も近いものを選ぶ
  const trackCenter = cardTrack.scrollLeft + cardTrack.clientWidth / 2;
  let closest = 0;
  let minDist  = Infinity;
  cards.forEach((card, i) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - trackCenter);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  return closest;
}

cardTrack.addEventListener('scroll', () => {
  const idx = getActiveIndexFromScroll();
  if (idx !== variantIdx) {
    variantIdx = idx;
    cards.forEach((c, i) => c.classList.toggle('active', i === idx));
    dots.forEach((d, i)  => d.classList.toggle('active', i === idx));
  }
}, { passive: true });

function selectVariant(idx) {
  variantIdx = idx;
  // 選択カードが中央に来るようにスクロール
  const card   = cards[idx];
  const target = card.offsetLeft - (cardTrack.clientWidth - card.offsetWidth) / 2;
  cardTrack.scrollTo({ left: target, behavior: 'smooth' });
  cards.forEach((c, i) => c.classList.toggle('active', i === idx));
  dots.forEach((d, i)  => d.classList.toggle('active', i === idx));
}

// ============================================================
// 全画面オーバーレイ（カードの位置から円形に広がる）
// ============================================================
function openFullscreen(idx) {
  const v    = VARIANTS[idx];
  const card = cards[idx];

  const rect = card.getBoundingClientRect();
  const cx   = ((rect.left + rect.width  / 2) / window.innerWidth  * 100).toFixed(1) + '%';
  const cy   = ((rect.top  + rect.height / 2) / window.innerHeight * 100).toFixed(1) + '%';
  overlay.style.setProperty('--cx', cx);
  overlay.style.setProperty('--cy', cy);

  // オーバーレイ背景をカードの色に合わせる
  overlay.style.background = v.bgBefore;

  fullscreenSvg.innerHTML         = v.svgBefore;
  fullscreenCard.style.background = 'transparent';
  fullscreenLabel.textContent     = v.labelBefore;
  fullscreenHint.textContent      = '⬆️ うえに ふりあげよう！';
  fullscreenCard.classList.remove('is-after');

  overlay.classList.remove('open', 'closing');
  overlay.classList.add('opening');
  overlay.addEventListener('animationend', () => {
    overlay.classList.remove('opening');
    overlay.classList.add('open');
  }, { once: true });

  isFullscreen = true;
  isAfter      = false;
}

function closeFullscreen() {
  clearAutoReset();
  if (!isFullscreen) return;

  // 閉じるアニメーション
  overlay.classList.remove('open', 'opening');
  overlay.classList.add('closing');
  overlay.addEventListener('animationend', () => {
    overlay.classList.remove('closing');
  }, { once: true });

  isFullscreen = false;
  isAfter      = false;

  // カード側も変化前に戻す
  const v    = VARIANTS[variantIdx];
  const card = cards[variantIdx];
  card.querySelector('svg').innerHTML = v.svgBefore;
  card.style.background               = v.bgBefore;
  card.classList.remove('is-after');
}

fullscreenClose.addEventListener('click', closeFullscreen);

// ============================================================
// 振り上げ後の切替
// ============================================================
function switchToAfter() {
  if (isAfter || animating || !isFullscreen) return;
  animating = true;

  // フラッシュ
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 120);

  // パーティクル
  spawnParticles();

  setTimeout(() => {
    const v = VARIANTS[variantIdx];

    // オーバーレイ背景を変化後の色に
    overlay.style.background = v.bgAfter;

    // 全画面カードを変化後に
    fullscreenSvg.innerHTML         = v.svgAfter;
    fullscreenCard.style.background = 'transparent';
    fullscreenLabel.textContent     = v.labelAfter;
    fullscreenCard.classList.add('is-after');
    fullscreenHint.textContent      = '✨ もうすぐ もとにもどるよ';

    // カルーセル側のカードも変化後に（全画面の後ろで）
    const card = cards[variantIdx];
    card.querySelector('svg').innerHTML = v.svgAfter;
    card.style.background               = v.bgAfter;
    card.classList.add('is-after');

    isAfter   = true;
    animating = false;
    startAutoReset();
  }, 120);
}

// ============================================================
// 自動リセット（振り上げから AUTO_RESET_SEC 秒後に全画面を閉じる）
// ============================================================
function startAutoReset() {
  clearAutoReset();
  let remaining = AUTO_RESET_SEC;
  const tick = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      fullscreenHint.textContent = `✨ あと ${remaining}びょうで もどるよ`;
    } else {
      clearInterval(tick);
    }
  }, 1000);
  autoResetTimer = setTimeout(() => {
    clearInterval(tick);
    closeFullscreen();
  }, AUTO_RESET_SEC * 1000);
}

function clearAutoReset() {
  if (autoResetTimer) {
    clearTimeout(autoResetTimer);
    autoResetTimer = null;
  }
}

// ============================================================
// パーティクル
// ============================================================
const PARTICLES = ['✨', '⭐', '💫', '🌟', '✦', '🎇'];

function spawnParticles() {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 14; i++) {
    const el    = document.createElement('div');
    el.className = 'particle';
    el.textContent = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
    const angle = (Math.PI * 2 / 14) * i + (Math.random() - 0.5) * 0.4;
    const dist  = 80 + Math.random() * 120;
    el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    el.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    el.style.setProperty('--dr', `${(Math.random() - 0.5) * 360}deg`);
    el.style.left = cx + 'px';
    el.style.top  = cy + 'px';
    el.style.animationDelay = (Math.random() * 0.15) + 's';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ============================================================
// PCテスト用
// ============================================================
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (!isFullscreen) {
      openFullscreen(variantIdx);
    } else if (!isAfter) {
      switchToAfter();
    } else {
      closeFullscreen();
    }
  }
  if (e.code === 'ArrowRight' && !isFullscreen)
    selectVariant(Math.min(variantIdx + 1, VARIANTS.length - 1));
  if (e.code === 'ArrowLeft' && !isFullscreen)
    selectVariant(Math.max(variantIdx - 1, 0));
});

// ============================================================
// 加速度センサー
// ============================================================
function onMotion(e) {
  const a = e.accelerationIncludingGravity;
  if (!a || !isFullscreen || isAfter) return;

  const ax = a.x || 0;
  const ay = a.y || 0;
  const az = a.z || 0;

  const tilt = Math.atan2(Math.sqrt(ax * ax + ay * ay), Math.abs(az)) * 180 / Math.PI;

  const now = Date.now();
  if (now - lastTrigger < COOLDOWN_MS) return;
  if (tilt > TILT_LIMIT) return;

  if (az > THRESHOLD) {
    lastTrigger = now;
    switchToAfter();
  }
}

// ============================================================
// 開始ボタン
// ============================================================
document.getElementById('start-btn').addEventListener('click', async () => {
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
  mainScreen.style.display = 'flex';
  window.addEventListener('devicemotion', onMotion);
});
