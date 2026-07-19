<template>
	<div class="lang-dropdown">
		<select
			:value="locale"
			class="lang-select"
			:aria-label="t('language.label')"
			@change="onChange"
		>
			<option value="en">
				EN
			</option>
			<option value="de">
				DE
			</option>
		</select>
	</div>
</template>

<script lang="ts" setup>
	const { locale, setLocale, t } = useI18n();

	function onChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		setLocale(value);
		if (import.meta.client) {
			localStorage.setItem("telecat-locale", value);
		}
	}

	onMounted(() => {
		if (import.meta.client) {
			const stored = localStorage.getItem("telecat-locale");
			if (stored && (stored === "en" || stored === "de")) {
				setLocale(stored);
			}
		}
	});
</script>

<style scoped>
.lang-dropdown {
	-webkit-app-region: no-drag;
	pointer-events: auto;
}

.lang-select {
	appearance: none;
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 6px;
	color: var(--color_p);
	font-size: 1.4rem;
	font-family: inherit;
	font-weight: 600;
	padding: 0.25rem 0.75rem;
	cursor: pointer;
	transition: background 0.2s ease;
}

.lang-select:hover {
	background: rgba(255, 255, 255, 0.06);
}

.lang-select option {
	background: rgb(var(--prompt_bg));
	color: var(--text_color);
}
</style>
