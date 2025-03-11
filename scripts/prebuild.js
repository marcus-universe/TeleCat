import fs from "node:fs";
import path from "node:path";

const nuxtConfigPath = path.join(process.cwd(), "nuxt.config.ts");
const tauriConfigPath = path.join(process.cwd(), "src-tauri/tauri.conf.json");

// Update nuxt.config.ts
let nuxtConfig = fs.readFileSync(nuxtConfigPath, "utf8");
nuxtConfig = nuxtConfig.replace(
	/baseURL: "\/TeleCat\/",\s*buildAssetsDir: "assets",/g,
	""
);
fs.writeFileSync(nuxtConfigPath, nuxtConfig, "utf8");

// Update tauri.conf.json
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));
tauriConfig.build.devUrl = "http://localhost:3000/";
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2), "utf8");
