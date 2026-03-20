/// <reference types="vitest" />
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  base: "/genre-guessr/",
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
