import fs from "node:fs";
import path from "node:path";

const nuxtConfigPath = path.join(process.cwd(), "nuxt.config.ts");
const tauriConfigPath = path.join(process.cwd(), "src-tauri/tauri.conf.json");

// Restore nuxt.config.ts
let nuxtConfig = fs.readFileSync(nuxtConfigPath, "utf8");
if (!nuxtConfig.includes("baseURL: \"/TeleCat/\",")) {
	nuxtConfig = nuxtConfig.replace(
		/app: \{\s*head: \{/g,
		"app: {\nbaseURL: \"/TeleCat/\",\nbuildAssetsDir: \"assets\",\nhead: {"
	);
}
fs.writeFileSync(nuxtConfigPath, nuxtConfig, "utf8");

// Restore tauri.conf.json
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));
tauriConfig.build.devUrl = "http://localhost:3000/TeleCat/";
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2), "utf8");
