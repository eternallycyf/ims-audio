/** 程序化贴图：Apple 展厅风 — 浅枫木桌 / 黑漆琴身 / 冷白键 / 乌木 / 绒毡 */

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function noise2(x: number, y: number) {
  return hash(x * 12.9898 + y * 78.233);
}

/** 钢琴黑漆琴身：镜面克制高光，展厅产品感 */
export function createLacquerTexture(width = 768, height = 384): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#2a2a2e');
  base.addColorStop(0.28, '#1a1a1d');
  base.addColorStop(0.55, '#111113');
  base.addColorStop(0.82, '#0a0a0c');
  base.addColorStop(1, '#050506');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // 极细纵向微纹（漆面深度，非木纹）
  for (let x = 0; x < width; x++) {
    const n = hash(x * 0.37);
    if (n > 0.92) {
      ctx.fillStyle = `rgba(255,255,255,${0.012 + n * 0.018})`;
      ctx.fillRect(x, 0, 1, height);
    } else if (n < 0.06) {
      ctx.fillStyle = `rgba(0,0,0,${0.08 + n * 0.12})`;
      ctx.fillRect(x, 0, 1, height);
    }
  }

  // 斜向镜面高光带（Apple 产品摄影那种窄亮边）
  const gloss = ctx.createLinearGradient(0, 0, width, height * 0.35);
  gloss.addColorStop(0, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.38, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.46, 'rgba(255,255,255,0.14)');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  gloss.addColorStop(0.58, 'rgba(255,255,255,0)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, width, height);

  const top = ctx.createLinearGradient(0, 0, 0, height * 0.4);
  top.addColorStop(0, 'rgba(255,255,255,0.16)');
  top.addColorStop(0.45, 'rgba(255,255,255,0.03)');
  top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height * 0.4);

  const ao = ctx.createLinearGradient(0, height * 0.55, 0, height);
  ao.addColorStop(0, 'rgba(0,0,0,0)');
  ao.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = ao;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);

  const img = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (hash(i * 0.11) - 0.5) * 6;
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 1.05));
  }
  ctx.putImageData(img, 0, 0);

  return canvas.toDataURL('image/png');
}

