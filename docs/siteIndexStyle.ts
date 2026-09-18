const defaultStyle = `
  footer{
    position: relative;
    z-index: 99;
  }

  /*
   * 首页有钢琴 Demo 时：隐藏主题默认 Hero（标题阴影 / 光晕占位），
   * 并抵消 Home 布局 gap:80，让 Demo 紧贴 Header 下方。
   */
  body:has(.ims-piano-home) h1,
  body:has(.ims-piano-home) h1 + * {
    display: none !important;
  }

  body:has(.ims-piano-home) .site-home-contents {
    margin-top: -80px;
  }

  .ims-piano-home {
    width: 100%;
    max-width: 1480px;
    margin: 0 auto;
    padding: 8px 32px 40px;
    box-sizing: border-box;
  }

  .ims-piano-home .ims-piano {
    --piano-width: 100%;
  }

  @media (max-width: 768px) {
    .ims-piano-home {
      padding: 4px 12px 28px;
    }
  }
`;

export default defaultStyle;
