declare interface ModuleOptions {
	prefix: false | string
}

declare global {
	interface Window {
		__TAURI__: Record<string, unknown>
	}
}
