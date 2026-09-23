import { dataset } from "./dataset";
import { isoDaysAgo } from "./dates";
import { projects } from "./projects";
import { createRandom } from "./random";
import type { MailFolder, MailMessage, MailThread } from "./types";
import { CURRENT_USER_ID, getUser, users } from "./users";

const SEED = 20260919 + 29;
const random = createRandom(SEED);

const EXTERNAL_CONTACTS = [
  { name: "Priyanka Shah", email: "priyanka.shah@northwindtraders.example" },
  { name: "Marcus Webb", email: "marcus@fabrikam.example" },
  { name: "Lena Brandt", email: "lena.brandt@contoso.example" },
  { name: "Diego Alonso", email: "diego@tailspintoys.example" },
  { name: "Aiko Sato", email: "aiko.sato@wideworldimporters.example" },
  { name: "Recruiting — Ada Lockhart", email: "ada.lockhart@talentpool.example" },
];

const SYSTEM_SENDER = { name: "UNI Tickets", email: "notifications@uni.example" };

function ticketMentionBody(key: string, title: string) {
  return random.pick([
    `Quick update on ${key} — "${title}" — it moved forward today. Let me know if you need anything from my side.`,
    `Following up on ${key}. Any timeline you can share for "${title}"?`,
    `${key} is on our radar. We saw the update on "${title}" come through and wanted to say thanks for the quick turnaround.`,
    `Re: ${key}. Attaching the extra detail you asked for on "${title}".`,
  ]);
}

const CUSTOMER_SUBJECTS = [
  "Following up on our last call",
  "Question about the rollout timeline",
  "Invoice for last month",
  "Access request for the new environment",
  "Thanks for the quick fix",
  "Can we get a status update?",
  "Feedback from our team after the demo",
];

const INTERNAL_SUBJECTS = [
  "Notes from today's planning",
  "Can you review before I send this out?",
  "Heads up on the release calendar",
  "Draft for the quarterly update",
  "Onboarding checklist for the new hire",
  "Access review — action needed",
  "Weekly summary",
];

function makeThread(
  id: string,
  subject: string,
  folder: MailFolder,
  opts: {
    externalParticipant?: { name: string; email: string } | null;
    participantIds?: string[];
    ticketRefs?: string[];
    daysAgo: number;
    read?: boolean;
    starred?: boolean;
    messages: { fromId: string | null; body: string; hoursAfter: number }[];
  },
): { thread: MailThread; messages: MailMessage[] } {
  const createdAt = isoDaysAgo(opts.daysAgo, random.int(8 * 60, 17 * 60));
  const messages: MailMessage[] = opts.messages.map((message, index) => ({
    id: `${id}-m${index + 1}`,
    threadId: id,
    fromId: message.fromId,
    toIds:
      message.fromId === CURRENT_USER_ID
        ? (opts.participantIds ?? []).filter((p) => p !== CURRENT_USER_ID)
        : [CURRENT_USER_ID],
    body: message.body,
    createdAt: new Date(
      Date.parse(createdAt) + message.hoursAfter * 36e5,
    ).toISOString(),
    attachments: [],
  }));

  const thread: MailThread = {
    id,
    subject,
    participantIds: opts.participantIds ?? [CURRENT_USER_ID],
    externalParticipant: opts.externalParticipant ?? null,
    folder,
    read: opts.read ?? true,
    starred: opts.starred ?? false,
    ticketRefs: opts.ticketRefs ?? [],
    createdAt,
    updatedAt: messages[messages.length - 1]?.createdAt ?? createdAt,
  };

  return { thread, messages };
}

const threadsAndMessages: { thread: MailThread; messages: MailMessage[] }[] = [];

// Ticket-activity notifications — the clearest example of another app in the
// workspace surfacing a ticket without anyone copy-pasting a link.
const notifiable = random.sample(
  dataset.tickets.filter((ticket) => ticket.assigneeIds.includes(CURRENT_USER_ID)),
  9,
);
notifiable.forEach((ticket, index) => {
  threadsAndMessages.push(
    makeThread(`mail-notif-${index}`, `[${ticket.key}] ${ticket.title}`, "inbox", {
      externalParticipant: SYSTEM_SENDER,
      participantIds: [CURRENT_USER_ID],
      ticketRefs: [ticket.key],
      daysAgo: random.int(0, 10),
      read: random.chance(0.55),
      messages: [
        {
          fromId: null,
          body: `${ticket.key} was updated: status changed. Open it in Tickets to see the full history.`,
          hoursAfter: 0,
        },
      ],
    }),
  );
});

