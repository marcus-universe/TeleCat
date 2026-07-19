export const DEFAULT_TEXT_CONTENT = `<h1>Nya to <mark>TeleCat</mark>!</h1><p> This is the best <strong>Open Source Teleprompter App</strong> for you and your cat.</p><p> <img src="https://media.tenor.com/E3v4j9VZuSwAAAAj/cute-cat-cat-typing.gif" alt="a cartoon cat is sitting on a keyboard with a speech bubble above its head" width="256" height="192" style="max-width: 100%; height: auto; margin: 0.25rem; display: inline-block; vertical-align: middle;"></p><h2>First Steps</h2><ul><li><p>On the top right corner you can switch between preview and edit mode.</p></li><li><p>Inside the Settings you can customize the appearance and behavior of the teleprompter.</p></li><li><p>Change the scroll direction with the two arrows next to the play button.</p></li><li><p>Inside the edit view you can use markdown syntax to style your promter content.</p></li></ul><p>Consider contributing to the <strong>Open Source Community</strong> to support this project at:<br><a target="_blank" rel="noopener noreferrer nofollow" href="https://github.com/marcus-universe/TeleCat">github.com/marcus-universe/TeleCat</a>❤️</p>`;

export function getDefaultProjectData() {
	return {
		speed: 80,
		textContent: DEFAULT_TEXT_CONTENT,
		mirroredX: false,
		mirroredY: false,
		colorText: "#eeeeee",
		colorTheme: "#eeeeee",
		colorBackground: "0, 0, 0",
		colorHighlight: "#6038FF",
		fontScale: 3,
		h1Scale: 4.5,
		h2Scale: 3.5,
		h3Scale: 2.5,
		pSize: 1.5,
		pLineHeight: 1.5,
		pSpacing: 1,
		sidePadding: 6.4,
		direction: true
	};
}

export const defaultProjectData = getDefaultProjectData();
