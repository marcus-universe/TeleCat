declare interface ModuleOptions {
	prefix: false | string
}

declare global {
	interface Window {
		__TAURI__: Record<string, unknown>
	}
}

declare module "@tiptap/extension-link" {
	const Link: any;
	export default Link;
}

// Ambient module declarations for optional converters used at runtime
declare module "jszip" {
	export default class JSZip {
		file(path: string, data: string, options?: any): this;
		folder(path: string): JSZip | undefined;
		generateAsync(options: { type: string, mimeType?: string }): Promise<Blob>;
	}
}

// Vite Asset Imports for fonts
declare module "*.ttf" {
	const url: string;
	export default url;
}
declare module "*.ttf?url" {
	const url: string;
	export default url;
}

// (früher vorhandene html-docx-js Deklarationen entfernt)

// Ambient module declaration for 'html-docx' runtime import
declare module "html-docx" {
	// Some builds expose asBlob(html: string): Blob
	export function asBlob(html: string): Blob;
	// Others expose async function returning ArrayBuffer/Uint8Array or Blob
	export function htmlToDocx(html: string): Promise<Blob | ArrayBuffer | Uint8Array>;
	const _default: {
		asBlob?: (html: string) => Blob
		htmlToDocx?: (html: string) => Promise<Blob | ArrayBuffer | Uint8Array>
	};
	export default _default;
}
