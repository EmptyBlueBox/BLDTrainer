import { resolve } from "path";
import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";

const html_files = [
  "index.html",
  "helper.html",
  "edge.html",
  "corner.html",
  "twist.html",
  "flip.html",
  "edgefloat.html",
  "cornerfloat.html",
  "2C2C.html",
  "2E2E.html",
  "ltct.html",
  "parity.html",
  "block.html",
  "timer.html",
  "readme.html",
  "resources.html",
  "download.html",
];

export default defineConfig({
  plugins: [
    copy({
      targets: [
        { src: "assets/**/*", dest: "public" },
        { src: "images/**/*", dest: "public" },
        { src: "files/**/*", dest: "public" },
        { src: "CNAME", dest: "public" },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        html_files.map((file) => [file.replace(".html", ""), resolve(__dirname, file)]),
      ),
    },
  },
});
