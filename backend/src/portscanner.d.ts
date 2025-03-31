declare module "portscanner" {
	export function checkPortStatus(
		port: number,
		host: string,
		callback: (error: Error | null, status: "open" | "closed") => void
	): void;

	export function findAPortNotInUse(
		ports: number[],
		host: string,
		callback: (error: Error | null, port: number) => void
	): void;
}
