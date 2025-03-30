import { execSync } from "node:child_process";
import portscanner from "portscanner";
import readlineSync from "readline-sync";

async function isPortInUse(port: number): Promise<boolean> {
	return new Promise((resolve, reject) => {
		portscanner.checkPortStatus(port, "127.0.0.1", (error, status) => {
			if (error) {
				reject(error);
			} else {
				resolve(status === "open");
			}
		});
	});
}

async function getAvailablePort() {
	let port;
	while (true) {
		port = readlineSync.questionInt("Enter a port number: ");
		const inUse = await isPortInUse(port);
		if (inUse) {
			console.log(
				`Port ${port} is already in use. Please choose another port.`
			);
		} else {
			console.log(`Port ${port} is available.`);
			break;
		}
	}
	return port;
}

(async () => {
	const port = await getAvailablePort();
	try {
		execSync(`npx @hocuspocus/cli --port ${port} --sqlite`, {
			stdio: "inherit"
		});
	} catch (error) {
		console.error("Error executing Hocuspocus CLI:", error);
	}
})();
