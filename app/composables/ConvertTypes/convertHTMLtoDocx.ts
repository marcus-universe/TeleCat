export async function htmlToDocxBlob(html: string): Promise<Blob> {
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
