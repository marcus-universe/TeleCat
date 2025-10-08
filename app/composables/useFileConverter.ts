// HTML → MD/DOCX/PDF/ODT converter utilities
// - MD: einfacher interner Converter
// - DOCX: native Word-Struktur via 'docx' (Überschriften, Listen, Absätze, Fett/Kursiv)
// - PDF: gerendert via pdf-lib

// Dynamische Importe für DOCX/ODT; Markdown-Konvertierung lokal implementiert
import { htmlToDocxBlob } from "./ConvertTypes/convertHTMLtoDocx.js";
import { basicHtmlToMarkdown } from "./ConvertTypes/convertHTMLtoMarkdown.js";
import { htmlToOdtBlob } from "./ConvertTypes/convertHTMLtoOdt.js";
import { htmlToPdfBlob } from "./ConvertTypes/convertHTMLtoPdf.js";

export type ExportFormat = "md" | "docx" | "pdf" | "odt";

export interface ConvertResult {
	blob: Blob
	mime: string
	defaultFileName: string
}

// Re-exported thin dispatcher that delegates to modular converters in ConvertTypes/
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
		if (format === "odt") {
			const blob = await htmlToOdtBlob(html);
			return {
				blob,
				mime: "application/vnd.oasis.opendocument.text",
				defaultFileName: "telecat.odt"
			};
		}
		// no other export formats
		throw new Error(`Unsupported export format: ${String(format)}`);
	}

	return { convert };
}
