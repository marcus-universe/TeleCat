import { strToU8, zipSync } from "fflate";

export async function htmlToOdtBlob(html: string): Promise<Blob> {
	const container = document.createElement("div");
	container.innerHTML = html;

	const paragraphs: string[] = [];
	function pushParagraph(text: string) {
		const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		paragraphs.push(`<text:p>${esc}</text:p>`);
	}
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

	// ODT ist ein ZIP-Container. Wir verwenden fflate, um die minimalen Dateien zu packen.
	// Wichtig: "mimetype" muss unkomprimiert sein und als erste Datei erscheinen.
	const files: Record<string, any> = {};
	files.mimetype = [strToU8("application/vnd.oasis.opendocument.text"), { level: 0 }];
	files["content.xml"] = strToU8(contentXml);
	files["styles.xml"] = strToU8(stylesXml);
	files["META-INF/manifest.xml"] = strToU8(manifestXml);

	const zipData = zipSync(files, { level: 6 });
	// In strengen TS/DOM Typings erstellen wir einen neuen ArrayBuffer und kopieren die Daten hinein.
	const ab = new ArrayBuffer(zipData.byteLength);
	new Uint8Array(ab).set(zipData);
	return new Blob([ab], { type: "application/vnd.oasis.opendocument.text" });
}
