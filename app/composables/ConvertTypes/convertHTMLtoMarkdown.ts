export function basicHtmlToMarkdown(html: string): string {
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
