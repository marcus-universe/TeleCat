import { useStore } from "../stores/store.js";
// Tauri imports (used only when running inside a Tauri window)
let tauriSave: any = null;
let tauriWriteFile: any = null;
// Helper to import modules at runtime without TypeScript trying to resolve them at compile time
const runtimeImport = new Function("p", "return import(p)") as (p: string) => Promise<any>;

export function useTelecatFileHandler() {
	const store = useStore();

	async function saveTelecatFile() {
		// Build config payload from store
		const config = store.exportSettings();
		const json = JSON.stringify(config, null, 2);
		const filename = "config.json";

		// If running inside Tauri, show native Save dialog and write file via plugin-fs
		const isTauri = typeof window !== "undefined" && (window as any).__TAURI__ !== undefined;
		if (isTauri) {
			if (!tauriSave) {
				const dlg = await runtimeImport("@tauri-apps/api/dialog");
				if (dlg && dlg.save) tauriSave = dlg.save;
			}
			if (!tauriWriteFile) {
				const fsMod = await runtimeImport("@tauri-apps/plugin-fs");
				if (fsMod && fsMod.writeFile) tauriWriteFile = fsMod.writeFile;
			}
			try {
				const path = await tauriSave({ defaultPath: filename, filters: [{ name: "JSON", extensions: ["json"] }] });
				if (path) {
					await tauriWriteFile({ path, contents: json });
				}
				return;
			} catch (err) {
				console.error("Tauri save failed, falling back to web:", err);
			}
		}

		// Web: try File System Access API
		const anyWin = window as any;
		if (anyWin.showSaveFilePicker) {
			try {
				const handle = await anyWin.showSaveFilePicker({
					suggestedName: filename,
					types: [{ description: "JSON", accept: { "application/json": [".json"] } }]
				});
				const writable = await handle.createWritable();
				await writable.write(new Blob([json], { type: "application/json" }));
				await writable.close();
				return;
			} catch (e) {
				console.warn("Save aborted or failed, falling back to download", e);
			}
		}

		// Fallback: trigger download
		const a = document.createElement("a");
		a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			URL.revokeObjectURL(a.href);
			document.body.removeChild(a);
		}, 2000);
	}

	async function openTelecatFile(file: File) {
		try {
			const text = await file.text();
			const data = JSON.parse(text);
			store.importSettings(data);
		} catch (err) {
			console.error("Failed to read config.json:", err);
		}
	}

	return { saveTelecatFile, openTelecatFile };
}
