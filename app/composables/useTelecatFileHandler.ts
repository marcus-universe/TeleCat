import JSZip from "jszip";
import { useStore } from "../stores/store.js";
import { useFileConverter } from "./useFileConverter.js";
// Tauri imports (used only when running inside a Tauri window)
let tauriSave: any = null;
let tauriWriteFile: any = null;
// Helper to import modules at runtime without TypeScript trying to resolve them at compile time
const runtimeImport = new Function("p", "return import(p)") as (p: string) => Promise<any>;

export function useTelecatFileHandler() {
	const store = useStore();
	const { convert } = useFileConverter();

	async function saveTelecatFile() {
		const zip = new JSZip();

		// Prepare DOM from the store content to collect images
		const container = document.createElement("div");
		container.innerHTML = store.textContent || "";

		// Collect images referenced in the content
		const imgs = Array.from(container.querySelectorAll("img"));
		const assetsFolder = zip.folder("assets");
		const assetMap = new Map<string, string>();
		let assetCounter = 1;

		for (const img of imgs) {
			const src = img.getAttribute("src") || "";
			if (!src) continue;

			try {
				let blob: Blob | null = null;

				if (src.startsWith("data:")) {
					// data URL -> fetch to get blob
					const res = await fetch(src);
					blob = await res.blob();
				} else {
					// Resolve relative URLs against current location
					let url: string;
					try {
						url = new URL(src, window.location.href).toString();
					} catch {
						url = src;
					}
					const res = await fetch(url);
					if (!res.ok) continue;
					blob = await res.blob();
				}

				if (!blob) continue;

				// Determine filename
				let name = `image-${assetCounter}`;
				const type = blob.type || "application/octet-stream";
				let ext = "bin";
				if (type && type.includes("/")) {
					ext = type.split("/").pop() || ext;
				}
				// try to extract filename from src path
				try {
					const parsed = new URL(src, window.location.href);
					const base = parsed.pathname.split("/").pop();
					if (base) {
						name = base;
					} else {
						name = `image-${assetCounter}.${ext}`;
					}
				} catch {
					name = `image-${assetCounter}.${ext}`;
				}

				// Ensure unique
				if (assetMap.has(src)) continue;
				let uniqueName = name;
				let suffix = 1;
				while (Array.from(assetMap.values()).includes(uniqueName)) {
					const dot = name.lastIndexOf(".");
					if (dot === -1) uniqueName = `${name}-${suffix++}`;
					else uniqueName = `${name.slice(0, dot)}-${suffix++}${name.slice(dot)}`;
				}

				// Write asset as Uint8Array for JSZip typing compatibility
				const buffer = await blob.arrayBuffer();
				const uint8 = new Uint8Array(buffer);
				assetsFolder?.file(uniqueName, uint8 as any);
				assetMap.set(src, uniqueName);
				assetCounter++;
			} catch (err) {
				// ignore individual image failures but log
				console.warn("Failed to include image", src, err);
			}
		}

		// Update image src attributes to point to assets/ filenames
		imgs.forEach((img) => {
			const src = img.getAttribute("src") || "";
			const mapped = assetMap.get(src);
			if (mapped) img.setAttribute("src", `assets/${mapped}`);
		});

		// Add content.html (original HTML with updated asset paths)
		zip.file("content.html", container.innerHTML);

		// Add content.md (convert using existing converter)
		try {
			const markdownResult = await convert(container.innerHTML, "md");
			const markdown = await markdownResult.blob.text();
			zip.file("content.md", markdown);
		} catch {
			// Fallback: store plain text
			zip.file("content.md", String(container.textContent || ""));
		}

		// Add config.json (store settings)
		const config = store.exportSettings();
		zip.file("config.json", JSON.stringify(config, null, 2));

		// Generate zip blob
		const blob = await zip.generateAsync({ type: "blob" });
		let filename = (store as any)._lastSavedFilename || "project.zip";
		// Normalize extension to .zip
		if (typeof filename === "string") {
			if (filename.toLowerCase().endsWith(".telecat")) filename = filename.replace(/\.telecat$/i, ".zip");
			else if (!/\.[^/.]+$/.test(filename)) filename = `${filename}.zip`;
		} else {
			filename = "project.zip";
		}
		const file = new File([blob], filename, { type: "application/zip" });

		// If running inside Tauri, show native Save dialog and write file via plugin-fs
		const isTauri = typeof window !== "undefined" && (window as any).__TAURI__ !== undefined;
		if (isTauri) {
			// lazy-import Tauri APIs to avoid bundling problems in the web
			if (!tauriSave) {
				const dlg = await runtimeImport("@tauri-apps/api/dialog");
				if (dlg && dlg.save) tauriSave = dlg.save;
			}
			if (!tauriWriteFile) {
				const fsMod = await runtimeImport("@tauri-apps/plugin-fs");
				if (fsMod && fsMod.writeFile) tauriWriteFile = fsMod.writeFile;
			}
			try {
				const saveOptions: any = { defaultPath: file.name };
				// ask the user where to save
				const path = await tauriSave(saveOptions);
				if (path) {
					// write binary contents
					const arr = new Uint8Array(await blob.arrayBuffer());
					await tauriWriteFile({ path, contents: arr });
					// persist last saved filename (absolute path in Tauri)
					(store as any)._lastSavedFilename = path;
				}
				return;
			} catch (err) {
				console.error("Tauri save failed, falling back to web download:", err);
				// fallthrough to web fallback
			}
		}
		// Web fallback: trigger browser download
		const link = document.createElement("a");
		link.href = URL.createObjectURL(file);
		link.download = file.name;
		link.click();
		setTimeout(() => URL.revokeObjectURL(link.href), 5000);
	}

	async function openTelecatFile(file: File) {
		// Use arrayBuffer and cast loadAsync to any to avoid typing issues
		const zip = await (JSZip as any).loadAsync(await file.arrayBuffer());

		// Helper to find entry by filename case-insensitive anywhere in zip
		function findEntryByName(name: string) {
			const lower = name.toLowerCase();
			const files = Object.keys(zip.files);
			for (const f of files) {
				if (f.toLowerCase().endsWith(`/${lower}`) || f.toLowerCase() === lower) return zip.file(f);
			}
			return null;
		}

		// Read config.json
		const configEntry = findEntryByName("config.json");
		if (configEntry) {
			const configContent = await configEntry.async("string");
			try {
				const config = JSON.parse(configContent);
				// Apply settings first
				store.importSettings(config);
				// If config contains textContent, prefer it and return early
				if (config.textContent !== undefined && config.textContent !== null) {
					store.textContent = config.textContent;
					return;
				}
			} catch (err) {
				console.warn("Invalid config.json in zip file", err);
			}
		} else {
			console.warn("No config.json found in zip file");
		}

		// Read content.html preferred
		const htmlEntry = findEntryByName("content.html");
		if (htmlEntry) {
			const htmlContent = await htmlEntry.async("string");
			store.textContent = htmlContent;
		} else {
			const mdEntry = findEntryByName("content.md");
			if (mdEntry) {
				const md = await mdEntry.async("string");
				store.textContent = md;
			} else {
				console.warn("No content file found in zip");
			}
		}
	}

	return { saveTelecatFile, openTelecatFile };
}
