import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `uoft-clubs_${name}`);

export const posts = createTable(
  "post",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }),
    createdById: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    createdByIdIdx: index("created_by_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  }),
);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  ownedClubs: many(clubsToOwners),
  collaboratedClubs: many(clubsToCollaborators),
}));

// Table for auth js
export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

// Table for auth js
export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

// Table for auth js
export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// Campus Enum
export const campusEnum = pgEnum("campus", [
  "scarborough",
  "st george",
  "mississauga",
]);

// Clubs
export const clubs = createTable("club", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  profileImage: varchar("profile_image", { length: 255 }),
  campus: campusEnum("campus"),
  description: text("description"),
});

export const clubsRelations = relations(clubs, ({ many }) => ({
  owners: many(clubsToOwners),
  collaborators: many(clubsToCollaborators),
  events: many(events),
  collaboratorInvites: many(collaboratorInvites),
}));

// Many-To-Many between user(owners) and clubs
export const clubsToOwners = createTable(
  "clubs_to_owners",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    clubId: varchar("club_id")
      .notNull()
      .references(() => clubs.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.clubId] }),
  }),
);
export const clubsToOwnersRelations = relations(clubsToOwners, ({ one }) => ({
  club: one(clubs, {
    fields: [clubsToOwners.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubsToOwners.userId],
    references: [users.id],
  }),
}));

// Many-To-Many between user(collaborators) and clubs
export const clubsToCollaborators = createTable(
  "clubs_to_collaborators",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    clubId: varchar("club_id")
      .notNull()
      .references(() => clubs.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.clubId] }),
  }),
);
export const clubsToCollaboratorsRelations = relations(
  clubsToCollaborators,
  ({ one }) => ({
    club: one(clubs, {
      fields: [clubsToCollaborators.clubId],
      references: [clubs.id],
    }),
    user: one(users, {
      fields: [clubsToCollaborators.userId],
      references: [users.id],
    }),
  }),
);

// Events
export const events = createTable("event", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  image: varchar("image", { length: 255 }),
  venue: varchar("venue", { length: 255 }),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
});
export const eventsRelations = relations(events, ({ one }) => ({
  club: one(clubs),
}));

// Collaborator Invites
export const collaboratorInvites = createTable("collaborator_invites", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
});
export const collaboratorInvitesRelations = relations(
  collaboratorInvites,
  ({ one }) => ({
    club: one(clubs),
  }),
);

// Owner Invites
export const ownerInvites = createTable("collaborator_invites", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  clubName: varchar("club_name", { length: 255 }),
});
