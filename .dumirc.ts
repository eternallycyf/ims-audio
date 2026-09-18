import { defineConfig } from 'dumi';
import type { SiteThemeConfig } from 'dumi-theme-antd-style';
import { footer } from 'ims-template-config';
import path from 'path';
import style from './docs/siteIndexStyle';
import { homepage, name as repo } from './package.json';

const basePath = `/${repo}/`;
const isProd = process.env.NODE_ENV === 'production';

const themeConfig: SiteThemeConfig = {
  name: repo,
  github: homepage,
  logo: isProd ? '/images/origin.png' : `/${repo}/images/origin.png`,
  // 首页不展示 Hero 文案/按钮，仅渲染 markdown 中的钢琴 Demo
  hero: {
    'zh-CN': { showCustomContent: true },
    'en-US': { showCustomContent: true },
  },
  socialLinks: { github: homepage },
  apiHeader: {
    sourceUrl: `https://github.com/eternallycyf/ims-audio/tree/master/src/components/{atomId}/index.tsx`,
    docUrl: `https://github.com/eternallycyf/ims-audio/tree/master/src/components/{atomId}/index.md`,
    pkg: 'ims-audio',
    match: ['/ims-audio/src/component'],
  },
  footerConfig: {
    bottom: '2023',
    copyright: 'Made with ❤️ by eternallycyf - AFX & 数字科技',
    columns: footer(repo),
  },
};

export default defineConfig({
  define: {
    'process.env': process.env,
  },
  base: isProd ? '/' : `/${repo}`,
  publicPath: isProd ? '/' : basePath,
  alias: {
    [repo]: path.join(__dirname, './src'),
    [repo + '/src']: path.join(__dirname, './src/*'),
  },
  favicons: [isProd ? '/images/favicon.ico' : `/${repo}/images/favicon.ico`],
  styles: [
    `html, body { background: transparent;  }
  @media (prefers-color-scheme: dark) {
    html, body { background: #0E1116; }
  }`,
    style,
  ],
  outputPath: 'docs-dist',
  devtool: isProd ? false : 'source-map',
  clickToComponent: {},
  ignoreMomentLocale: true,
  targets: { chrome: 79 },
  codeSplitting: { jsStrategy: 'granularChunks' },
  themeConfig,
  ssr: false,
  extraBabelPlugins: ['antd-style'],
  hash: true,
  mock: {},
  exportStatic: false,
  html2sketch: {},
  mfsu: {
    runtimePublicPath: true,
  },
  resolve: {
    docDirs: ['docs'],
    atomDirs: [{ type: 'component', dir: './src/components' }],
    entryFile: './src/index.ts',
    codeBlockMode: 'passive',
  },
});
