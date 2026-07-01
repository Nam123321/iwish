import { z } from "zod";

export const NotificationPayloadSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  recipientId: z.string().uuid("Invalid recipient ID"),
  variables: z.record(z.string(), z.any()).optional(),
});

export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

export interface NotificationTemplate {
  id: string;
  name: string;
  category: "transactional" | "marketing";
  channel: "email" | "push" | "in_app" | "sms";
  provider: string;
  subject_template?: string;
  body_template: string;
  required_variables: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationLog {
  id: string;
  template_id: string;
  recipient_id: string;
  status: "pending" | "dispatched" | "failed" | "retrying";
  provider_response?: any;
  error_message?: string;
  retry_count: number;
  dispatched_at?: Date;
  created_at: Date;
  updated_at: Date;
}
