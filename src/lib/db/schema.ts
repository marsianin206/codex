import { pgTable, text, timestamp, uuid, varchar, integer, uniqueIndex, index, check, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  name: text('name'),
  email: text('email').unique().notNull(),
  image: text('image'),
  bio: text('bio').default('').notNull(),
  website: text('website'),
  location: text('location'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    usernameIdx: uniqueIndex('idx_users_username').on(table.username),
    emailIdx: uniqueIndex('idx_users_email').on(table.email),
  };
});

export const usersRelations = relations(users, ({ many }) => ({
  snippets: many(snippets),
  stars: many(stars),
  forks: many(forks),
  comments: many(comments),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const snippets = pgTable('snippets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull(),
  description: text('description'),
  visibility: varchar('visibility', { length: 20 }).notNull().default('public'),
  language: varchar('language', { length: 50 }).notNull().default('plain'),
  size: integer('size').notNull().default(0),
  forkCount: integer('fork_count').notNull().default(0),
  starCount: integer('star_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('idx_snippets_user_id').on(table.userId),
    languageIdx: index('idx_snippets_language').on(table.language),
    visibilityIdx: index('idx_snippets_visibility').on(table.visibility),
    updatedAtIdx: index('idx_snippets_updated_at').on(table.updatedAt),
    userSlugUnique: uniqueIndex('idx_snippets_user_slug').on(table.userId, table.slug),
  };
});

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  user: one(users, {
    fields: [snippets.userId],
    references: [users.id],
  }),
  revisions: many(revisions),
  stars: many(stars),
  forks: many(forks),
  comments: many(comments),
  tags: many(snippetTags),
}));

export type Snippet = typeof snippets.$inferSelect;
export type NewSnippet = typeof snippets.$inferInsert;

export const revisions = pgTable('revisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  snippetId: uuid('snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content'),
  blobUrl: text('blob_url'),
  size: integer('size').notNull(),
  commitMessage: text('commit_message').default('Update').notNull(),
  commitHash: varchar('commit_hash', { length: 40 }).notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    snippetIdIdx: index('idx_revisions_snippet_id').on(table.snippetId),
    versionUnique: uniqueIndex('idx_revisions_version').on(table.snippetId, table.version),
  };
});

export const revisionsRelations = relations(revisions, ({ one }) => ({
  snippet: one(snippets, {
    fields: [revisions.snippetId],
    references: [snippets.id],
  }),
  author: one(users, {
    fields: [revisions.authorId],
    references: [users.id],
  }),
}));

export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;

export const stars = pgTable('stars', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  snippetId: uuid('snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: { primary: true, columns: [table.userId, table.snippetId] },
  };
});

export const starsRelations = relations(stars, ({ one }) => ({
  user: one(users, { fields: [stars.userId], references: [users.id] }),
  snippet: one(snippets, { fields: [stars.snippetId], references: [snippets.id] }),
}));

export type Star = typeof stars.$inferSelect;

export const forks = pgTable('forks', {
  id: uuid('id').defaultRandom().primaryKey(),
  originalSnippetId: uuid('original_snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  forkedSnippetId: uuid('forked_snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userOriginalUnique: uniqueIndex('idx_forks_user_original').on(table.userId, table.originalSnippetId),
  };
});

export const forksRelations = relations(forks, ({ one }) => ({
  original: one(snippets, { fields: [forks.originalSnippetId], references: [snippets.id] }),
  forked: one(snippets, { fields: [forks.forkedSnippetId], references: [snippets.id] }),
  user: one(users, { fields: [forks.userId], references: [users.id] }),
}));

export type Fork = typeof forks.$inferSelect;

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  snippetId: uuid('snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  lineNumber: integer('line_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    snippetIdIdx: index('idx_comments_snippet_id').on(table.snippetId),
  };
});

export const commentsRelations = relations(comments, ({ one }) => ({
  snippet: one(snippets, { fields: [comments.snippetId], references: [snippets.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export type Comment = typeof comments.$inferSelect;

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  usageCount: integer('usage_count').notNull().default(0),
}, (table) => {
  return {
    nameIdx: uniqueIndex('idx_tags_name').on(table.name),
    slugIdx: uniqueIndex('idx_tags_slug').on(table.slug),
  };
});

export const tagsRelations = relations(tags, ({ many }) => ({
  snippets: many(snippetTags),
}));

export type Tag = typeof tags.$inferSelect;

export const snippetTags = pgTable('snippet_tags', {
  snippetId: uuid('snippet_id').notNull().references(() => snippets.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: { primary: true, columns: [table.snippetId, table.tagId] },
  };
});

export const snippetTagsRelations = relations(snippetTags, ({ one }) => ({
  snippet: one(snippets, { fields: [snippetTags.snippetId], references: [snippets.id] }),
  tag: one(tags, { fields: [snippetTags.tagId], references: [tags.id] }),
}));

export type SnippetTag = typeof snippetTags.$inferSelect;

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  key: text('key').notNull(),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('idx_api_keys_user_id').on(table.userId),
  };
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;