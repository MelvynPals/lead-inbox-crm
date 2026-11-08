export const services = ["cleaning", "repair", "consultation", "other"] as const;
export const categories = ["booking", "question", "complaint", "other"] as const;
export const urgencies = ["high", "normal", "low"] as const;
export const statuses = ["new", "contacted", "won", "lost"] as const;
export type LeadInput = { name: string; email: string; phone: string; service: typeof services[number]; message: string };
export type Sorting = { category: typeof categories[number]; urgency: typeof urgencies[number] };
export type Lead = LeadInput & Sorting & { id: number; status: typeof statuses[number]; note: string; created_at: string };
export type LeadPatch = { status?: Lead["status"]; note?: string };