// Customer / external threads, some referencing a real ticket.
EXTERNAL_CONTACTS.forEach((contact, index) => {
  const withTicket = random.chance(0.5);
  const ticket = withTicket ? random.pick(dataset.tickets) : null;
  const subject = ticket
    ? `Re: ${ticket.title}`
    : random.pick(CUSTOMER_SUBJECTS);
  const daysAgo = random.int(0, 20);
  const messageCount = random.int(1, 3);
  const messages: { fromId: string | null; body: string; hoursAfter: number }[] = [];
  for (let i = 0; i < messageCount; i += 1) {
    const fromExternal = i % 2 === 0;
    messages.push({
      fromId: fromExternal ? null : CURRENT_USER_ID,
      body: ticket
        ? ticketMentionBody(ticket.key, ticket.title)
        : random.pick(CUSTOMER_SUBJECTS),
      hoursAfter: i * random.int(3, 30),
    });
  }
  threadsAndMessages.push(
    makeThread(`mail-ext-${index}`, subject, "inbox", {
      externalParticipant: contact,
      participantIds: [CURRENT_USER_ID],
      ticketRefs: ticket ? [ticket.key] : [],
      daysAgo,
      read: random.chance(0.6),
      starred: random.chance(0.15),
      messages,
    }),
  );
});

// Internal threads with colleagues.
users
  .filter((user) => user.id !== CURRENT_USER_ID)
  .forEach((user, index) => {
    if (random.chance(0.4)) return;
    const subject = random.pick(INTERNAL_SUBJECTS);
    const daysAgo = random.int(0, 15);
    threadsAndMessages.push(
      makeThread(`mail-int-${index}`, subject, "inbox", {
        participantIds: [CURRENT_USER_ID, user.id],
        daysAgo,
        read: random.chance(0.65),
        messages: [
          {
            fromId: user.id,
            body: `Hey ${getUser(CURRENT_USER_ID)?.name.split(" ")[0]}, ${subject.toLowerCase()}. Let me know what you think.`,
            hoursAfter: 0,
          },
        ],
      }),
    );
  });

// Sent — things the current user actually wrote.
projects.slice(0, 3).forEach((project, index) => {
  threadsAndMessages.push(
    makeThread(
      `mail-sent-${index}`,
      `${project.name} — status for this week`,
      "sent",
      {
        participantIds: [CURRENT_USER_ID, project.leadId],
        daysAgo: random.int(2, 12),
        messages: [
          {
            fromId: CURRENT_USER_ID,
            body: `Quick status on ${project.name}: on track, nothing blocking. Full breakdown is in the board if you want the detail.`,
            hoursAfter: 0,
          },
        ],
      },
    ),
  );
});

// Drafts — unsent, so they only ever have one message from the current user.
threadsAndMessages.push(
  makeThread("mail-draft-0", "Draft: access review follow-up", "drafts", {
    participantIds: [CURRENT_USER_ID],
    daysAgo: 0,
    messages: [
      {
        fromId: CURRENT_USER_ID,
        body: "Hi team, following up on the access review from last week — ",
        hoursAfter: 0,
      },
    ],
  }),
);

// Archive — a few older, resolved threads.
threadsAndMessages.push(
  makeThread("mail-archive-0", "Resolved: onboarding checklist", "archive", {
    participantIds: [CURRENT_USER_ID, "u-3"],
    daysAgo: 40,
    read: true,
    messages: [
      { fromId: "u-3", body: "This is all set now, thanks for the help.", hoursAfter: 0 },
    ],
  }),
);

export const mailThreads: MailThread[] = threadsAndMessages
  .map((entry) => entry.thread)
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export const mailMessages: MailMessage[] = threadsAndMessages.flatMap(
  (entry) => entry.messages,
);

export const mailThreadsById = new Map(mailThreads.map((thread) => [thread.id, thread]));

export function getMailThread(id: string | null | undefined) {
  return id ? mailThreadsById.get(id) : undefined;
}

export function messagesForThread(threadId: string) {
  return mailMessages
    .filter((message) => message.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function threadsInFolder(folder: MailFolder) {
  return mailThreads.filter((thread) => thread.folder === folder);
}

export function unreadCountByFolder(folder: MailFolder = "inbox") {
  return mailThreads.filter((thread) => thread.folder === folder && !thread.read).length;
}

export function threadDisplayName(thread: MailThread) {
  if (thread.externalParticipant) return thread.externalParticipant.name;
  const other = thread.participantIds.find((id) => id !== CURRENT_USER_ID);
  return getUser(other)?.name ?? "You";
}

/** Mail threads that reference this ticket key, for the ticket panel. */
export function mailForTicket(ticketKey: string) {
  return mailThreads.filter((thread) => thread.ticketRefs.includes(ticketKey));
}
