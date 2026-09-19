import type { User } from "./types";

/** The person using the prototype. */
export const CURRENT_USER_ID = "u-1";

export const users: User[] = [
  {
    id: "u-1",
    name: "Rishabh Jain",
    initials: "RJ",
    email: "rishabh@uni.example",
    role: "Product Engineer",
    tone: 3,
  },
  {
    id: "u-2",
    name: "Mara Lindqvist",
    initials: "ML",
    email: "mara@uni.example",
    role: "Staff Engineer",
    tone: 0,
  },
  {
    id: "u-3",
    name: "Daniel Okonkwo",
    initials: "DO",
    email: "daniel@uni.example",
    role: "Engineering Manager",
    tone: 1,
  },
  {
    id: "u-4",
    name: "Priya Raghavan",
    initials: "PR",
    email: "priya@uni.example",
    role: "Design Lead",
    tone: 2,
  },
  {
    id: "u-5",
    name: "Tomás Ferreira",
    initials: "TF",
    email: "tomas@uni.example",
    role: "Backend Engineer",
    tone: 0,
  },
  {
    id: "u-6",
    name: "Yuki Tanaka",
    initials: "YT",
    email: "yuki@uni.example",
    role: "Mobile Engineer",
    tone: 1,
  },
  {
    id: "u-7",
    name: "Nadia Haddad",
    initials: "NH",
    email: "nadia@uni.example",
    role: "Data Engineer",
    tone: 2,
  },
  {
    id: "u-8",
    name: "Owen Bright",
    initials: "OB",
    email: "owen@uni.example",
    role: "QA Engineer",
    tone: 3,
  },
];

export const usersById = new Map(users.map((user) => [user.id, user]));

export function getUser(id: string | null | undefined) {
  return id ? usersById.get(id) : undefined;
}
