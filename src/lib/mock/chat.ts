import { dataset } from "./dataset";
import { isoDaysAgo } from "./dates";
import { projects } from "./projects";
import { createRandom } from "./random";
import { REACTIONS, type Attachment, type ChatConversation, type ChatMessage } from "./types";
import { CURRENT_USER_ID, users } from "./users";

const SEED = 20260919 + 11;

const GENERIC_LINES = [
  "morning — standup in 10, same link",
  "anyone free to pair on this for half an hour?",
  "shipped it, watching the dashboards now",
  "can someone give my PR a look before EOD?",
  "heads up, staging's flaky again this morning",
  "nice catch on that regression 👀",
  "who's on call this week?",
  "the demo went well, thanks everyone for the last push",
  "pushed a hotfix, proper fix follows tomorrow",
  "anyone else seeing timeouts from the gateway?",
  "let's just call about this instead of typing walls of text",
  "🎉 that shipped without a single rollback",
  "reminder: planning moved to 2pm today",
  "I'll take the on-call handoff notes today",
  "can we bump this in priority? support's getting pinged about it",
  "looks good to me, one small nit on the PR",
  "quick sync in 5?",
  "recording's up if you missed the review",
  "who owns the billing webhook these days?",
  "back from lunch, catching up on the thread now",
  "that number looks off — can you double check the query?",
  "good spot, filing a ticket for it now",
  "friday deploy freeze starts at 4, get anything in before then",
  "the retro doc is open if you want to add anything async",
  "does anyone have context on why we did it this way originally?",
  "coffee run, want anything?",
  "congrats on shipping this — been a long few weeks",
  "customer flagged this again, escalating",
  "I think we're overthinking this one, simplest fix wins",
  "on it",
];

const THREAD_REPLIES = [
  "agreed, let's do that",
  "yeah I hit the same thing yesterday",
  "can confirm, reproduced it locally",
  "makes sense to me",
  "+1",
  "want me to take this one?",
  "I'll follow up once it's live",
  "good idea, didn't think of that",
  "same, seeing it on my end too",
  "thanks for digging into this",
  "let's revisit after the release",
  "sounds right, go for it",
];

const TICKET_MENTION_TEMPLATES = [
  (key: string) => `picking up ${key} now, will update the thread`,
  (key: string) => `${key} is ready for review whenever someone has a minute`,
  (key: string) => `just verified ${key} on staging — looks good`,
  (key: string) => `${key} might need to wait until after the freeze`,
  (key: string) => `raising priority on ${key}, support flagged it twice today`,
  (key: string) => `${key} is blocked on the API change, chasing that now`,
  (key: string) => `closing the loop: ${key} shipped this morning`,
];

const GREETING_DM = [
  "hey, got a sec?",
  "quick question about the ticket you filed",
  "thanks for the review earlier",
  "are you around later for a call?",
  "sent you the doc, let me know what you think",
  "can you take a look when you get a chance?",
];

export const chatConversations: ChatConversation[] = [
  ...projects.map(
    (project): ChatConversation => ({
      id: `chan-${project.slug}`,
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      topic: project.description,
      kind: "project",
      projectId: project.id,
      memberIds: project.memberIds,
    }),
  ),
  {
    id: "chan-general",
    name: "general",
    topic: "Whole-workspace announcements and chatter.",
    kind: "topic",
    projectId: null,
    memberIds: users.map((user) => user.id),
  },
  {
    id: "chan-incidents",
    name: "incidents",
    topic: "Anything paging, degraded, or on fire.",
    kind: "topic",
    projectId: null,
    memberIds: users.map((user) => user.id),
  },
  {
    id: "chan-random",
    name: "random",
    topic: "Not work. Mostly not work.",
    kind: "topic",
    projectId: null,
    memberIds: users.map((user) => user.id),
  },
  {
    id: "chan-eng-leads",
    name: "eng-leads",
    topic: "Cross-project coordination for leads and managers.",
    kind: "team",
    projectId: null,
    memberIds: ["u-1", "u-2", "u-3", "u-5", "u-6", "u-7"],
  },
  ...users
    .filter((user) => user.id !== CURRENT_USER_ID)
    .map(
      (user): ChatConversation => ({
        id: `dm-${[CURRENT_USER_ID, user.id].sort().join("-")}`,
        name: user.name,
        topic: "",
        kind: "dm",
        projectId: null,
        memberIds: [CURRENT_USER_ID, user.id],
      }),
    ),
];

export const chatConversationsById = new Map(
  chatConversations.map((conversation) => [conversation.id, conversation]),
);

export function getChatConversation(id: string | null | undefined) {
  return id ? chatConversationsById.get(id) : undefined;
}

/** Every conversation this person can see. */
export function chatConversationsForUser(userId: string = CURRENT_USER_ID) {
  return chatConversations.filter((conversation) =>
    conversation.memberIds.includes(userId),
  );
}

function ticketKeysForProject(projectId: string) {
  return dataset.tickets
    .filter((ticket) => ticket.projectId === projectId)
    .map((ticket) => ticket.key);
}

