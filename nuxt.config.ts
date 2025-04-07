import packageJson from "./package.json" with { type: "json" };

export default defineNuxtConfig({
	devtools: {
		enabled: true // or false to disable
	},
	modules: [
		"@vueuse/nuxt",
		"nuxt-svgo",
		"@nuxt/eslint",
		"@pinia/nuxt",
		"@nuxtjs/device"
	],
	pinia: {
		storeDirs: ["@/stores/**"],
		debug: true
	},
	app: {
		baseURL: "/TeleCat/",
		buildAssetsDir: "assets",
		head: {
			title: "TeleCat",
			charset: "utf-8",
			viewport: "width=device-width, initial-scale=1",
			meta: [{ name: "format-detection", content: "no" }, { name: "description", content: "Open Source Telepromter App for you and your cat." }],
			link: [
				{ rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/favicon/apple-touch-icon.png" },
				{ rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/favicon-32x32.png" },
				{ rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon/favicon-16x16.png" },
				{ rel: "manifest", type: "application/manifest+json", sizes: "any", href: "/favicon/site.webmanifest" }

			]
		},
		// target: "static",
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
	compatibilityDate: "2025-02-01",
	runtimeConfig: {
		public: {
			appVersion: packageJson.version
		}
	}
});
