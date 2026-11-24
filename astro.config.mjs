// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from "url"

import react from '@astrojs/react';

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: "https://usernaneless.github.io",
  base: "/Visualizer",

  vite: {
      build: {
          emptyOutDir: false,
      },
      ssr: {
          noExternal: ["react-icons"],
      },
      resolve: {
          alias: [
              {
                  find: "variables",
                  replacement: fileURLToPath(new URL("./variables.sass", import.meta.url)),
              },
              {
                  find: "components",
                  replacement: fileURLToPath(new URL("./src/components", import.meta.url)),
              }, {
                  find: "actions",
                  replacement: fileURLToPath(new URL("src/actions", import.meta.url)),
              }, {
                  find: "@",
                  replacement: fileURLToPath(new URL("src/", import.meta.url)),
              }
          ]
      },
  },

  adapter: node({
    mode: "standalone",
  }),
});