export default defineAppConfig({
	app: {
		name: "TeleCat",
		author: "Marcus Universe",
		tauriSite: "https://tauri.app",
		nuxtSite: "https://nuxt.com"
	},
	ui: {
		colors: {
			primary: "green",
			neutral: "zinc"
		},
		button: {
			slots: {
				base: "cursor-pointer"
			}
		},
		formField: {
			slots: {
				root: "w-full"
			}
		},
		input: {
			slots: {
				root: "w-full"
			}
		},
		textarea: {
			slots: {
				root: "w-full",
				base: "resize-none"
			}
		},
		accordion: {
			slots: {
				trigger: "cursor-pointer",
				item: "md:py-2"
			}
		},
		navigationMenu: {
			slots: {
				link: "cursor-pointer"
			},
			variants: {
				disabled: {
					true: {
						link: "cursor-text"
					}
				}
			}
		}
	}
});
function defineAppConfig(config: {
	app: {
		name: string
		author: string
		repo: string
		tauriSite: string
		nuxtSite: string
	}
	ui: {
		colors: {
			primary: string
			neutral: string
		}
		button: {
			slots: {
				base: string
			}
		}
		formField: {
			slots: {
				root: string
			}
		}
		input: {
			slots: {
				root: string
			}
		}
		textarea: {
			slots: {
				root: string
				base: string
			}
		}
		accordion: {
			slots: {
				trigger: string
				item: string
			}
		}
		navigationMenu: {
			slots: {
				link: string
			}
			variants: {
				disabled: {
					true: {
						link: string
					}
				}
			}
		}
	}
}) {
	return config;
}
