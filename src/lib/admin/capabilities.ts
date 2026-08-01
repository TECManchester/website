/**
 * The permission catalogue.
 *
 * One entry per thing a person can be allowed to do, grouped and written in
 * plain English — the people assigning these are volunteers, not engineers, so
 * "Read prayer requests" beats `submissions.prayer.view` in the UI.
 *
 * Adding a capability here makes it appear in the role editor automatically.
 * The string must match what `can()` is called with in the code.
 */

export type Capability = {
  key: string;
  label: string;
  description: string;
  /** Marks permissions that expose personal or pastoral data. */
  sensitive?: boolean;
};

export type CapabilityGroup = {
  key: string;
  label: string;
  description: string;
  capabilities: Capability[];
};

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    key: "pages",
    label: "Pages",
    description: "The pages of the website and their content.",
    capabilities: [
      { key: "pages.view", label: "See the Pages tab", description: "View the list of pages." },
      { key: "pages.create", label: "Create new pages", description: "Add a page to the site." },
      { key: "pages.edit", label: "Edit page content", description: "Change what a page says." },
      { key: "pages.publish", label: "Publish pages", description: "Make a page live, or take it down." },
      { key: "pages.delete", label: "Delete pages", description: "Permanently remove a page." },
    ],
  },
  {
    key: "events",
    label: "Events",
    description: "What's on, and the events shown on the site.",
    capabilities: [
      { key: "events.view", label: "See the Events tab", description: "View the events list." },
      { key: "events.manage", label: "Add and edit events", description: "Create, change and remove events." },
    ],
  },
  {
    key: "media",
    label: "Photos",
    description: "The image library used across the site.",
    capabilities: [
      { key: "media.view", label: "See the Photos tab", description: "Browse uploaded images." },
      { key: "media.upload", label: "Upload photos", description: "Add new images to the library." },
      { key: "media.delete", label: "Delete photos", description: "Remove images permanently." },
    ],
  },
  {
    key: "announcements",
    label: "Announcements",
    description: "The pop-up notices shown to visitors.",
    capabilities: [
      {
        key: "announcements.manage",
        label: "Manage announcements",
        description: "Create and schedule pop-up notices.",
      },
    ],
  },
  {
    key: "settings",
    label: "Church details",
    description: "Address, service times, contact details and social links.",
    capabilities: [
      {
        key: "settings.edit",
        label: "Edit church details",
        description: "Change the address, service times and contact information shown across the site.",
      },
    ],
  },
  {
    key: "submissions",
    label: "Submissions",
    description: "What people send through the website. Handle with care.",
    capabilities: [
      {
        key: "submissions.contact.view",
        label: "Read contact messages",
        description: "General enquiries and newsletter sign-ups.",
      },
      {
        key: "submissions.prayer.view",
        label: "Read prayer requests",
        description: "Pastoral and confidential. Only give this to the prayer team.",
        sensitive: true,
      },
      {
        key: "submissions.giftaid.view",
        label: "Read Gift Aid declarations",
        description: "Names, home addresses and tax declarations. Finance only.",
        sensitive: true,
      },
    ],
  },
  {
    key: "people",
    label: "People and permissions",
    description: "Who can get in, and what they're allowed to do.",
    capabilities: [
      {
        key: "users.invite",
        label: "Invite people",
        description: "Send and cancel invitations to join the admin.",
        sensitive: true,
      },
      {
        key: "users.approve",
        label: "Approve and manage people",
        description: "Approve, suspend and assign roles to people.",
        sensitive: true,
      },
      {
        key: "roles.manage",
        label: "Create and edit roles",
        description: "Change what each role is allowed to do. Very powerful.",
        sensitive: true,
      },
      {
        key: "audit.view",
        label: "See the activity log",
        description: "View a record of who changed what, and when.",
      },
    ],
  },
];

export const ALL_CAPABILITIES: Capability[] = CAPABILITY_GROUPS.flatMap(
  (group) => group.capabilities,
);

const BY_KEY = new Map(ALL_CAPABILITIES.map((c) => [c.key, c]));

export const capabilityLabel = (key: string): string =>
  BY_KEY.get(key)?.label ?? key;

export const isKnownCapability = (key: string): boolean => BY_KEY.has(key);

/**
 * Capabilities that let a person widen their own or someone else's access.
 * Kept together so the UI can warn before handing them out.
 */
export const ESCALATING_CAPABILITIES = new Set([
  "users.invite",
  "users.approve",
  "roles.manage",
]);

/** Human summary of a capability list, for the people table. */
export function describeCapabilities(capabilities: string[]): string {
  if (capabilities.includes("all")) return "Everything";
  if (capabilities.length === 0) return "No access yet";
  const groups = CAPABILITY_GROUPS.filter((g) =>
    g.capabilities.some((c) => capabilities.includes(c.key)),
  ).map((g) => g.label);
  return groups.join(", ") || "No access yet";
}
