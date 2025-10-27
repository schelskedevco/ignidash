import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { requireActionCtx } from '@convex-dev/better-auth/utils';
import { Resend } from '@convex-dev/resend';
import { betterAuth } from 'better-auth';

import { components } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { query } from './_generated/server';

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);
export const resend = new Resend(components.resend, { testMode: false });

export const createAuth = (ctx: GenericCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await resend.sendEmail(requireActionCtx(ctx), {
          from: 'Ignidash <noreply@mail.ignidash.com>',
          to: user.email,
          subject: 'Reset your password',
          text: `Click the link to reset your password: ${url}`,
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
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [convex()],
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await resend.sendEmail(requireActionCtx(ctx), {
          from: 'Ignidash <noreply@mail.ignidash.com>',
          to: user.email,
          subject: 'Verify your email address',
          text: `Click the link to verify your email: ${url}`,
        });
      },
      sendOnSignUp: true,
    },
  });
};

export const getCurrentUserSafe = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.safeGetAuthUser(ctx);
  },
});

export const getUserSettingsCapabilities = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) return { isSignedInWithSocialProvider: false, canChangeEmail: false, canChangePassword: false, canChangeName: false };

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
    const isSignedInWithSocialProvider = (await auth.api.listUserAccounts({ headers })).some(
      (account) => account.providerId !== 'credential'
    );

    return {
      isSignedInWithSocialProvider,
      canChangeEmail: !isSignedInWithSocialProvider,
      canChangePassword: !isSignedInWithSocialProvider,
      canChangeName: true,
    };
  },
});
