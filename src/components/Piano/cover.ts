/** 解析专辑封面：支持 covers/*.svg（public）、渐变、绝对 URL */
export function resolveCoverUrl(cover?: string): string | undefined {
  if (!cover) return undefined;
  if (
    cover.startsWith('http') ||
    cover.startsWith('data:') ||
    cover.startsWith('linear-gradient') ||
    cover.startsWith('radial-gradient') ||
    cover.startsWith('#') ||
    cover.startsWith('/')
  ) {
    return cover;
  }
  // dumi：dev 为 /ims-audio/，prod 为 /
  const isProd = process.env.NODE_ENV === 'production';
  const base = isProd ? '/' : '/ims-audio/';
  return `${base}${cover}`.replace(/([^:]\/)\/+/g, '$1');
}

export function isCssBackground(cover?: string): boolean {
  if (!cover) return false;
  return (
    cover.startsWith('linear-gradient') ||
    cover.startsWith('radial-gradient') ||
    cover.startsWith('#')
  );
}

export function formatTime(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
