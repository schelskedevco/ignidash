import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requestCookie = vi.hoisted(() => ({ value: '' }));
const fetchQuery = vi.hoisted(() => vi.fn());

vi.mock('next/headers.js', () => ({
  headers: async () => new Headers(requestCookie.value ? { cookie: requestCookie.value } : {}),
}));

vi.mock('convex/nextjs', () => ({
  fetchQuery,
  fetchMutation: vi.fn(),
  fetchAction: vi.fn(),
  preloadQuery: vi.fn(),
}));

function unsignedJwt(expSecondsFromNow: number, sub = 'cached'): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub, exp: Math.floor(Date.now() / 1000) + expSecondsFromNow })}.sig`;
}

const tokenEndpoint = vi.fn();

async function loadAuthServer() {
  vi.resetModules();
  return import('./auth-server');
}

describe('auth-server JWT cache', () => {
  beforeEach(() => {
    vi.stubEnv('SELF_HOSTED_CONVEX_URL', 'https://example.convex.cloud');
    vi.stubEnv('SELF_HOSTED_CONVEX_SITE_URL', 'https://example.convex.site');
    tokenEndpoint.mockReset().mockImplementation(async () => Response.json({ token: 'fresh-token' }));
    vi.stubGlobal('fetch', tokenEndpoint);
    fetchQuery.mockReset();
    requestCookie.value = '';
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reuses an unexpired convex_jwt cookie without calling Convex', async () => {
    const cached = unsignedJwt(3600);
    requestCookie.value = `better-auth.convex_jwt=${cached}`;
    const { getToken } = await loadAuthServer();

    await expect(getToken()).resolves.toBe(cached);
    expect(tokenEndpoint).not.toHaveBeenCalled();
  });

  it('also reads the __Secure- cookie used on https', async () => {
    const cached = unsignedJwt(3600);
    requestCookie.value = `__Secure-better-auth.convex_jwt=${cached}`;
    const { getToken } = await loadAuthServer();

    await expect(getToken()).resolves.toBe(cached);
    expect(tokenEndpoint).not.toHaveBeenCalled();
  });

  it('fetches a fresh token when the cookie has expired', async () => {
    requestCookie.value = `better-auth.convex_jwt=${unsignedJwt(-3600)}`;
    const { getToken } = await loadAuthServer();

    await expect(getToken()).resolves.toBe('fresh-token');
    expect(tokenEndpoint).toHaveBeenCalledTimes(1);
    expect(String(tokenEndpoint.mock.calls[0][0])).toBe('https://example.convex.site/api/auth/convex/token');
  });

  it('fetches a fresh token when there is no cookie', async () => {
    const { getToken } = await loadAuthServer();

    await expect(getToken()).resolves.toBe('fresh-token');
    expect(tokenEndpoint).toHaveBeenCalledTimes(1);
  });

  it('retries once with a fresh token when a cached token is rejected', async () => {
    const cached = unsignedJwt(3600);
    requestCookie.value = `better-auth.convex_jwt=${cached}`;
    fetchQuery.mockRejectedValueOnce(new Error('Unauthenticated: could not verify token')).mockResolvedValueOnce('ok');
    const { fetchAuthQuery } = await loadAuthServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(fetchAuthQuery({} as any, {})).resolves.toBe('ok');
    expect(fetchQuery).toHaveBeenCalledTimes(2);
    expect(fetchQuery.mock.calls[0][2]).toEqual({ token: cached });
    expect(fetchQuery.mock.calls[1][2]).toEqual({ token: 'fresh-token' });
  });

  it('does not retry when the failing token was already fresh', async () => {
    fetchQuery.mockRejectedValue(new Error('Unauthenticated'));
    const { fetchAuthQuery } = await loadAuthServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(fetchAuthQuery({} as any, {})).rejects.toThrow('Unauthenticated');
    expect(fetchQuery).toHaveBeenCalledTimes(1);
    expect(tokenEndpoint).toHaveBeenCalledTimes(1);
  });
});
