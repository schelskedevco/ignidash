import { v } from 'convex/values';
import { RateLimiter, HOUR } from '@convex-dev/rate-limiter';
import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { requireActionCtx } from '@convex-dev/better-auth/utils';
import { Resend } from '@convex-dev/resend';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { getJwtToken } from 'better-auth/plugins';
import { fetchMutation } from 'convex/nextjs';
import { polar, checkout, portal, usage } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';

import { components, api } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import authSchema from './betterAuth/schema';

const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
});
export const resend = new Resend(components.resend, { testMode: false });

const rateLimiter = new RateLimiter(components.rateLimiter, {
  passwordReset: { kind: 'fixed window', rate: 3, period: 3 * HOUR },
  emailChange: { kind: 'fixed window', rate: 3, period: 3 * HOUR },
  emailVerification: { kind: 'fixed window', rate: 3, period: 3 * HOUR },
  deleteAccount: { kind: 'fixed window', rate: 3, period: 3 * HOUR },
});

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

export const createAuth = (ctx: GenericCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
        strategy: 'jwt',
        refreshCache: true,
      },
    },
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        const { ok } = await rateLimiter.limit(requireActionCtx(ctx), 'passwordReset', { key: user.id });
        if (!ok) throw new APIError('TOO_MANY_REQUESTS', { message: 'Too many password reset requests. Please try again later.' });

        await resend.sendEmail(requireActionCtx(ctx), {
          from: 'Ignidash <noreply@mail.ignidash.com>',
          to: user.email,
          subject: 'Reset your password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                Hi there,
              </p>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset the password for your Ignidash account. If you made this request, click the button below to create a new password.
              </p>
              <p style="margin: 30px 0; text-align: center;">
                <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Reset password</a>
              </p>
            </div>
          `,
        });
      },
      onPasswordReset: async ({ user }, request) => {
        console.log(`Password for user ${user.email} has been reset.`);
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'user',
          input: false,
        },
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
          const { ok } = await rateLimiter.limit(requireActionCtx(ctx), 'emailChange', { key: user.id });
          if (!ok) throw new APIError('TOO_MANY_REQUESTS', { message: 'Too many email change requests. Please try again later.' });

          await resend.sendEmail(requireActionCtx(ctx), {
            from: 'Ignidash <noreply@mail.ignidash.com>',
            to: user.email,
            subject: 'Approve email change',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                  Hi there,
                </p>
                <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                  You've requested to change your email address to <strong>${newEmail}</strong>. To complete this change, please confirm by clicking the button below.
                </p>
                <p style="margin: 30px 0; text-align: center;">
                  <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Approve email change</a>
                </p>
              </div>
            `,
          });
        },
      },
      deleteUser: {
        enabled: true,
        sendDeleteAccountVerification: async ({ user, url, token }, request) => {
          const { ok } = await rateLimiter.limit(requireActionCtx(ctx), 'deleteAccount', { key: user.id });
          if (!ok) throw new APIError('TOO_MANY_REQUESTS', { message: 'Too many account deletion requests. Please try again later.' });

          await resend.sendEmail(requireActionCtx(ctx), {
            from: 'Ignidash <noreply@mail.ignidash.com>',
            to: user.email,
            subject: 'Account deletion request',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                  Hi there,
                </p>
                <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                  You've requested to delete your Ignidash account. We're sorry to see you go! To confirm this deletion, click the button below. Please note that this is irreversible.
                </p>
                <p style="margin: 30px 0; text-align: center;">
                  <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Delete my account</a>
                </p>
              </div>
            `,
          });
        },
        afterDelete: async (user, request) => {
          console.log(`User with email ${user.email} has deleted their account.`);

          try {
            await fetch(`${process.env.CONVEX_SITE_URL}/deleteUserData`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.CONVEX_API_SECRET}`,
              },
              body: JSON.stringify({ userId: user.id }),
            });
          } catch (error) {
            console.error('Error deleting user data from Convex:', error);
          }

          try {
            await polarClient.customers.deleteExternal({ externalId: user.id });
          } catch (error) {
            console.error('Error deleting Polar customer:', error);
          }
        },
      },
    },
    plugins: [
      convex(),
      polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        use: [
          checkout({
            products: [{ productId: process.env.POLAR_PRODUCT_ID!, slug: 'Ignidash-Pro' }],
            successUrl: `${siteUrl}/success?checkout_id={CHECKOUT_ID}`,
            authenticatedUsersOnly: true,
            returnUrl: `${siteUrl}/pricing`,
          }),
          portal({
            returnUrl: `${siteUrl}/settings`,
          }),
          usage(),
        ],
      }),
    ],
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const { ok } = await rateLimiter.limit(requireActionCtx(ctx), 'emailVerification', { key: user.id });
        if (!ok) throw new APIError('TOO_MANY_REQUESTS', { message: 'Too many email verification requests. Please try again later.' });

        await resend.sendEmail(requireActionCtx(ctx), {
          from: 'Ignidash <noreply@mail.ignidash.com>',
          to: user.email,
          subject: 'Verify your email address',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                Hi there,
              </p>
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                Thanks for signing up for Ignidash! To get started and access all features, please verify your email address by clicking the button below.
              </p>
              <p style="margin: 30px 0; text-align: center;">
                <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify email address</a>
              </p>
            </div>
          `,
        });
      },
      sendOnSignUp: true,
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        const newSession = ctx.context.newSession;
        if (!newSession) return;

        ctx.context.session = newSession;

        try {
          const token = await getJwtToken(ctx, { jwt: { issuer: process.env.CONVEX_SITE_URL!, audience: 'convex' } });
          await fetchMutation(api.plans.getOrCreateDefaultPlan, {}, { token });
        } catch (error) {
          console.error('Error creating default plan for new user:', error);
        }
      }),
    },
  });
};

export const getCurrentUserSafe = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.betterAuth.auth.getCurrentUserSafe, {});
  },
});

export const getIsAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    return await ctx.runQuery(components.betterAuth.auth.getIsAdmin, {});
  },
});

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
