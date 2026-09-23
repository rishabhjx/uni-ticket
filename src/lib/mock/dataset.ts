import { generateDataset } from "./generate";

/**
 * Every other seeded dataset (chat, mail, meetings, files) needs to reference
 * real ticket keys so a message like "picking up APO-142" is something the
 * ticket panel can actually resolve and link back to. Computing the ticket
 * dataset once here, rather than in each file that needs it, means they all
 * see the same objects instead of independently regenerated near-duplicates.
 */
export const dataset = generateDataset();
