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
const THRESHOLD      = 18;   // 振りの強さのしきい値（大きいほど強く振る必要がある）
const TILT_LIMIT     = 40;   // 傾き許容角（度）。画面が上向きのときだけ検知する
const COOLDOWN_MS    = 1200; // 連続検知を防ぐ待機時間（ミリ秒）
const AUTO_RESET_SEC = 5;    // 振り上げ後、自動で戻るまでの秒数

// ============================================================
// 状態
// ============================================================
let variantIdx     = 0;     // 現在選ばれているバリアントの番号
let isAfter        = false; // 振った後の状態かどうか
let animating      = false; // 切替アニメーション中かどうか
let autoResetTimer = null;  // 自動リセット用タイマーID
let lastTrigger    = 0;     // 最後に検知した時刻

// スワイプ追跡
let touchStartX    = 0;
let isDragging     = false;

// ============================================================
// DOM参照
// ============================================================
const mainScreen  = document.getElementById('main-screen');
const cardTrack   = document.getElementById('card-track');
const dotArea     = document.getElementById('dot-indicator');
const stateLabel  = document.getElementById('state-label');
const hint        = document.getElementById('hint');

// フラッシュ要素（なければ作る）
const flash = document.createElement('div');
flash.id = 'flash';
document.body.appendChild(flash);

// ============================================================
// カードとドットを variants.js の数に合わせて生成
// ============================================================
const cards = [];
const dots  = [];

VARIANTS.forEach((v, i) => {
  // カード
  const card = document.createElement('div');
  card.className = 'card' + (i === 0 ? ' active' : '');
  card.dataset.idx = i;
  card.innerHTML = `
    <div class="card-inner">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${v.svgBefore}</svg>
    </div>
  `;
  // カードの背景色
  card.style.background = v.bgBefore;
  // タップで選択
  card.addEventListener('click', () => {
    if (isAfter) {
      switchToBefore();
    } else if (parseInt(card.dataset.idx) !== variantIdx) {
      selectVariant(parseInt(card.dataset.idx));
    }
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
// カルーセル位置計算
// ============================================================
function updateCarousel(idx) {
  // レイアウト確定後にカード実サイズを取得
  const cardW = cards[0].offsetWidth;
  const gap   = 20;
  if (cardW === 0) {
    // まだレイアウトされていなければ次フレームで再試行
    requestAnimationFrame(() => updateCarousel(idx));
    return;
  }
  // 選択カードが画面中央に来るようにtrackをずらす
  const center = window.innerWidth / 2;
  const offset = center - cardW / 2 - idx * (cardW + gap);
  cardTrack.style.transform = `translateX(${offset}px)`;

  // active切替
  cards.forEach((c, i) => c.classList.toggle('active', i === idx));
  dots.forEach((d, i)  => d.classList.toggle('active', i === idx));
}

// 初期位置：DOMが完全に描画されてから実行
requestAnimationFrame(() => requestAnimationFrame(() => updateCarousel(0)));
window.addEventListener('resize', () => updateCarousel(variantIdx));

// ============================================================
// バリアント選択
// ============================================================
function selectVariant(idx) {
  variantIdx = idx;
  updateCarousel(idx);
}

// ============================================================
// スワイプ操作
// ============================================================
cardTrack.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  isDragging  = true;
}, { passive: true });

cardTrack.addEventListener('touchend', e => {
  if (!isDragging) return;
  isDragging = false;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 30) return; // 短いスワイプは無視
  const next = dx < 0
    ? Math.min(variantIdx + 1, VARIANTS.length - 1)
    : Math.max(variantIdx - 1, 0);
  if (!isAfter) selectVariant(next);
}, { passive: true });

// ============================================================
// 描画（指定カードのSVGと背景を切り替える）
// ============================================================
function render(idx, after) {
  const v    = VARIANTS[idx];
  const card = cards[idx];
  card.querySelector('svg').innerHTML = after ? v.svgAfter  : v.svgBefore;
  card.style.background               = after ? v.bgAfter   : v.bgBefore;
  stateLabel.textContent              = after ? v.labelAfter : v.labelBefore;
}

// ============================================================
// 振り上げ後に切替
// ============================================================
function switchToAfter() {
  if (isAfter || animating) return;
  animating = true;

  // フラッシュ
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 120);

  // パーティクル
  spawnParticles();

  const card = cards[variantIdx];

  // popアニメーション
  card.classList.add('pop');
  card.addEventListener('animationend', () => card.classList.remove('pop'), { once: true });

  setTimeout(() => {
    render(variantIdx, true);
    card.classList.add('is-after');
    isAfter   = true;
    animating = false;
    startAutoReset();
    hint.textContent = `✨ タップしたら もどるよ`;
  }, 120);
}

function switchToBefore() {
  if (!isAfter || animating) return;
  clearAutoReset();
  animating = true;
  const card = cards[variantIdx];
  card.style.opacity = '0';
  card.style.transition = 'opacity 0.15s';
  setTimeout(() => {
    render(variantIdx, false);
    card.classList.remove('is-after');
    card.style.opacity = '1';
    isAfter   = false;
    animating = false;
    hint.textContent = '⬆️ うえに ふりあげよう！';
    stateLabel.textContent = 'ふだをえらんでね';
  }, 160);
}

// ============================================================
// 自動リセットタイマー
// ============================================================
function startAutoReset() {
  clearAutoReset();
  autoResetTimer = setTimeout(() => {
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
// パーティクルエフェクト
// ============================================================
const PARTICLES = ['✨', '⭐', '💫', '🌟', '✦', '🎇'];

function spawnParticles() {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
    const angle = (Math.PI * 2 / 12) * i + (Math.random() - 0.5) * 0.5;
    const dist  = 80 + Math.random() * 100;
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
// タップで手動リセット
// ============================================================
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (isAfter && parseInt(card.dataset.idx) === variantIdx) switchToBefore();
  });
});

// PCテスト用：スペースキーで切替
document.addEventListener('keydown', e => {
  if (e.code === 'Space') isAfter ? switchToBefore() : switchToAfter();
  if (e.code === 'ArrowRight') selectVariant(Math.min(variantIdx + 1, VARIANTS.length - 1));
  if (e.code === 'ArrowLeft')  selectVariant(Math.max(variantIdx - 1, 0));
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
  mainScreen.style.display = 'flex';
  window.addEventListener('devicemotion', onMotion);

  // display:flex になった直後はまだレイアウトが確定していないので
  // 2フレーム待ってから位置を計算する
  requestAnimationFrame(() => requestAnimationFrame(() => updateCarousel(0)));
});
