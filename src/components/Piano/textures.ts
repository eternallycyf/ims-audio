/** 高端钢琴程序化贴图：黑亮漆 / 象牙 / 绒毡 / 金属 */

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** 镜面黑漆琴身 */
export function createLacquerTexture(width = 768, height = 384): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const base = ctx.createLinearGradient(0, 0, width * 0.3, height);
  base.addColorStop(0, '#1a1a1c');
  base.addColorStop(0.35, '#0c0c0e');
  base.addColorStop(0.55, '#161618');
  base.addColorStop(1, '#050506');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // 展厅高光扫过
  const gloss = ctx.createLinearGradient(0, 0, width, height * 0.6);
  gloss.addColorStop(0, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.42, 'rgba(255,255,255,0)');
  gloss.addColorStop(0.48, 'rgba(255,255,255,0.14)');
  gloss.addColorStop(0.52, 'rgba(255,255,255,0.04)');
  gloss.addColorStop(0.58, 'rgba(255,255,255,0)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, width, height);

  // 顶部柔光
  const top = ctx.createLinearGradient(0, 0, 0, height * 0.35);
  top.addColorStop(0, 'rgba(255,255,255,0.08)');
  top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height * 0.35);

  // 细微漆面噪点
  const img = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (hash(i * 0.13) - 0.5) * 8;
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  return canvas.toDataURL('image/png');
}

/** 象牙白键 */
export function createIvoryTexture(width = 160, height = 640): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, '#ebe6dc');
  g.addColorStop(0.15, '#faf7f0');
  g.addColorStop(0.5, '#fffcf6');
  g.addColorStop(0.85, '#f5f0e6');
  g.addColorStop(1, '#e5dfd3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // 纵向象牙纹理
  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = `rgba(160, 145, 120, ${0.015 + hash(i) * 0.03})`;
    ctx.fillRect(hash(i * 2) * width, 0, 0.8 + hash(i * 3), height);
  }

  const shine = ctx.createLinearGradient(0, 0, 0, height);
  shine.addColorStop(0, 'rgba(255,255,255,0.45)');
  shine.addColorStop(0.12, 'rgba(255,255,255,0.08)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0)');
  shine.addColorStop(0.92, 'rgba(0,0,0,0)');
  shine.addColorStop(1, 'rgba(40,30,20,0.06)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/** 乌木黑键 */
export function createEbonyTexture(width = 96, height = 320): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, width, 0);
  g.addColorStop(0, '#0a0a0b');
  g.addColorStop(0.4, '#1c1c1f');
  g.addColorStop(0.55, '#2a2a2e');
  g.addColorStop(1, '#0d0d0f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const top = ctx.createLinearGradient(0, 0, 0, height * 0.25);
  top.addColorStop(0, 'rgba(255,255,255,0.18)');
  top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height * 0.25);

  return canvas.toDataURL('image/png');
}

/** 深色击弦机绒毡 */
export function createFeltTexture(width = 512, height = 64): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#2a1218');
  g.addColorStop(0.5, '#1a0a0e');
  g.addColorStop(1, '#0e0608');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = `rgba(${80 + hash(i) * 40}, ${20 + hash(i * 2) * 25}, ${30 + hash(i * 3) * 20}, 0.28)`;
    ctx.fillRect(hash(i * 4) * width, hash(i * 5) * height, 1.5, 1.5);
  }
  return canvas.toDataURL('image/png');
}

/** @deprecated 兼容旧名 */
export const createWoodTexture = createLacquerTexture;
