import {
  sqliteTable,
  integer,
  text,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('member'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  planName: text('plan_name'),
  subscriptionStatus: text('subscription_status'),
});

export const teamMembers = sqliteTable('team_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: text('role').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  ipAddress: text('ip_address'),
});

export const invitations = sqliteTable('invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: text('email').notNull(),
  role: text('role').notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: integer('invited_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  status: text('status').notNull().default('pending'),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  cardNumber: text('card_number').notNull(),
  cardHolderName: text('card_holder_name').notNull(),
  expiryDate: text('expiry_date').notNull(),
  cvv: text('cvv').notNull(),
  billingAddress: text('billing_address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  country: text('country').notNull(),
  planName: text('plan_name').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  payments: many(payments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  team: one(teams, {
    fields: [payments.teamId],
    references: [teams.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