/** 冷白键：干净塑料/象牙白，偏 Apple 产品白 */
export function createIvoryTexture(width = 160, height = 640): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, '#e8e8ea');
  g.addColorStop(0.14, '#f4f4f5');
  g.addColorStop(0.5, '#fbfbfc');
  g.addColorStop(0.86, '#f2f2f4');
  g.addColorStop(1, '#e2e2e6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(120, 122, 130, ${0.008 + hash(i) * 0.016})`;
    ctx.fillRect(hash(i * 2) * width, 0, 0.6 + hash(i * 3) * 0.9, height);
  }

  const shine = ctx.createLinearGradient(0, 0, 0, height);
  shine.addColorStop(0, 'rgba(255,255,255,0.55)');
  shine.addColorStop(0.08, 'rgba(255,255,255,0.12)');
  shine.addColorStop(0.4, 'rgba(255,255,255,0)');
  shine.addColorStop(0.88, 'rgba(40,42,48,0.03)');
  shine.addColorStop(1, 'rgba(30,32,38,0.08)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, width, height);

  const side = ctx.createLinearGradient(0, 0, width, 0);
  side.addColorStop(0, 'rgba(80,82,90,0.06)');
  side.addColorStop(0.1, 'rgba(80,82,90,0)');
  side.addColorStop(0.9, 'rgba(80,82,90,0)');
  side.addColorStop(1, 'rgba(50,52,58,0.1)');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/** 乌木黑键：冷灰高光 */
export function createEbonyTexture(width = 96, height = 320): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, '#0a0a0c');
  g.addColorStop(0.35, '#16161a');
  g.addColorStop(0.5, '#222228');
  g.addColorStop(0.65, '#141418');
  g.addColorStop(1, '#08080a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const top = ctx.createLinearGradient(0, 0, 0, height * 0.28);
  top.addColorStop(0, 'rgba(255,255,255,0.22)');
  top.addColorStop(0.4, 'rgba(255,255,255,0.06)');
  top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height * 0.28);

  const gloss = ctx.createLinearGradient(0, 0, width, height * 0.45);
  gloss.addColorStop(0, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.46, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  gloss.addColorStop(0.56, 'rgba(255,255,255,0)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, width, height);

  const ao = ctx.createLinearGradient(0, height * 0.65, 0, height);
  ao.addColorStop(0, 'rgba(0,0,0,0)');
  ao.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = ao;
  ctx.fillRect(0, height * 0.65, width, height * 0.35);

  return canvas.toDataURL('image/png');
}

/** 深灰绒毡（克制，非酒红） */
export function createFeltTexture(width = 512, height = 64): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#3a3a42');
  g.addColorStop(0.35, '#222228');
  g.addColorStop(0.7, '#141418');
  g.addColorStop(1, '#0a0a0c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 1400; i++) {
    const v = 70 + hash(i) * 60;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v + 8}, 0.22)`;
    ctx.fillRect(hash(i * 4) * width, hash(i * 5) * height, 1.2, 1.2);
  }

  const tip = ctx.createLinearGradient(0, 0, 0, height * 0.35);
  tip.addColorStop(0, 'rgba(180,180,190,0.16)');
  tip.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tip;
  ctx.fillRect(0, 0, width, height * 0.35);

  return canvas.toDataURL('image/png');
}

/** 泛黄日记本内页（横线稿纸 + 红栏 + 旧纸斑） */
export function createDiaryPaperTexture(width = 640, height = 520): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 更深的泛黄旧纸
  const base = ctx.createLinearGradient(0, 0, width * 0.15, height);
  base.addColorStop(0, '#f0dfb0');
  base.addColorStop(0.35, '#e8d19a');
  base.addColorStop(0.7, '#dcb97a');
  base.addColorStop(1, '#d0a868');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // 纸纤维
  for (let y = 0; y < height; y += 2) {
    const n = hash(y * 0.7);
    if (n > 0.5) {
      ctx.fillStyle = `rgba(140, 100, 50, ${0.02 + n * 0.03})`;
      ctx.fillRect(0, y, width, 1);
    }
  }

  const img = ctx.getImageData(0, 0, width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = (noise2(x * 0.7, y * 0.7) - 0.5) * 20;
      const warm = noise2(x * 0.12, y * 0.12) * 8;
      img.data[i] = Math.min(255, Math.max(0, img.data[i] + n + warm));
      img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 0.85 + warm * 0.5));
      img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 0.4 - 4));
    }
  }
  ctx.putImageData(img, 0, 0);

  // 日记本横线
  const lineStart = 48;
  const lineGap = 28;
  ctx.strokeStyle = 'rgba(90, 120, 140, 0.22)';
  ctx.lineWidth = 1;
  for (let y = lineStart; y < height - 24; y += lineGap) {
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(width - 28, y + (hash(y) - 0.5) * 1.2);
    ctx.stroke();
  }

  // 左侧红栏线
  ctx.strokeStyle = 'rgba(170, 60, 50, 0.38)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(72, 28);
  ctx.lineTo(72, height - 24);
  ctx.stroke();

  // 装订侧压痕
  const bind = ctx.createLinearGradient(0, 0, 56, 0);
  bind.addColorStop(0, 'rgba(90, 55, 25, 0.14)');
  bind.addColorStop(0.6, 'rgba(90, 55, 25, 0.04)');
  bind.addColorStop(1, 'rgba(90, 55, 25, 0)');
  ctx.fillStyle = bind;
  ctx.fillRect(0, 0, 56, height);

  // 旧渍 / 泛黄斑
  for (let i = 0; i < 36; i++) {
    const x = hash(i * 11) * width;
    const y = hash(i * 17) * height;
    const r = 6 + hash(i * 23) * 28;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(150, 100, 45, ${0.05 + hash(i) * 0.08})`);
    g.addColorStop(1, 'rgba(150, 100, 45, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      r * (0.6 + hash(i * 3) * 0.9),
      r * (0.4 + hash(i * 5) * 0.8),
      hash(i) * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // 页角微暗
  const edge = ctx.createRadialGradient(
    width * 0.55,
    height * 0.4,
    Math.min(width, height) * 0.2,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.7,
  );
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(0.7, 'rgba(90, 55, 20, 0.04)');
  edge.addColorStop(1, 'rgba(70, 40, 15, 0.14)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.88);
}

/** @deprecated 旧名 */
export const createNovelPaperTexture = createDiaryPaperTexture;

/**
 * 浅枫木桌面：细直纹 + 柔光，Apple 产品摄影气质
 */
export function createDeskTexture(width = 1280, height = 960): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 浅枫 / 白橡底色
  const base = ctx.createLinearGradient(0, 0, width * 0.15, height);
  base.addColorStop(0, '#e8dfd2');
  base.addColorStop(0.35, '#ddd2c2');
  base.addColorStop(0.7, '#d4c7b4');
  base.addColorStop(1, '#cbbda8');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // 细直木纹（纵向，克制）
  for (let x = 0; x < width; x++) {
    const n = hash(x * 0.29);
    const wave = 0.5 + 0.5 * Math.sin(x * 0.018 + n * 4);
    const a = 0.018 + n * 0.045 * wave;
    const dark = n > 0.55;
    ctx.fillStyle = dark ? `rgba(120, 95, 70, ${a})` : `rgba(255, 248, 235, ${a * 0.7})`;
    ctx.fillRect(x, 0, 1, height);

    // 偶尔一条稍宽的年轮线
    if (n > 0.94) {
      ctx.fillStyle = `rgba(140, 110, 80, ${0.04 + n * 0.05})`;
      ctx.fillRect(x, 0, 1.5 + hash(x) * 1.5, height);
    }
  }

  // 极淡的横向柔光带（展厅灯）
  for (let i = 0; i < 5; i++) {
    const y = height * (0.15 + i * 0.18);
    const band = ctx.createLinearGradient(0, y - 40, 0, y + 40);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, `rgba(255,252,245,${0.04 + hash(i) * 0.04})`);
    band.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 40, width, 80);
  }

  // 细噪点
  const img = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (hash(i * 0.07) - 0.5) * 8;
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 0.95));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 0.85));
  }
  ctx.putImageData(img, 0, 0);

  // 顶部更亮、四周极柔 vignette（产品摄影）
  const light = ctx.createRadialGradient(
    width * 0.5,
    height * 0.28,
    height * 0.08,
    width * 0.5,
    height * 0.45,
    width * 0.72,
  );
  light.addColorStop(0, 'rgba(255,255,255,0.18)');
  light.addColorStop(0.35, 'rgba(255,255,255,0.04)');
  light.addColorStop(0.7, 'rgba(0,0,0,0)');
  light.addColorStop(1, 'rgba(40, 32, 24, 0.22)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.88);
}

/** @deprecated 兼容旧名 */
export const createWoodTexture = createLacquerTexture;
