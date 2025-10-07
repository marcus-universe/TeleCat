// HTML → MD/DOCX/ODT converter utilities
// - MD: einfacher interner Converter
// - DOCX: native Word-Struktur via 'docx' (Überschriften, Listen, Absätze, Fett/Kursiv)
// - ODT: minimalistischer ODT-Zip via JSZip

// Dynamische Importe für DOCX/ODT; Markdown-Konvertierung lokal implementiert

export type ExportFormat = "md" | "docx" | "odt" | "pdf";

export interface ConvertResult {
	blob: Blob
	mime: string
	defaultFileName: string
}

// Optionen für Textausgabe in PDF
interface PdfTextOptions {
	size: number
	bold?: boolean
}

function basicHtmlToMarkdown(html: string): string {
	const container = document.createElement("div");
	container.innerHTML = html;

	function serialize(node: Node): string {
		if (node.nodeType === Node.TEXT_NODE) {
			return (node.textContent || "").replace(/\s+/g, " ");
		}
		if (!(node instanceof HTMLElement)) return "";
		const tag = node.tagName.toLowerCase();
		const children = Array.from(node.childNodes).map(serialize).join("");
		switch (tag) {
			case "h1": return `# ${children}\n\n`;
			case "h2": return `## ${children}\n\n`;
			case "h3": return `### ${children}\n\n`;
			case "h4": return `#### ${children}\n\n`;
			case "h5": return `##### ${children}\n\n`;
			case "h6": return `###### ${children}\n\n`;
			case "p": return `${children}\n\n`;
			case "br": return `\n`;
			case "strong":
			case "b": return `**${children}**`;
			case "em":
			case "i": return `*${children}*`;
			case "code": return `\`${children}\``;
			case "pre": return `\n\n\n${children}\n\n`;
			case "a": {
				const href = node.getAttribute("href") || "";
				return `[${children}](${href})`;
			}
			case "ul": {
				const items = Array.from(node.querySelectorAll(":scope > li"))
					.map((li) => `- ${serialize(li)}\n`)
					.join("");
				return `\n${items}\n`;
			}
			case "ol": {
				const items = Array.from(node.querySelectorAll(":scope > li"))
					.map((li, i) => `${i + 1}. ${serialize(li)}\n`)
					.join("");
				return `\n${items}\n`;
			}
			case "li": return children.trim();
			case "img": {
				const alt = node.getAttribute("alt") || "";
				const src = node.getAttribute("src") || "";
				return `![${alt}](${src})`;
			}
			default: return children;
		}
	}

	const md = `${Array.from(container.childNodes).map(serialize).join("").replace(/\n{3,}/g, "\n\n").trim()}\n`;
	return md;
}

