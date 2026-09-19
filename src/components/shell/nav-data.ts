/**
 * PLACEHOLDER navigation data for the shell.
 * Step 3 replaces this with the real mock dataset in /lib/mock.
 */

export type NavProject = {
  key: string;
  name: string;
  monogram: string;
};

export const navProjects: NavProject[] = [
  { key: "apo", name: "Apollo Platform", monogram: "AP" },
  { key: "atl", name: "Atlas Billing", monogram: "AT" },
  { key: "hel", name: "Helios Mobile", monogram: "HE" },
  { key: "orb", name: "Orbit Data", monogram: "OR" },
  { key: "ver", name: "Vertex Design", monogram: "VE" },
];

export const currentUser = {
  name: "Rishabh Jain",
  initials: "RJ",
  email: "claudeprojr@gmail.com",
};
