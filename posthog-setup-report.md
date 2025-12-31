# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into your Ignidash Next.js application. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (Next.js 15.3+ approach)
- **Server-side PostHog client** for backend event tracking
- **Reverse proxy configuration** in `next.config.ts` to avoid ad blockers
- **Environment variables** configured in `.env.local`
- **User identification** on sign-up and sign-in flows
- **Exception tracking** enabled globally with `capture_exceptions: true`
- **12 custom events** tracked across key user journeys

## Events Implemented

| Event Name                | Description                                   | File Path                                                                                  |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `user_signed_up`          | User completed email sign-up registration     | `src/app/(auth)/signup/sign-up-form.tsx`                                                   |
| `user_signed_in`          | User successfully signed in (email or Google) | `src/app/(auth)/signin/sign-in-form.tsx`, `src/app/(auth)/components/google-sign-in.tsx`   |
| `upgrade_to_pro_clicked`  | User clicked upgrade button on pricing page   | `src/app/(marketing)/pricing/buy-pro-button.tsx`                                           |
| `plan_created`            | User created a new financial plan             | `src/app/dashboard/components/dialogs/plan-dialog.tsx`                                     |
| `plan_cloned`             | User cloned an existing plan or template      | `src/app/dashboard/components/dialogs/plan-dialog.tsx`                                     |
| `ai_message_sent`         | User sent message to AI assistant             | `src/app/dashboard/simulator/[planId]/components/outputs/drawers/ai-chat-drawer.tsx`       |
| `ai_insights_generated`   | User generated AI insights for plan           | `src/app/dashboard/insights/components/dialogs/generate-dialog.tsx`                        |
| `user_feedback_submitted` | User submitted feedback                       | `src/app/dashboard/simulator/[planId]/components/outputs/drawers/user-feedback-drawer.tsx` |
| `password_changed`        | User changed their password                   | `src/app/settings/components/change-password-form.tsx`                                     |
| `profile_name_updated`    | User updated their profile name               | `src/app/settings/components/profile-info-form.tsx`                                        |
| `verification_email_sent` | User requested email verification             | `src/app/settings/components/profile-info-form.tsx`                                        |
| `error_page_viewed`       | User encountered an application error         | `src/app/error.tsx`                                                                        |

## Files Created/Modified

### New Files

- `instrumentation-client.ts` - PostHog client-side initialization
- `src/lib/posthog-server.ts` - Server-side PostHog client utility

### Modified Files

- `.env.local` - Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
- `next.config.ts` - Added reverse proxy rewrites and `skipTrailingSlashRedirect`
- 10 component files with event tracking (listed in table above)

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard

- [Analytics basics](https://us.posthog.com/project/271994/dashboard/960024) - Core product analytics dashboard

### Insights

- [Sign-up to Plan Creation Funnel](https://us.posthog.com/project/271994/insights/0f27HXj4) - Conversion funnel from sign-up to first plan
- [Pro Upgrade Conversion Funnel](https://us.posthog.com/project/271994/insights/0cKZz19U) - Monetization conversion tracking
- [AI Feature Engagement](https://us.posthog.com/project/271994/insights/9nR2hkOi) - Pro feature usage trends
- [User Authentication Events](https://us.posthog.com/project/271994/insights/l9VFSPAd) - Sign-up/sign-in by method
- [Error Rate Monitoring](https://us.posthog.com/project/271994/insights/8l60fkdm) - Application error tracking

## Configuration Details

- **PostHog Host**: `https://us.i.posthog.com` (proxied via `/ingest`)
- **Autocapture**: Enabled (pageviews, clicks, etc.)
- **Session Recording**: Available (configure in PostHog dashboard)
- **Exception Tracking**: Enabled via `capture_exceptions: true`
