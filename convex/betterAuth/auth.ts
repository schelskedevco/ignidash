import { getStaticAuth } from '@convex-dev/better-auth';

import { createAuth } from '../auth';

export const auth = getStaticAuth(createAuth);
