# BLDTrainer

这是一个面向三阶盲拧的静态训练站点。入口页面是 `index.html`，常用功能都在首页，包括读码助手、棱角训练、翻色训练、LTCT、浮动缓冲、2C2C、2E2E、资源页和离线资料下载页。

```bash
npm install
npm run dev
```

需要打包时直接执行：

```bash
npm run build
```

构建结果会输出到 `dist/`。Vite 运行时会生成 `public/` 作为临时静态目录，这个目录不需要提交。
