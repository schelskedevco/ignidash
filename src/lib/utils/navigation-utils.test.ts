import { describe, it, expect } from 'vitest';
import { getSafeRedirect } from './navigation-utils';

describe('getSafeRedirect', () => {
  it('should return /dashboard for null input', () => {
    expect(getSafeRedirect(null)).toBe('/dashboard');
  });

  it('should return /dashboard for empty string', () => {
    expect(getSafeRedirect('')).toBe('/dashboard');
  });

  it('should block external URLs', () => {
    expect(getSafeRedirect('https://evil.com')).toBe('/dashboard');
    expect(getSafeRedirect('http://example.com')).toBe('/dashboard');
  });

  it('should block protocol-relative URLs', () => {
    expect(getSafeRedirect('//evil.com')).toBe('/dashboard');
  });

  it('should accept all explicitly allowed routes', () => {
    const allowed = [
      '/',
      '/settings',
      '/dashboard',
      '/dashboard/simulator',
      '/dashboard/compare',
      '/dashboard/insights',
      '/pricing',
      '/success',
      '/help',
      '/terms',
      '/privacy',
      '/about',
    ];
    for (const route of allowed) {
      expect(getSafeRedirect(route)).toBe(route);
    }
  });

  it('should accept /dashboard/simulator/[planId] prefix', () => {
    expect(getSafeRedirect('/dashboard/simulator/abc123')).toBe('/dashboard/simulator/abc123');
    expect(getSafeRedirect('/dashboard/simulator/plan-xyz')).toBe('/dashboard/simulator/plan-xyz');
  });

  it('should reject nested paths under /dashboard/simulator/[planId]', () => {
    expect(getSafeRedirect('/dashboard/simulator/abc123/edit')).toBe('/dashboard');
    expect(getSafeRedirect('/dashboard/simulator/abc/def/ghi')).toBe('/dashboard');
  });

  it('should reject unknown paths', () => {
    expect(getSafeRedirect('/admin')).toBe('/dashboard');
    expect(getSafeRedirect('/api/secret')).toBe('/dashboard');
  });
});
