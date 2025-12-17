import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('clear stale loading messages', { minutes: 60 }, internal.messages.cleanupLoadingMessages);

export default crons;