function generateMessagesFor(
  conversation: ChatConversation,
  random: ReturnType<typeof createRandom>,
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const pool =
    conversation.kind === "dm" ? GREETING_DM : GENERIC_LINES;
  const ticketKeys = conversation.projectId
    ? ticketKeysForProject(conversation.projectId)
    : [];

  const count =
    conversation.kind === "dm"
      ? random.int(0, 14)
      : conversation.kind === "project"
        ? random.int(22, 42)
        : conversation.kind === "team"
          ? random.int(10, 18)
          : random.int(12, 24);

  let seq = 0;
  const spanDays = conversation.kind === "dm" ? 30 : 21;

  for (let i = 0; i < count; i += 1) {
    seq += 1;
    const authorId = random.pick(conversation.memberIds);
    const daysAgo = spanDays - Math.floor((i / count) * spanDays) + random.int(0, 1);
    const minutesIntoDay = random.int(8 * 60, 19 * 60);

    const useTicketLine = ticketKeys.length > 0 && random.chance(0.16);
    const key = useTicketLine ? random.pick(ticketKeys) : null;
    const body = key
      ? random.pick(TICKET_MENTION_TEMPLATES)(key)
      : random.pick(pool);

    const id = `msg-${conversation.id}-${seq}`;
    const reactions: Record<string, string[]> = {};
    if (random.chance(0.22)) {
      const emoji = random.pick(REACTIONS);
      reactions[emoji] = random.sample(
        conversation.memberIds.filter((m) => m !== authorId),
        random.int(1, Math.min(3, conversation.memberIds.length - 1) || 1),
      );
    }

    const attachments: Attachment[] = [];

    messages.push({
      id,
      conversationId: conversation.id,
      authorId,
      body,
      createdAt: isoDaysAgo(Math.max(daysAgo, 0), minutesIntoDay),
      editedAt: null,
      parentId: null,
      reactions,
      attachments,
      ticketRefs: key ? [key] : [],
    });

    // A little under a third of top-level messages in a busy channel pick up
    // a short thread — enough to demonstrate replies without every message
    // growing one.
    if (conversation.kind !== "dm" && random.chance(0.28)) {
      const replyCount = random.int(1, 3);
      for (let r = 0; r < replyCount; r += 1) {
        seq += 1;
        const replyAuthor = random.pick(conversation.memberIds);
        messages.push({
          id: `msg-${conversation.id}-${seq}`,
          conversationId: conversation.id,
          authorId: replyAuthor,
          body: random.pick(THREAD_REPLIES),
          createdAt: isoDaysAgo(
            Math.max(daysAgo, 0),
            minutesIntoDay + (r + 1) * random.int(2, 40),
          ),
          editedAt: null,
          parentId: id,
          reactions: {},
          attachments: [],
          ticketRefs: [],
        });
      }
    }
  }

  return messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const chatMessages: ChatMessage[] = chatConversations.flatMap(
  (conversation, index) =>
    generateMessagesFor(conversation, createRandom(SEED + index)),
);

export function messagesForConversation(conversationId: string) {
  return chatMessages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function threadReplies(rootId: string) {
  return chatMessages
    .filter((message) => message.parentId === rootId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Top-level messages only — a channel view never renders replies inline. */
export function topLevelMessages(conversationId: string) {
  return messagesForConversation(conversationId).filter(
    (message) => message.parentId === null,
  );
}

export function lastMessageOf(conversationId: string) {
  const all = messagesForConversation(conversationId);
  return all.length > 0 ? all[all.length - 1] : undefined;
}

export function conversationName(
  conversation: ChatConversation,
  viewerId: string = CURRENT_USER_ID,
) {
  if (conversation.kind !== "dm") return conversation.name;
  const otherId = conversation.memberIds.find((id) => id !== viewerId);
  const other = users.find((user) => user.id === otherId);
  return other?.name ?? "Direct message";
}

/** The project channel for a ticket's project, if one exists. */
export function channelForTicket(projectId: string) {
  return chatConversations.find(
    (conversation) => conversation.kind === "project" && conversation.projectId === projectId,
  );
}

/** Messages anywhere in chat that mention this ticket key. */
export function messagesForTicket(ticketKey: string) {
  return chatMessages.filter((message) => message.ticketRefs.includes(ticketKey));
}

/**
 * Read state is a per-viewer, per-conversation "last seen" timestamp. A
 * prototype has one viewer, so this is seeded once rather than tracked per
 * user — conversations the seed leaves slightly behind "now" are what show
 * an unread badge on first load, the way a real workspace would after a
 * weekend away.
 */
export const seedLastReadAt: Record<string, string> = Object.fromEntries(
  chatConversationsForUser().map((conversation) => {
    const messages = messagesForConversation(conversation.id);
    if (messages.length === 0) return [conversation.id, isoDaysAgo(0)];
    const random = createRandom(SEED + 999 + conversation.id.length);
    // Roughly a third of conversations start with something unread.
    if (random.chance(0.35) && messages.length > 1) {
      const cutoff = messages[Math.max(0, messages.length - random.int(1, 4))];
      const idx = messages.indexOf(cutoff);
      return [conversation.id, idx > 0 ? messages[idx - 1].createdAt : isoDaysAgo(2)];
    }
    return [conversation.id, messages[messages.length - 1].createdAt];
  }),
);
