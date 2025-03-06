import { useRouter } from "vue-router";

export const usePages = () => {
	const router = useRouter();

	interface Page {
		label: string
		to: string
		icon: string
	}

	const pages: Page[] = router.getRoutes().filter((route: any) => route.name !== "index" && route.name !== "all").map((route) => {
		return {
			label: route.meta.name as string,
			to: route.path,
			icon: route.meta.icon as string
		};
	});

	return {
		pages
	};
};
