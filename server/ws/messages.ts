import { z } from "zod";

export const sessionJoinSchema = z.object({
	type: z.literal("session:join"),
	instanceId: z.string(),
	instanceName: z.string().optional(),
	projectId: z.string().optional(),
	role: z.enum(["host", "client", "control"]).optional(),
	userAgent: z.string().optional()
});

export const sessionLeaveSchema = z.object({
	type: z.literal("session:leave"),
	instanceId: z.string(),
	projectId: z.string().optional()
});

export const stateSyncSchema = z.object({
	type: z.literal("state:sync"),
	projectId: z.string(),
	instanceId: z.string(),
	payload: z.record(z.string(), z.unknown())
});

export const controlCommandSchema = z.object({
	type: z.literal("control:command"),
	projectId: z.string().optional(),
	targetInstanceId: z.string().optional(),
	command: z.enum([
		"play",
		"stop",
		"scrollUp",
		"scrollDown",
		"jumpStart",
		"jumpEnd",
		"toggleDirection"
	]),
	sendToAll: z.boolean().optional()
});

export const controlStyleSchema = z.object({
	type: z.literal("control:style"),
	projectId: z.string().optional(),
	targetInstanceId: z.string().optional(),
	sendToAll: z.boolean().optional(),
	payload: z.record(z.string(), z.unknown())
});

export const controlSwitchProjectSchema = z.object({
	type: z.literal("control:switchProject"),
	targetInstanceId: z.string(),
	projectId: z.string()
});

export const clientStateRequestSchema = z.object({
	type: z.literal("client:state:request"),
	targetInstanceId: z.string()
});

export const clientStateResponseSchema = z.object({
	type: z.literal("client:state:response"),
	instanceId: z.string(),
	projectId: z.string(),
	payload: z.record(z.string(), z.unknown())
});

export const clientsListRequestSchema = z.object({
	type: z.literal("clients:list"),
	projectId: z.string().optional()
});

export const wsMessageSchema = z.discriminatedUnion("type", [
	sessionJoinSchema,
	sessionLeaveSchema,
	stateSyncSchema,
	controlCommandSchema,
	controlStyleSchema,
	controlSwitchProjectSchema,
	clientStateRequestSchema,
	clientStateResponseSchema,
	clientsListRequestSchema
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;

export type ControlCommand = z.infer<typeof controlCommandSchema>["command"];
