<template>
	<div class="nav-bottom">
		<button
			type="button"
			class="dashboard-button"
			:title="t('nav.dashboard')"
			:aria-label="t('nav.dashboard')"
			@click="goToDashboard()"
		>
			<DesignIcons icon="dashboard" customclass="dashboard-icon" />
		</button>
	</div>
</template>

<script lang="ts" setup>
	const { t } = useI18n();
	const { goToDashboard } = useTelecatServer();
</script>
