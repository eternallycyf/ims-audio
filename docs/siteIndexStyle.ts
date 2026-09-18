const defaultStyle = `
  /*
   * 首页有钢琴 / 专辑 Demo 时：隐藏主题默认 Hero，
   * 并抵消 Home 布局 gap，让 Demo 紧贴 Header 下方、铺满左右。
   */
  body:has(.ims-piano-home) h1,
  body:has(.ims-piano-home) h1 + * {
    display: none !important;
  }

  /* Home 根 Flexbox：去掉 80px gap，横向拉满 */
  body:has(.ims-piano-home) div:has(> .site-home-contents) {
    gap: 16px !important;
    width: 100% !important;
    max-width: 100% !important;
    align-items: stretch !important;
    box-sizing: border-box;
  }

  /* Hero 在 contents 正上方时直接收掉（Features 为空时生效） */
  body:has(.ims-piano-home) div:has(> .site-home-contents) > *:has(+ .site-home-contents) {
    display: none !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }

  body:has(.ims-piano-home) .site-home-contents {
    margin-top: 0 !important;
    gap: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 8px 32px 12px !important;
    box-sizing: border-box;
  }

  body:has(.ims-piano-home) .dumi-default-content,
  body:has(.ims-piano-home) [class*='Home'] {
    padding-top: 0 !important;
  }

  /* 去掉 Demo 预览器边框/白底，让专辑区贴背景 */
  body:has(.ims-piano-home) .dumi-default-previewer,
  body:has(.ims-piano-home) [class*='Previewer'] {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  body:has(.ims-piano-home) .dumi-default-previewer-meta,
  body:has(.ims-piano-home) .dumi-default-previewer-actions {
    display: none !important;
  }

  body:has(.ims-piano-home) .dumi-default-previewer-demo {
    padding: 0 !important;
    background: transparent !important;
  }

  .ims-piano-home {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 4px 0 8px;
    box-sizing: border-box;
  }

  .ims-piano-home--play {
    height: calc(100vh - 100px);
    min-height: calc(100vh - 100px);
    max-height: calc(100vh - 100px);
    padding-bottom: 0;
    overflow: hidden;
  }

  .ims-piano-home .ims-piano {
    --piano-width: min(1280px, 100%);
    height: 100%;
    min-height: 100%;
    max-height: 100%;
  }

  .ims-piano-home__masonry {
    width: 100%;
  }

  .ims-album {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    text-align: left;
    background: #0f1115;
    color: #f5f5f5;
    transition: transform 0.28s ease, box-shadow 0.28s ease;
  }

  .ims-album:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.16);
  }

  .ims-album:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 3px;
  }

  .ims-album__cover {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    background: #1a1a1a;
  }

  .ims-album__cover--fallback {
    background: linear-gradient(145deg, #222 0%, #666 100%);
  }

  .ims-album__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 0 0 auto;
    padding: 10px 14px 12px;
    background: #12151c;
  }

  .ims-album__title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .ims-album__artist {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.58);
  }

  @media (min-width: 1440px) {
    body:has(.ims-piano-home) .site-home-contents {
      padding-inline: 40px !important;
    }
  }

  @media (min-width: 1800px) {
    body:has(.ims-piano-home) .site-home-contents {
      padding-inline: 48px !important;
    }
  }

  @media (max-width: 768px) {
    body:has(.ims-piano-home) .site-home-contents {
      padding: 4px 12px 12px !important;
    }

    .ims-piano-home {
      padding: 0 0 12px;
    }

    .ims-piano-home__brand {
      font-size: 1.65rem;
    }

    .ims-album {
      border-radius: 14px;
    }
  }
`;

export default defaultStyle;
