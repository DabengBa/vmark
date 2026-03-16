import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { shared } from "./shared";
import { en } from "./en";
import { zhCN } from "./zh-CN";

export default withMermaid(
  defineConfig({
    ...shared,
    locales: {
      root: en,
      "zh-CN": zhCN,
    },
  })
);
