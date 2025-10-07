// Simple global event bus using EventTarget for app-wide actions without extra deps
export interface AppEventMap {
	"file:new": void
	"file:openContent": { content: string, extension?: string }
	"file:importContent": { content: string, extension?: string }
	"file:save": void
	"file:saveAs": void
	"file:export:docx": void
	"file:export:odt": void
	"file:export:md": void
	"file:export:pdf": void
	"app:exit": void
}

const target = new EventTarget();

export function onAppEvent<K extends keyof AppEventMap>(
	type: K,
	handler: (ev: CustomEvent<AppEventMap[K]>) => void
) {
	const wrapped = handler as EventListener;
	target.addEventListener(type, wrapped as EventListener);
	return () => target.removeEventListener(type, wrapped);
}

export function emitAppEvent<K extends keyof AppEventMap>(type: K, detail: AppEventMap[K]) {
	target.dispatchEvent(new CustomEvent(type, { detail }));
}
