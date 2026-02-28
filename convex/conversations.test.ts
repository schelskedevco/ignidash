/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { basicTemplate } from './templates/basic';

const modules = import.meta.glob('./**/*.ts');

const TEST_USER = 'test-user-123';

function makePlan(overrides: Partial<typeof basicTemplate> & { name?: string } = {}) {
  return { ...basicTemplate, userId: TEST_USER, name: 'Test Plan', ...overrides };
}

describe('deleteConversation', () => {
  it('deletes conversation and all its messages', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const convId = await t.run(async (ctx) => {
      return ctx.db.insert('conversations', {
        userId: TEST_USER,
        planId,
        title: 'Test Conversation',
        updatedAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: convId,
        author: 'user',
        body: 'Hello',
        updatedAt: Date.now(),
      });
      await ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: convId,
        author: 'assistant',
        body: 'Hi there',
        updatedAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.conversations.deleteConversation, { conversationId: convId });

    await t.run(async (ctx) => {
      expect(await ctx.db.get(convId)).toBeNull();
      const msgs = await ctx.db
        .query('messages')
        .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', convId))
        .collect();
      expect(msgs).toHaveLength(0);
    });
  });

  it('does not affect other conversations or their messages', async () => {
    const t = convexTest(schema, modules);
    const planId = await t.run(async (ctx) => {
      return ctx.db.insert('plans', makePlan());
    });

    const conv1Id = await t.run(async (ctx) => {
      return ctx.db.insert('conversations', {
        userId: TEST_USER,
        planId,
        title: 'Conversation 1',
        updatedAt: Date.now(),
      });
    });
    const conv2Id = await t.run(async (ctx) => {
      return ctx.db.insert('conversations', {
        userId: TEST_USER,
        planId,
        title: 'Conversation 2',
        updatedAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: conv1Id,
        author: 'user',
        body: 'Delete me',
        updatedAt: Date.now(),
      });
      await ctx.db.insert('messages', {
        userId: TEST_USER,
        conversationId: conv2Id,
        author: 'user',
        body: 'Keep me',
        updatedAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({ subject: TEST_USER });
    await asUser.mutation(api.conversations.deleteConversation, { conversationId: conv1Id });

    await t.run(async (ctx) => {
      expect(await ctx.db.get(conv1Id)).toBeNull();
      expect(await ctx.db.get(conv2Id)).not.toBeNull();
      const remainingMsgs = await ctx.db
        .query('messages')
        .withIndex('by_conversationId_updatedAt', (q) => q.eq('conversationId', conv2Id))
        .collect();
      expect(remainingMsgs).toHaveLength(1);
      expect(remainingMsgs[0].body).toBe('Keep me');
    });
  });
});
