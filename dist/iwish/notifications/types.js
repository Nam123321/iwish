"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPayloadSchema = void 0;
const zod_1 = require("zod");
exports.NotificationPayloadSchema = zod_1.z.object({
    templateName: zod_1.z.string().min(1, "Template name is required"),
    recipientId: zod_1.z.string().uuid("Invalid recipient ID"),
    variables: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
