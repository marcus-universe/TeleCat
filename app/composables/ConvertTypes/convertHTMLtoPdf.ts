export async function htmlToPdfBlob(html: string): Promise<Blob> {
	try {
		const container = document.createElement("div");
		container.innerHTML = html;

		const pdfLib: any = await import("pdf-lib");
		const { PDFDocument, rgb, StandardFonts, PDFName, PDFArray, PDFString } = pdfLib;
		const fontkitMod: any = await import("@pdf-lib/fontkit");

		const doc = await PDFDocument.create();
		doc.registerFontkit(fontkitMod.default || fontkitMod);
		let page = doc.addPage();
		const { width, height } = page.getSize();

		const margin = 50;
		let cursorY = height - margin;
		const maxWidth = width - margin * 2;
		let isFirstElement = true;

		// Use standard fonts by default to avoid font format issues
		// The Assistant fonts seem to have compatibility issues with fontkit
		console.log("Using standard PDF fonts for better compatibility");
		const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
		const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

		// Disable emoji fonts for now due to compatibility issues
		const fontEmoji: any | undefined = undefined;

		function segmentGraphemes(s: string): string[] {
			const Seg = (Intl as any)?.Segmenter;
			if (Seg) {
				const seg = new Seg(undefined, { granularity: "grapheme" });
				return Array.from(seg.segment(s), (x: any) => x.segment as string);
			}
			return Array.from(s);
		}

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
				if (useEmoji || !isEmoji(g)) {
					total += f.widthOfTextAtSize(g, size);
				}
			}
			return total;
		}

		function drawTextMixed(text: string, x: number, y: number, size: number, color: any, bold = false): number {
			const clusters = segmentGraphemes(text);
			let cursorX = x;
			for (const g of clusters) {
				const useEmoji = fontEmoji && isEmoji(g);
				const f = useEmoji ? fontEmoji : (bold ? fontBold : fontRegular);
				if (useEmoji || !isEmoji(g)) {
					const w = f.widthOfTextAtSize(g, size);
					page.drawText(g, { x: cursorX, y, size, font: f, color });
					cursorX += w;
				}
			}
			return cursorX - x;
		}

		function drawText(text: string, options?: { size: number, bold?: boolean }) {
			const opts = options || { size: 12 };
			const size = opts.size;
			const lineHeight = size * 1.3;
			const safeText = text;
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

		function pushHeading(text: string, level: number, isFirst = false) {
			// Add spacing before heading (except for the first element)
			if (!isFirst) {
				const spacing = level === 1 ? 20 : 16;
				cursorY -= spacing;
			}

			// Check if we need a new page
			const size = Math.max(18 - (level - 1) * 2, 12);
			const lineHeight = size * 1.3;
			if (cursorY - lineHeight < margin) {
				const p = doc.addPage();
				cursorY = p.getSize().height - margin;
				page = p;
			}

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

		const blocks = container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol");
		blocks.forEach((el) => {
			const tag = el.tagName.toLowerCase();
			if (/^h[1-6]$/.test(tag)) {
				const level = Number.parseInt(tag.slice(1), 10);
				pushHeading((el.textContent || "").trim(), level, isFirstElement);
				isFirstElement = false;
			} else if (tag === "p") {
				isFirstElement = false;
				// Check for formatting within paragraphs
				const hasFormatting = el.querySelector("strong, b, em, i");
				if (hasFormatting) {
					// Handle formatted text within paragraphs
					let cursorX = margin;
					const size = 12;
					const lineHeight = size * 1.3;

					function processTextNode(node: Node) {
						if (node.nodeType === Node.TEXT_NODE) {
							const text = node.textContent || "";
							const chunks = text.split(/(\s+)/);
							for (const chunk of chunks) {
								const w = measureTextWidthMixed(chunk, size);
								if (cursorX + w > width - margin) {
									cursorY -= lineHeight;
									if (cursorY - lineHeight < margin) {
										const p = doc.addPage();
										cursorY = p.getSize().height - margin;
										page = p;
									}
									cursorX = margin;
								}
								drawTextMixed(chunk, cursorX, cursorY, size, rgb(0, 0, 0));
								cursorX += w;
							}
						} else if (node instanceof HTMLElement) {
							const tagName = node.tagName.toLowerCase();
							const isBold = ["strong", "b"].includes(tagName);
							const isLink = tagName === "a";
							const text = node.textContent || "";
							const chunks = text.split(/(\s+)/);

							for (const chunk of chunks) {
								const w = measureTextWidthMixed(chunk, size, isBold);
								if (cursorX + w > width - margin) {
									cursorY -= lineHeight;
									if (cursorY - lineHeight < margin) {
										const p = doc.addPage();
										cursorY = p.getSize().height - margin;
										page = p;
									}
									cursorX = margin;
								}

								if (isLink) {
									// Draw link in blue and add annotation
									drawTextMixed(chunk, cursorX, cursorY, size, rgb(0, 0, 1), isBold);
									const href = node.getAttribute("href");
									if (href) {
										addLinkAnnotation(cursorX, cursorY - 2, w, lineHeight, href);
									}
								} else {
									drawTextMixed(chunk, cursorX, cursorY, size, rgb(0, 0, 0), isBold);
								}
								cursorX += w;
							}
						}
					}

					el.childNodes.forEach(processTextNode);
					cursorY -= lineHeight * 0.5; // Add some spacing after paragraph
				} else {
					// Check for links even in simple paragraphs
					const hasLinks = el.querySelector("a");
					if (hasLinks) {
						// Handle links in simple paragraphs
						let cursorX = margin;
						const size = 12;
						const lineHeight = size * 1.3;

						function processSimpleNode(node: Node) {
							if (node.nodeType === Node.TEXT_NODE) {
								const text = node.textContent || "";
								const chunks = text.split(/(\s+)/);
								for (const chunk of chunks) {
									const w = measureTextWidthMixed(chunk, size);
									if (cursorX + w > width - margin) {
										cursorY -= lineHeight;
										if (cursorY - lineHeight < margin) {
											const p = doc.addPage();
											cursorY = p.getSize().height - margin;
											page = p;
										}
										cursorX = margin;
									}
									drawTextMixed(chunk, cursorX, cursorY, size, rgb(0, 0, 0));
									cursorX += w;
								}
							} else if (node instanceof HTMLElement && node.tagName.toLowerCase() === "a") {
								const text = node.textContent || "";
								const chunks = text.split(/(\s+)/);
								for (const chunk of chunks) {
									const w = measureTextWidthMixed(chunk, size);
									if (cursorX + w > width - margin) {
										cursorY -= lineHeight;
										if (cursorY - lineHeight < margin) {
											const p = doc.addPage();
											cursorY = p.getSize().height - margin;
											page = p;
										}
										cursorX = margin;
									}
									// Draw link in blue and add annotation
									drawTextMixed(chunk, cursorX, cursorY, size, rgb(0, 0, 1));
									const href = node.getAttribute("href");
									if (href) {
										addLinkAnnotation(cursorX, cursorY - 2, w, lineHeight, href);
									}
									cursorX += w;
								}
							}
						}

						el.childNodes.forEach(processSimpleNode);
						cursorY -= lineHeight * 0.5; // Add some spacing after paragraph
					} else {
						drawText((el.textContent || "").trim());
					}
				}
			} else if (tag === "ul" || tag === "ol") {
				isFirstElement = false;
				const items = el.querySelectorAll(":scope > li");
				items.forEach((li, idx) => {
					const text = (li.textContent || "").trim();
					const level = computePdfListLevel(li);
					// For now, keep list items simple - full link support in lists would need more complex implementation
					pushListItem(text, level, tag === "ol", idx);
				});
			}
		});

		const pdfBytes = await doc.save();
		return new Blob([pdfBytes], { type: "application/pdf" });
	} catch (error) {
		console.error("PDF generation failed:", error);
		throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}
