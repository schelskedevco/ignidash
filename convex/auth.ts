import { v } from 'convex/values';
import { RateLimiter, HOUR } from '@convex-dev/rate-limiter';
import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { requireActionCtx } from '@convex-dev/better-auth/utils';
import { Resend } from '@convex-dev/resend';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import type { BetterAuthPlugin } from 'better-auth';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';
import { APIError, createAuthMiddleware } from 'better-auth/api';

import { components, api } from './_generated/api';
import { DataModel } from './_generated/dataModel';
import { action, query } from './_generated/server';
import authSchema from './betterAuth/schema';
import authConfig from './auth.config';

const baseURL = process.env.SITE_URL ?? 'http://localhost:3000';

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

export const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : ({} as Stripe);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
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
    baseURL,
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
        console.log(`Password reset completed for user ${user.id}`);
      },
    },
    socialProviders: {
      ...(process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET && {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }),
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
          console.log(`Account deleted for user ${user.id}`);

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
        },
      },
    },
    plugins: [
      convex({ authConfig, jwksRotateOnTokenGenerationError: true, jwt: { expirationSeconds: 60 * 60 * 24 } }),
      process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.STRIPE_PRICE_ID &&
        stripe({
          stripeClient,
          stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          createCustomerOnSignUp: true,
          subscription: {
            enabled: true,
            plans: [
              {
                name: 'pro',
                priceId: process.env.STRIPE_PRICE_ID,
                freeTrial: {
                  days: 7,
                  onTrialStart: async (subscription) => {
                    try {
                      const customerId = subscription.stripeCustomerId;
                      if (!customerId) return;

                      const customer = await stripeClient.customers.retrieve(customerId);
                      if (customer.deleted || !customer.email) {
                        console.error('Customer deleted or email not found');
                        return;
                      }

                      await resend.sendEmail(requireActionCtx(ctx), {
                        from: 'Ignidash <noreply@mail.ignidash.com>',
                        to: customer.email,
                        subject: 'Your 7-day Pro trial has started!',
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                            Hi there,
                          </p>
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Welcome to Ignidash Pro! Your 7-day free trial has begun. You now have full access to AI chat and insights.
                          </p>
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Make the most of your trial by exploring all the Pro features. Your trial will automatically convert to a paid subscription after 7 days unless you cancel.
                          </p>
                          <p style="margin: 30px 0; text-align: center;">
                            <a href="${baseURL}/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Start Exploring</a>
                          </p>
                        </div>
                      `,
                      });
                    } catch (error) {
                      console.error('Error sending trial start email:', error);
                    }
                  },
                  onTrialEnd: async ({ subscription }, request) => {
                    try {
                      const customerId = subscription.stripeCustomerId;
                      if (!customerId) return;

                      const customer = await stripeClient.customers.retrieve(customerId);
                      if (customer.deleted || !customer.email) {
                        console.error('Customer deleted or email not found');
                        return;
                      }

                      await resend.sendEmail(requireActionCtx(ctx), {
                        from: 'Ignidash <noreply@mail.ignidash.com>',
                        to: customer.email,
                        subject: 'Your Pro subscription is now active!',
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                            Hi there,
                          </p>
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Your free trial has ended and your Ignidash Pro subscription is now active. Thank you for choosing to continue with us!
                          </p>
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                            You'll continue to enjoy full access to AI chat and insights. If you have any questions, we're here to help.
                          </p>
                          <p style="margin: 30px 0; text-align: center;">
                            <a href="${baseURL}/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
                          </p>
                        </div>
                      `,
                      });
                    } catch (error) {
                      console.error('Error sending trial end email:', error);
                    }
                  },
                  onTrialExpired: async (subscription, request) => {
                    try {
                      const customerId = subscription.stripeCustomerId;
                      if (!customerId) return;

                      const customer = await stripeClient.customers.retrieve(customerId);
                      if (customer.deleted || !customer.email) {
                        console.error('Customer deleted or email not found');
                        return;
                      }

                      await resend.sendEmail(requireActionCtx(ctx), {
                        from: 'Ignidash <noreply@mail.ignidash.com>',
                        to: customer.email,
                        subject: 'Your Pro trial has expired',
                        html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                            Hi there,
                          </p>
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Your 7-day Ignidash Pro trial has expired. You've been moved to the free plan and no longer have access to AI chat and insights.
                          </p>
                          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Ready to unlock Pro features again? Subscribe now to regain full access.
                          </p>
                          <p style="margin: 30px 0; text-align: center;">
                            <a href="${baseURL}/pricing" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Subscribe to Pro</a>
                          </p>
                        </div>
                      `,
                      });
                    } catch (error) {
                      console.error('Error sending trial expired email:', error);
                    }
                  },
                },
              },
            ],
            getCheckoutSessionParams: async ({ user, session, plan, subscription }, ctx) => {
              return {
                params: {
                  allow_promotion_codes: true,
                },
              };
            },
          },
          onEvent: async (event) => {
            switch (event.type) {
              case 'checkout.session.completed': {
                const checkoutSession = event.data.object;
                const customerEmail = checkoutSession.customer_details?.email;

                if (checkoutSession.mode !== 'subscription' || !customerEmail) {
                  console.error('Skipping email: not a subscription or no email found');
                  return;
                }

                await resend.sendEmail(requireActionCtx(ctx), {
                  from: 'Ignidash <noreply@mail.ignidash.com>',
                  to: customerEmail,
                  subject: 'Welcome to Ignidash Pro!',
                  html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                      Hi there,
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                      Thanks for subscribing to Ignidash Pro! You now have full access to AI chat and insights.
                    </p>
                    <p style="margin: 30px 0; text-align: center;">
                      <a href="${baseURL}/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
                    </p>
                  </div>
                `,
                });
                break;
              }
              case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const cancelAt = subscription.cancel_at;
                if (!cancelAt) return;

                const customerId = subscription.customer.toString();
                const customer = await stripeClient.customers.retrieve(customerId);

                if (customer.deleted || !customer.email) {
                  console.error('Customer deleted or email not found');
                  return;
                }

                const cancelDate = new Date(cancelAt * 1000).toLocaleDateString();

                await resend.sendEmail(requireActionCtx(ctx), {
                  from: 'Ignidash <noreply@mail.ignidash.com>',
                  to: customer.email,
                  subject: 'Your subscription has been canceled',
                  html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                      Hi there,
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                      Your Ignidash Pro subscription has been canceled. You'll continue to have access to Pro features until ${cancelDate}.
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                      Changed your mind? You can resubscribe anytime from your account settings.
                    </p>
                    <p style="margin: 30px 0; text-align: center;">
                      <a href="${baseURL}/settings" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Resubscribe</a>
                    </p>
                  </div>
                `,
                });
                break;
              }
              case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer.toString();
                const customer = await stripeClient.customers.retrieve(customerId);

                if (customer.deleted || !customer.email) {
                  console.error('Customer deleted or email not found');
                  return;
                }

                await resend.sendEmail(requireActionCtx(ctx), {
                  from: 'Ignidash <noreply@mail.ignidash.com>',
                  to: customer.email,
                  subject: 'Your Pro access has ended',
                  html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 10px;">
                      Hi there,
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                      Your Ignidash Pro subscription has ended. You've been moved to the free plan and no longer have access to AI chat and insights.
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                      We'd love to have you back! Resubscribe anytime to regain full access.
                    </p>
                    <p style="margin: 30px 0; text-align: center;">
                      <a href="${baseURL}/pricing" style="display: inline-block; padding: 14px 28px; background-color: #f43f5e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Resubscribe</a>
                    </p>
                  </div>
                `,
                });
                break;
              }
            }
          },
        }),
    ].filter(Boolean) as BetterAuthPlugin[],
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

        const userId = newSession.user.id;
        const method = ctx.path.includes('email') ? 'email' : 'google';
        const email = newSession.user.email;
        const name = newSession.user.name;

        try {
          if (ctx.path.startsWith('/sign-up')) {
            await fetch(`${process.env.CONVEX_SITE_URL}/captureSignUp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.CONVEX_API_SECRET}`,
              },
              body: JSON.stringify({ userId, method, email, name }),
            });
          }

          if (ctx.path.startsWith('/sign-in')) {
            await fetch(`${process.env.CONVEX_SITE_URL}/captureSignIn`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.CONVEX_API_SECRET}`,
              },
              body: JSON.stringify({ userId, method }),
            });
          }
        } catch (error) {
          console.error('Error capturing sign up or sign in event:', error);
        }

        ctx.context.session = newSession;

        try {
          await fetch(`${process.env.CONVEX_SITE_URL}/createDefaultPlan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.CONVEX_API_SECRET}`,
            },
            body: JSON.stringify({
              userId: newSession.user.id,
              userName: newSession.user.name,
            }),
          });
        } catch (error) {
          console.error('Error creating default plan for new user:', error);
        }
      }),
    },
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

export const getCurrentUserSafe = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.betterAuth.auth_data.getCurrentUserSafe, {});
  },
});

export const listSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(components.betterAuth.auth_data.listSubscriptions, {});
  },
});

export const getCanUseAIFeatures = query({
  args: {},
  returns: v.object({
    canUseAIFeatures: v.boolean(),
    isAdmin: v.boolean(),
    isActiveSubscription: v.boolean(),
  }),
  handler: async (ctx): Promise<{ canUseAIFeatures: boolean; isAdmin: boolean; isActiveSubscription: boolean }> => {
    return await ctx.runQuery(components.betterAuth.auth_data.getCanUseAIFeatures, {});
  },
});

export const getStripeSubscription = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, { subscriptionId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;

    const subscriptions = await ctx.runQuery(api.auth.listSubscriptions, {});
    if (!subscriptions?.some((subscription) => subscription.stripeSubscriptionId === subscriptionId)) return null;

    return await stripeClient.subscriptions.retrieve(subscriptionId);
  },
});

export const getActiveStripeSubscription = action({
  args: {},
  handler: async (ctx): Promise<Stripe.Subscription | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;

    const subscriptions = await ctx.runQuery(api.auth.listSubscriptions, {});
    const activeSubscriptionId = subscriptions?.find(
      (subscription) => subscription.status === 'active' || subscription.status === 'trialing'
    )?.stripeSubscriptionId;
    if (!activeSubscriptionId) return null;

    return await stripeClient.subscriptions.retrieve(activeSubscriptionId);
  },
});

export const getHasActiveSubscription = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return false;

    const subscriptions = await ctx.runQuery(api.auth.listSubscriptions, {});
    return subscriptions?.some((subscription) => subscription.status === 'active' || subscription.status === 'trialing') ?? false;
  },
});

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth['$Infer']['Session'];
