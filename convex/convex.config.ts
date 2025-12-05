import { defineApp } from 'convex/server';
import betterAuth from './betterAuth/convex.config';
import resend from '@convex-dev/resend/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import migrations from '@convex-dev/migrations/convex.config.js';

const app = defineApp();
app.use(resend);
app.use(betterAuth);
app.use(rateLimiter);
app.use(migrations);

export default app;