async function htmlToDocxBlob(html: string): Promise<Blob> {
	// Erzeuge ein echtes DOCX mit nativen Überschriften/Absätzen/Listen mittels 'docx'
	const container = document.createElement("div");
	container.innerHTML = html;

	const docxMod: any = await import("docx");
	const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docxMod;

	interface RunSpec {
		text?: string
		break?: number
		bold?: boolean
		italics?: boolean
		underline?: any
		font?: string
		size?: number
		color?: string
	}

	function buildRunSpecs(node: Node): RunSpec[] {
		const runs: RunSpec[] = [];
		if (node.nodeType === Node.TEXT_NODE) {
			const text = (node.textContent || "").replace(/\s+/g, " ");
			if (text) runs.push({ text });
			return runs;
		}
		if (!(node instanceof HTMLElement)) return runs;
		const tag = node.tagName.toLowerCase();
		const childRuns = Array.from(node.childNodes).flatMap(buildRunSpecs);
		switch (tag) {
			case "strong":
			case "b":
				return childRuns.map((r) => ({ ...r, bold: true }));
			case "em":
			case "i":
				return childRuns.map((r) => ({ ...r, italics: true }));
			case "u":
				return childRuns.map((r) => ({ ...r, underline: {} }));
			case "code":
				return childRuns.map((r) => ({ ...r, font: "Courier New", size: 22 }));
			case "br":
				return [{ break: 1 }];
			case "a": {
				const href = node.getAttribute("href") || "";
				const label = childRuns.length ? childRuns.map((r) => r.text || "").join("") : href;
				const specs: RunSpec[] = [];
				if (label) specs.push({ text: label, color: "0000FF", underline: {} });
				if (href && href !== label) specs.push({ text: ` (${href})` });
				return specs;
			}
			default:
				return childRuns;
		}
	}

	function computeListLevel(li: HTMLElement): number {
		let lvl = 0;
		let p: HTMLElement | null = li.parentElement;
		while (p) {
			const t = p.tagName.toLowerCase();
			if (t === "ul" || t === "ol") lvl++;
			p = p.parentElement;
		}
		// li hat immer genau einen direkten ul/ol-Elternteil => Level-0 entspricht 1 gezähltem Eintrag
		return Math.max(0, lvl - 1);
	}

	function paragraphFromElement(el: HTMLElement): any | null {
		const tag = el.tagName.toLowerCase();
		const runSpecs = Array.from(el.childNodes).flatMap(buildRunSpecs);
		const runs = runSpecs.map((rs) => new TextRun(rs));
		switch (tag) {
			case "h1": return new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs });
			case "h2": return new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs });
			case "h3": return new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs });
			case "h4": return new Paragraph({ heading: HeadingLevel.HEADING_4, children: runs });
			case "h5": return new Paragraph({ heading: HeadingLevel.HEADING_5, children: runs });
			case "h6": return new Paragraph({ heading: HeadingLevel.HEADING_6, children: runs });
			case "p": return new Paragraph({ children: runs });
			case "li": {
				const parentTag = el.parentElement?.tagName.toLowerCase();
				const level = computeListLevel(el);
				if (parentTag === "ul") {
					return new Paragraph({ children: runs, bullet: { level } });
				}
				return new Paragraph({ children: runs, numbering: { reference: "num-list", level } });
			}
			case "pre": {
				const text = el.textContent || "";
				return new Paragraph({ children: [new TextRun({ text, font: "Courier New" })] });
			}
			case "blockquote": return new Paragraph({ children: runs, indent: { left: 720 } });
			default:
				if ("textContent" in el) {
					const content = (el as HTMLElement).textContent?.trim() || "";
					if (content) return new Paragraph({ children: [new TextRun({ text: content })] });
				}
				return null;
		}
	}

	// Sammle relevante Blockelemente inkl. aller Listeneinträge (auch verschachtelt)
	const blocks = container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul > li, ol > li, pre, blockquote");
	const paragraphs: any[] = [];
	if (blocks.length) {
		blocks.forEach((node) => {
			const p = paragraphFromElement(node as HTMLElement);
			if (p) paragraphs.push(p);
		});
	} else {
		const text = container.textContent?.trim() || "";
		paragraphs.push(new Paragraph({ children: [new TextRun({ text })] }));
	}

	// Nummerierungs-Definition für geordnete Listen (bis Level 3)
	const numLevels = [
		{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
		{ level: 1, format: "decimal", text: "%1.%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
		{ level: 2, format: "decimal", text: "%1.%2.%3.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 2160, hanging: 360 } } } }
	];

	const doc = new Document({
		numbering: { config: [{ reference: "num-list", levels: numLevels as any }] },
		sections: [{ children: paragraphs }]
	});

	return await Packer.toBlob(doc);
}

async function htmlToOdtBlob(html: string): Promise<Blob> {
	// Build a minimal ODT file: zip with mimetype, content.xml, styles.xml, META-INF/manifest.xml
	// Convert HTML into very simple text:p paragraphs
	const container = document.createElement("div");
	container.innerHTML = html;

	const paragraphs: string[] = [];
	function pushParagraph(text: string) {
		const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		paragraphs.push(`<text:p>${esc}</text:p>`);
	}
	// Collect block-level elements as paragraphs, fallback to textContent
	const blocks = container.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre");
	if (blocks.length > 0) {
		blocks.forEach((el) => pushParagraph((el as HTMLElement).textContent?.trim() || ""));
	} else {
		pushParagraph(container.textContent?.trim() || "");
	}

	const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">
	<office:body>
		<office:text>
			${paragraphs.join("\n\t\t\t")}
		</office:text>
	</office:body>
</office:document-content>`;

	const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
	<office:styles/>
</office:document-styles>`;

	const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
	<manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
	<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
	<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

	let JSZipCtor: any;
	try {
		const mod: any = await import("jszip");
		JSZipCtor = mod.default || mod;
	} catch {
		throw new Error("JSZip not available for ODT export");
	}
	const zip: any = new JSZipCtor();
	// ODT requires the mimetype to be the first entry and stored without compression
	(zip as any).file("mimetype", "application/vnd.oasis.opendocument.text", { compression: "STORE" });
	zip.file("content.xml", contentXml);
	zip.file("styles.xml", stylesXml);
	zip.folder("META-INF")?.file("manifest.xml", manifestXml);

	const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.oasis.opendocument.text" });
	return blob;
}

async function htmlToPdfBlob(html: string): Promise<Blob> {
	// Minimaler HTML→PDF Renderer mit pdf-lib: Headings, Paragraphs, einfache Listen
	const container = document.createElement("div");
	container.innerHTML = html;

	const pdfLib: any = await import("pdf-lib");
	const { PDFDocument, rgb, PDFName, PDFArray, PDFString } = pdfLib;
	// fontkit registrieren, um TTF einzubetten
	const fontkitMod: any = await import("@pdf-lib/fontkit");

	const doc = await PDFDocument.create();
	(doc as any).registerFontkit(fontkitMod.default || fontkitMod);
	let page = doc.addPage();
	const { width, height } = page.getSize();

	const margin = 50;
	let cursorY = height - margin;
	const maxWidth = width - margin * 2;

	// Fonts: Assistant Regular/Bold einbetten (über Vite-URL laden)
	const assistantRegularUrl = new URL("../assets/fonts/Assistant/static/Assistant-Regular.ttf", import.meta.url).toString();
	const assistantBoldUrl = new URL("../assets/fonts/Assistant/static/Assistant-Bold.ttf", import.meta.url).toString();
	const [regBuf, boldBuf] = await Promise.all([
		fetch(assistantRegularUrl).then((r) => r.arrayBuffer()),
		fetch(assistantBoldUrl).then((r) => r.arrayBuffer())
	]);
	const fontRegular = await doc.embedFont(regBuf, { subset: true });
	const fontBold = await doc.embedFont(boldBuf, { subset: true });

	// Optional: Emoji-Font einbetten, wenn vorhanden (z. B. NotoEmoji-Regular.ttf)
	let fontEmoji: any | undefined;
	try {
		const emojiUrl = new URL("../assets/fonts/Emoji/NotoEmoji-Regular.ttf", import.meta.url).toString();
		const emojiBuf = await fetch(emojiUrl).then((r) => r.arrayBuffer());
		fontEmoji = await doc.embedFont(emojiBuf, { subset: true });
	} catch {
		// Emoji-Font nicht vorhanden – Emojis werden ggf. als leere Kisten dargestellt
		fontEmoji = undefined;
	}

	// Hinweis: Mit Assistant (TTF) sind Emojis teils nicht verfügbar. Wir rendern sie als Text-Ersatz ("?" oder plain) – optional erweiterbar auf Emoji-Bitmaps.

	// Grapheme-Segmentierung (für Emojis/Kompositionszeichen)
	function segmentGraphemes(s: string): string[] {
		// Intl.Segmenter für bestes Ergebnis; Fallback: Codepoint-Split
		const Seg = (Intl as any)?.Segmenter;
		if (Seg) {
			const seg = new Seg(undefined, { granularity: "grapheme" });
			return Array.from(seg.segment(s), (x: any) => x.segment as string);
		}
		return Array.from(s);
	}

	// Sehr einfache Emoji-Erkennung; deckt Extended Pictographic ab
	const emojiRegex = /\p{Extended_Pictographic}/u;
	function isEmoji(gr: string) {
		return emojiRegex.test(gr);
	}

	function measureTextWidthMixed(text: string, size: number, bold = false): number {
		const clusters = segmentGraphemes(text);
		let total = 0;
		for (const g of clusters) {
			const useEmoji = fontEmoji && isEmoji(g);
			const f = useEmoji ? fontEmoji : (bold ? fontBold : fontRegular);
			total += f.widthOfTextAtSize(g, size);
		}
		return total;
	}

	function drawTextMixed(text: string, x: number, y: number, size: number, color: any, bold = false): number {
		const clusters = segmentGraphemes(text);
		let cursorX = x;
		for (const g of clusters) {
			const useEmoji = fontEmoji && isEmoji(g);
			const f = useEmoji ? fontEmoji : (bold ? fontBold : fontRegular);
			const w = f.widthOfTextAtSize(g, size);
			page.drawText(g, { x: cursorX, y, size, font: f, color });
			cursorX += w;
		}
		return cursorX - x;
	}

	function drawText(text: string, options?: PdfTextOptions) {
		const opts: PdfTextOptions = options || { size: 12 };
		const size = opts.size;
		const lineHeight = size * 1.3;
		const safeText = text;
		// Wrap auf Basis von gemischter Breite (Emoji/Regular)
		let line = "";
		const lines: string[] = [];
		for (const token of safeText.split(/(\s+)/)) {
			const test = line ? `${line}${token}` : token;
			const wWidth = measureTextWidthMixed(test, size, !!opts.bold);
			if (wWidth > maxWidth && line) {
				lines.push(line);
				line = token.trimStart();
			} else {
				line = test;
			}
		}
		if (line) lines.push(line);

		for (const l of lines) {
			if (cursorY - lineHeight < margin) {
				const p = doc.addPage();
				cursorY = p.getSize().height - margin;
				page = p;
			}
			drawTextMixed(l ?? "", margin, cursorY, size, rgb(0, 0, 0), !!opts.bold);
			cursorY -= lineHeight;
		}
		cursorY -= size * 0.4;
	}

	function pushHeading(text: string, level: number) {
		const size = Math.max(18 - (level - 1) * 2, 12);
		drawText(text, { size, bold: true });
	}

	function pushListItem(text: string, level: number, ordered: boolean, index: number) {
		const bullet = ordered ? `${index + 1}. ` : "• ";
		const indent = margin + level * 20;
		const size = 12;
		const lineHeight = size * 1.3;

		const prefixWidth = fontRegular.widthOfTextAtSize(bullet, size);
		const safeText = text;
		const words = safeText.split(/\s+/);
		let line = "";
		const lines: string[] = [];
		const available = maxWidth - level * 20 - prefixWidth;
		for (const w of words) {
			const test = line ? `${line} ${w}` : w;
			const wWidth = measureTextWidthMixed(test, size);
			if (wWidth > available) {
				if (line) lines.push(line);
				line = w;
			} else {
				line = test;
			}
		}
		if (line) lines.push(line);

		for (let i = 0; i < lines.length; i++) {
			if (cursorY - lineHeight < margin) {
				const p = doc.addPage();
				cursorY = p.getSize().height - margin;
				page = p;
			}
			const l = lines[i] ?? "";
			if (i === 0) {
				page.drawText(bullet, { x: indent, y: cursorY, size, font: fontRegular, color: rgb(0, 0, 0) });
				drawTextMixed(l, indent + prefixWidth, cursorY, size, rgb(0, 0, 0));
			} else {
				drawTextMixed(l, indent + prefixWidth, cursorY, size, rgb(0, 0, 0));
			}
			cursorY -= lineHeight;
		}
		cursorY -= size * 0.4;
	}

	// Parse und rendern
	function computePdfListLevel(li: Element): number {
		let lvl = 0;
		let p: Element | null = li.parentElement;
		while (p) {
			const t = p.tagName.toLowerCase();
			if (t === "ul" || t === "ol") lvl++;
			p = p.parentElement;
		}
		return Math.max(0, lvl - 1);
	}

	const blocks = container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol");
	blocks.forEach((el) => {
		const tag = el.tagName.toLowerCase();
		if (/^h[1-6]$/.test(tag)) {
			const level = Number.parseInt(tag.slice(1), 10);
			pushHeading((el.textContent || "").trim(), level);
		} else if (tag === "p") {
			// Rendere Inline-Kinder: Links klickbar machen
			const inlines: Array<{ type: "text" | "link" | "emoji", text?: string, href?: string }> = [];
			el.childNodes.forEach((n) => {
				if (n.nodeType === Node.TEXT_NODE) {
					inlines.push({ type: "text", text: (n.textContent || "") });
				} else if (n instanceof HTMLElement) {
					if (n.tagName.toLowerCase() === "a") {
						inlines.push({ type: "link", text: (n.textContent || ""), href: n.getAttribute("href") || undefined });
					} else {
						inlines.push({ type: "text", text: (n.textContent || "") });
					}
				}
			});

			let cursorX = margin;
			const size = 12;
			const lineHeight = size * 1.3;

			function ensureSpace(linesNeeded = 1) {
				if (cursorY - lineHeight * linesNeeded < margin) {
					const p = doc.addPage();
					cursorY = p.getSize().height - margin;
					page = p;
				}
			}

			// Hilfsfunktion: Link-Annotation zur aktuellen Seite hinzufügen
			function addLinkAnnotation(x: number, y: number, w: number, h: number, url: string) {
				const annotsKey = PDFName.of("Annots");
				let annots = page.node.lookup(annotsKey, PDFArray);
				if (!annots) {
					annots = doc.context.obj([]);
					page.node.set(annotsKey, annots);
				}
				const action = doc.context.obj({
					S: PDFName.of("URI"),
					URI: PDFString.of(url)
				});
				const linkAnnot = doc.context.obj({
					Type: PDFName.of("Annot"),
					Subtype: PDFName.of("Link"),
					Rect: [x, y, x + w, y + h],
					Border: [0, 0, 0],
					A: action
				});
				annots.push(linkAnnot);
			}

			for (const part of inlines) {
				if (part.type === "text") {
					const chunks = (part.text || "").split(/(\s+)/);
					for (const ch of chunks) {
						const w = measureTextWidthMixed(ch, size);
						if (cursorX + w > width - margin) {
							cursorY -= lineHeight;
							ensureSpace();
							cursorX = margin;
						}
						drawTextMixed(ch, cursorX, cursorY, size, rgb(0, 0, 0));
						cursorX += w;
					}
				} else if (part.type === "link") {
					const label = part.text || "";
					const w = measureTextWidthMixed(label, size);
					if (cursorX + w > width - margin) {
						cursorY -= lineHeight;
						ensureSpace();
						cursorX = margin;
					}
					drawTextMixed(label, cursorX, cursorY, size, rgb(0, 0, 1));
					if (part.href) {
						// Optional: unsichtbares Rechteck für Debug/Hitbox – borderWidth: 0 => nicht sichtbar
						page.drawRectangle({ x: cursorX, y: cursorY - 2, width: w, height: lineHeight, borderColor: rgb(0, 0, 1), borderWidth: 0 });
						addLinkAnnotation(cursorX, cursorY - 2, w, lineHeight, part.href);
					}
					cursorX += w;
				}
			}
			cursorY -= lineHeight * 1.2;
		} else if (tag === "ul" || tag === "ol") {
			const items = el.querySelectorAll(":scope > li");
			items.forEach((li, idx) => {
				const text = (li.textContent || "").trim();
				const level = computePdfListLevel(li);
				pushListItem(text, level, tag === "ol", idx);
			});
		}
	});

	const pdfBytes = await doc.save();
	return new Blob([pdfBytes], { type: "application/pdf" });
}

export function useFileConverter() {
	async function convert(html: string, format: ExportFormat): Promise<ConvertResult> {
		if (format === "md") {
			const md = basicHtmlToMarkdown(html);
			return {
				blob: new Blob([md], { type: "text/markdown;charset=utf-8" }),
				mime: "text/markdown",
				defaultFileName: "telecat.md"
			};
		}
		if (format === "docx") {
			const blob = await htmlToDocxBlob(html);
			return {
				blob,
				mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				defaultFileName: "telecat.docx"
			};
		}
		if (format === "pdf") {
			const blob = await htmlToPdfBlob(html);
			return {
				blob,
				mime: "application/pdf",
				defaultFileName: "telecat.pdf"
			};
		}
		// odt
		const blob = await htmlToOdtBlob(html);
		return {
			blob,
			mime: "application/vnd.oasis.opendocument.text",
			defaultFileName: "telecat.odt"
		};
	}

	return { convert };
}
