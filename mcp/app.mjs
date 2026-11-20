import * as z from 'zod/v4';

export const app = "comic-translation";
export const prefix = "comictranslate";
export const port = 45936;
export const operation = "process_page";
export const description = "Run extract, render_original, or refine against the selected page and current UI settings. Inspect extracted translations before requesting image generation.";
export const input = z.object({ action: z.enum(["extract", "render_original", "refine"]) }).strict();
export const output = z.discriminatedUnion("kind", [z.object({ kind: z.literal("translations"), targetLanguage: z.string().min(1).max(40), rows: z.array(z.object({ original: z.string().max(5000), translated: z.string().max(5000) }).strict()).max(300) }).strict(), z.object({ kind: z.literal("image"), model: z.string().max(200), imageData: z.string().min(1).max(25_000_000) }).strict()]);
