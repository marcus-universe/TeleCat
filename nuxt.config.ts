export default defineNuxtConfig({
	devtools: {
		enabled: true // or false to disable
	},
	modules: ["@vueuse/nuxt", "nuxt-svgo", "@nuxt/eslint", "@pinia/nuxt"],
	pinia: {
		storeDirs: ["@/stores/**"]
	},
	app: {
		head: {
			title: "Nuxtor",
			charset: "utf-8",
			viewport: "width=device-width, initial-scale=1",
			meta: [{ name: "format-detection", content: "no" }]
		},
		pageTransition: {
			name: "page",
			mode: "out-in"
		},
		layoutTransition: {
			name: "layout",
			mode: "out-in"
		}
	},
	css: ["@/assets/css/main.css", "@/sass/main.sass"],

	icon: {
		customCollections: [
			{
				prefix: "local",
				dir: "./app/assets/icons"
			}
		]
	},
	svgo: {
		autoImportPath: "@/assets/"
	},
	ssr: false,
	dir: {
		modules: "app/modules"
	},
	imports: {
		presets: [
			{
				from: "zod",
				imports: [
					"z",
					{
						name: "infer",
						as: "zInfer",
						type: true
					}
				]
			}
		]
	},
	vite: {
		clearScreen: false,
		envPrefix: ["VITE_", "TAURI_"],
		server: {
			strictPort: true,
			hmr: {
				protocol: "ws",
				host: "0.0.0.0",
				port: 3001
			},
			watch: {
				ignored: ["**/src-tauri/**"]
			}
		}
	},
	devServer: {
		host: "0.0.0.0"
	},
	eslint: {
		config: {
			standalone: false
		}
	},
	experimental: {
		typedPages: true
	},
	future: {
		compatibilityVersion: 4
	},
	compatibilityDate: "2025-02-01"
});
function defineNuxtConfig(config: {
	devtools: { enabled: boolean }
	modules: string[]
	pinia: { storeDirs: string[] }
	app: {
		head: {
			title: string
			charset: string
			viewport: string
			meta: { name: string, content: string }[]
		}
		pageTransition: { name: string, mode: string }
		layoutTransition: { name: string, mode: string }
	}
	css: string[]
	icon: { customCollections: { prefix: string, dir: string }[] }
	svgo: { autoImportPath: string }
	ssr: boolean
	dir: { modules: string }
	imports: {
		presets: {
			from: string
			imports: (string | { name: string, as: string, type: boolean })[]
		}[]
	}
	vite: {
		clearScreen: boolean
		envPrefix: string[]
		server: {
			strictPort: boolean
			hmr: { protocol: string, host: string, port: number }
			watch: { ignored: string[] }
		}
	}
	devServer: { host: string }
	eslint: { config: { standalone: boolean } }
	experimental: { typedPages: boolean }
	future: { compatibilityVersion: number }
	compatibilityDate: string
}) {
	return config;
}
