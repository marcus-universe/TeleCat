import type { Editor } from "@tiptap/vue-3";
import type { InjectionKey, Ref } from "vue";

export const tiptapEditorKey: InjectionKey<Ref<Editor | undefined>> = Symbol("tiptapEditor");

function getImagePos(editor: Editor, img: HTMLImageElement): number | null {
	const { view } = editor;
	try {
		const pos = view.posAtDOM(img, 0);
		const node = view.state.doc.nodeAt(pos);
		if (node?.type.name === "image") return pos;

		if (pos > 0) {
			const nodeBefore = view.state.doc.nodeAt(pos - 1);
			if (nodeBefore?.type.name === "image") return pos - 1;
		}
	} catch {
		return null;
	}
	return null;
}

export function commitImageSize(editor: Editor, img: HTMLImageElement, width: number, height: number) {
	const pos = getImagePos(editor, img);
	if (pos == null) return false;

	const node = editor.state.doc.nodeAt(pos);
	if (!node || node.type.name !== "image") return false;

	const roundedWidth = Math.round(width);
	const roundedHeight = Math.round(height);

	editor.chain()
		.focus(undefined, { scrollIntoView: false })
		.command(({ tr }) => {
			tr.setNodeMarkup(pos, undefined, {
				...node.attrs,
				width: roundedWidth,
				height: roundedHeight
			});
			return true;
		})
		.run();

	return true;
}
