import { randomUUID } from "node:crypto";
import type { Application, Request, Response } from "express";
import { dbAll, dbGet, dbRun } from "../db/client.js";
import { getLiveHostInstanceId, getNetworkSessions } from "../ws/handler.js";
import { defaultProjectData } from "../../shared/defaultProjectData.js";

export function registerProjectRoutes(app: Application) {
	app.get("/api/health", (_req: Request, res: Response) => {
		res.json({ ok: true, timestamp: new Date().toISOString() });
	});

	app.get("/api/projects", (_req: Request, res: Response) => {
		const projects = dbAll(`
			SELECT p.id, p.name, p.updated_at, p.created_at
			FROM projects p
			ORDER BY p.updated_at DESC
			LIMIT 50
		`) as Array<{
			id: string;
			name: string;
			updated_at: string;
			created_at: string;
		}>;

		const activeSessions = getNetworkSessions();
		const countByProject = new Map<string, number>();
		const hostByProject = new Set<string>();

		for (const session of activeSessions) {
			countByProject.set(
				session.project_id,
				(countByProject.get(session.project_id) ?? 0) + 1
			);
			if (session.role === "host") {
				hostByProject.add(session.project_id);
			}
		}

		res.json(projects.map(project => ({
			...project,
			host_role: hostByProject.has(project.id) ? "host" : null,
			session_count: countByProject.get(project.id) ?? 0
		})));
	});

	app.post("/api/projects", (req: Request, res: Response) => {
		const id = randomUUID();
		const name = typeof req.body?.name === "string" && req.body.name.trim()
			? req.body.name.trim()
			: `Projekt ${new Date().toLocaleDateString("de-DE")}`;
		const data = req.body?.data ?? defaultProjectData;

		dbRun(`
			INSERT INTO projects (id, name, data, updated_at, created_at)
			VALUES (?, ?, ?, datetime('now'), datetime('now'))
		`, [id, name, JSON.stringify(data)]);

		const project = dbGet(`SELECT * FROM projects WHERE id = ?`, [id]);
		res.status(201).json(project);
	});

	app.get("/api/projects/:id", (req: Request, res: Response) => {
		const project = dbGet(`SELECT * FROM projects WHERE id = ?`, [req.params.id]);
		if (!project) {
			res.status(404).json({ error: "Project not found" });
			return;
		}
		res.json(project);
	});

	app.patch("/api/projects/:id", (req: Request, res: Response) => {
		const existing = dbGet<{ id: string; name: string; data: string }>(
			`SELECT * FROM projects WHERE id = ?`,
			[req.params.id]
		);

		if (!existing) {
			res.status(404).json({ error: "Project not found" });
			return;
		}

		const instanceId = req.headers["x-instance-id"] as string | undefined;
		if (instanceId) {
			const hostSession = dbGet(
				`SELECT * FROM sessions WHERE project_id = ? AND role = 'host' AND instance_id = ?`,
				[req.params.id, instanceId]
			);
			if (!hostSession) {
				res.status(403).json({ error: "Only the host can save this project" });
				return;
			}
		}

		const name = typeof req.body?.name === "string" ? req.body.name.trim() : existing.name;
		const data = req.body?.data !== undefined ? req.body.data : JSON.parse(existing.data);

		dbRun(`
			UPDATE projects SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ?
		`, [name, JSON.stringify(data), req.params.id]);

		const project = dbGet(`SELECT * FROM projects WHERE id = ?`, [req.params.id]);
		res.json(project);
	});

	app.delete("/api/projects/:id", (req: Request, res: Response) => {
		const result = dbRun(`DELETE FROM projects WHERE id = ?`, [req.params.id]);
		if (result.changes === 0) {
			res.status(404).json({ error: "Project not found" });
			return;
		}
		res.status(204).send();
	});

	app.post("/api/projects/:id/open", (req: Request, res: Response) => {
		const projectId = req.params.id;
		const instanceId = req.body?.instanceId as string | undefined;
		const instanceName = (req.body?.instanceName as string | undefined) ?? instanceId;
		const requestedRole = req.body?.requestedRole as "host" | "client" | undefined;

		if (!instanceId) {
			res.status(400).json({ error: "instanceId is required" });
			return;
		}

		const project = dbGet(`SELECT * FROM projects WHERE id = ?`, [projectId]);
		if (!project) {
			res.status(404).json({ error: "Project not found" });
			return;
		}

		dbRun(`
			INSERT INTO instances (id, name, last_seen)
			VALUES (?, ?, datetime('now'))
			ON CONFLICT(id) DO UPDATE SET name = excluded.name, last_seen = datetime('now')
		`, [instanceId, instanceName ?? instanceId]);

		dbRun(`DELETE FROM sessions WHERE instance_id = ?`, [instanceId]);

		const liveHostInstanceId = getLiveHostInstanceId(projectId);
		if (!liveHostInstanceId) {
			dbRun(`DELETE FROM sessions WHERE project_id = ? AND role = 'host'`, [projectId]);
		}

		let role: "host" | "client";

		if (requestedRole === "client") {
			role = "client";
		} else if (requestedRole === "host") {
			if (liveHostInstanceId && liveHostInstanceId !== instanceId) {
				const hostInstance = dbGet<{ name: string }>(
					`SELECT name FROM instances WHERE id = ?`,
					[liveHostInstanceId]
				);
				res.status(409).json({
					error: "Host already exists for this project",
					canJoinAsClient: true,
					existingHost: hostInstance?.name ?? liveHostInstanceId
				});
				return;
			}
			role = "host";
		} else {
			role = liveHostInstanceId && liveHostInstanceId !== instanceId ? "client" : "host";
		}

		if (role === "host") {
			dbRun(`DELETE FROM sessions WHERE project_id = ? AND role = 'host'`, [projectId]);
		}

		const sessionId = randomUUID();
		dbRun(`
			INSERT INTO sessions (id, project_id, instance_id, role, opened_at)
			VALUES (?, ?, ?, ?, datetime('now'))
		`, [sessionId, projectId, instanceId, role]);

		res.json({
			projectId,
			sessionId,
			role,
			project,
			sessions: getNetworkSessions()
		});
	});
}
