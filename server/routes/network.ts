import type { Application, Request, Response } from "express";
import { getNetworkSessions, kickSession } from "../ws/handler.js";

export function registerNetworkRoutes(app: Application) {
	app.get("/api/network/sessions", (_req: Request, res: Response) => {
		res.json(getNetworkSessions());
	});

	app.delete("/api/network/sessions/:id", (req: Request, res: Response) => {
		const ok = kickSession(req.params.id);
		if (!ok) {
			res.status(404).json({ error: "Session not found" });
			return;
		}
		res.status(204).send();
	});

	app.get("/api/discover", (req: Request, res: Response) => {
		res.json({
			name: "TeleCat",
			version: "1.0.0",
			host: req.hostname,
			timestamp: new Date().toISOString()
		});
	});
}
