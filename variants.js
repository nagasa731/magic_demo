/**
 * variants.js — 絵のバリアント定義
 *
 * ここを編集するだけで絵を差し替えられます。
 * script.js や index.html は触らなくてOKです。
 *
 * 構造：
 *   VARIANTS = [バリアントA, バリアントB, バリアントC, ...]
 *
 * 各バリアントのプロパティ：
 *   labelBefore  振る前の状態ラベル（画面上部に表示）
 *   labelAfter   振った後の状態ラベル
 *   bgBefore     振る前の背景色
 *   bgAfter      振った後の背景色
 *   svgBefore    振る前のSVG中身（<svg>タグの内側だけ書く）
 *   svgAfter     振った後のSVG中身（同上）
 *
 * SVGのviewBoxは "0 0 100 100" です（座標は0〜100で考えてください）。
 * 絵を増やすときは { ... } のオブジェクトをこの配列に追加するだけです。
 * index.htmlのバリアント切替ボタンも自動で増えます。
 */

const VARIANTS = [
  {
    // --- A: 同心円 + 十字 ---
    labelBefore: '変化前（A）',
    labelAfter:  '変化後（A\'）',
    bgBefore: '#1a1a1a',
    bgAfter:  '#0a0820',
    svgBefore: `
      <circle cx="50" cy="50" r="45" fill="none" stroke="#446" stroke-width="1" stroke-dasharray="5 3"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#558" stroke-width="1"/>
      <circle cx="50" cy="50" r="14" fill="#223" stroke="#779" stroke-width="1"/>
      <line x1="50" y1="5"  x2="50" y2="95" stroke="#335" stroke-width="0.8"/>
      <line x1="5"  y1="50" x2="95" y2="50" stroke="#335" stroke-width="0.8"/>
      <circle cx="50" cy="50" r="3" fill="#99b"/>
    `,
    svgAfter: `
      <circle cx="50" cy="50" r="45" fill="none" stroke="#80f" stroke-width="1.5" stroke-dasharray="5 3"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#b4f" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="14" fill="#301060" stroke="#e8f" stroke-width="1.5"/>
      <line x1="50" y1="5"  x2="50" y2="95" stroke="#a06ff0" stroke-width="1"/>
      <line x1="5"  y1="50" x2="95" y2="50" stroke="#a06ff0" stroke-width="1"/>
      <circle cx="50" cy="50" r="3" fill="#fff"/>
    `,
  },

  {
    // --- B: 四角 + ダイヤ ---
    labelBefore: '変化前（B）',
    labelAfter:  '変化後（B\'）',
    bgBefore: '#1a1a1a',
    bgAfter:  '#081808',
    svgBefore: `
      <rect x="8"  y="8"  width="84" height="84" fill="none" stroke="#464" stroke-width="1"/>
      <rect x="20" y="20" width="60" height="60" fill="none" stroke="#585" stroke-width="0.8" transform="rotate(45 50 50)"/>
      <rect x="36" y="36" width="28" height="28" fill="#232" stroke="#797" stroke-width="1"/>
      <circle cx="50" cy="50" r="4" fill="#9b9"/>
    `,
    svgAfter: `
      <rect x="8"  y="8"  width="84" height="84" fill="none" stroke="#0f8" stroke-width="1.5"/>
      <rect x="20" y="20" width="60" height="60" fill="none" stroke="#4fc" stroke-width="1.2" transform="rotate(45 50 50)"/>
      <rect x="36" y="36" width="28" height="28" fill="#063020" stroke="#0fa" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4" fill="#fff"/>
    `,
  },

  {
    // --- C: 五芒星 ---
    labelBefore: '変化前（C）',
    labelAfter:  '変化後（C\'）',
    bgBefore: '#1a1a1a',
    bgAfter:  '#180808',
    svgBefore: `
      <circle cx="50" cy="50" r="46" fill="none" stroke="#644" stroke-width="1" stroke-dasharray="4 3"/>
      <polygon points="50,6 61,36 93,36 68,55 78,87 50,68 22,87 32,55 7,36 39,36"
        fill="#311" stroke="#977" stroke-width="1"/>
      <circle cx="50" cy="50" r="4" fill="#b99"/>
    `,
    svgAfter: `
      <circle cx="50" cy="50" r="46" fill="none" stroke="#f40" stroke-width="1.5" stroke-dasharray="4 3"/>
      <polygon points="50,6 61,36 93,36 68,55 78,87 50,68 22,87 32,55 7,36 39,36"
        fill="#400800" stroke="#f86" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4" fill="#fff"/>
    `,
  },

  // 絵を増やすときはここに追加
  {
    // --- D: PNG画像 ---
    labelBefore: '変化前（D）',
    labelAfter:  '変化後（D\'）',
    bgBefore: '#1a1a1a',
    bgAfter:  '#0a0820',
    svgBefore: `
      <image href="images/MC1_logo.png" x="0" y="0" width="100" height="100"
        preserveAspectRatio="xMidYMid meet"/>
    `,
    svgAfter: `
      <image href="images/MC1_glow.png" x="0" y="0" width="100" height="100"
        preserveAspectRatio="xMidYMid meet"/>
    `,
  },
];
