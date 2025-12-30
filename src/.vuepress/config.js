const { description } = require("../../package");

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: "Tool Db",
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Base URL for GitHub Pages deployment
   * Ref：https://v1.vuepress.vuejs.org/config/#base
   */
  base: "/tool-db-docs/",

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: "https://github.com/Manwe-777/tool-db",
    editLinks: false,
    docsDir: "",
    editLinkText: "",
    lastUpdated: false,
    nav: [
      {
        text: "Docs",
        link: "/docs/",
      },
      // {
      //   text: 'VuePress',
      //   link: 'https://v1.vuepress.vuejs.org'
      // }
    ],
    sidebar: {
      "/docs/": [
        {
          title: "Docs",
          collapsable: false,
          children: ["", "constructor", "api-user", "api-base", "api-listeners", "types"],
        },
        {
          title: "Guides",
          collapsable: false,
          children: ["basic-setup", "nodejs-dht-discovery", "namespaces", "crdts", "adapters"],
        },
      ],
    },
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: ["@vuepress/plugin-back-to-top", "@vuepress/plugin-medium-zoom"],
};
