import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectPackageManager } from '../../src/pm/detect.js';

const ORIGINAL = process.env.npm_config_user_agent;

beforeEach(() => {
  delete process.env.npm_config_user_agent;
});

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.npm_config_user_agent;
  } else {
    process.env.npm_config_user_agent = ORIGINAL;
  }
});

describe('detectPackageManager', () => {
  it('returns null when npm_config_user_agent is not set', () => {
    expect(detectPackageManager()).toBeNull();
  });

  it('returns npm for an npm user agent', () => {
    process.env.npm_config_user_agent = 'npm/10.2.3 node/v20.0.0 linux x64 workspaces/false';
    expect(detectPackageManager()).toBe('npm');
  });

  it('returns yarn for a yarn user agent', () => {
    process.env.npm_config_user_agent = 'yarn/3.6.0 npm/? node/v20.0.0 linux x64';
    expect(detectPackageManager()).toBe('yarn');
  });

  it('returns pnpm for a pnpm user agent', () => {
    process.env.npm_config_user_agent = 'pnpm/8.6.0 npm/? node/v20.0.0 linux x64';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('returns bun for a bun user agent', () => {
    process.env.npm_config_user_agent = 'bun/1.0.0 npm/? node/v20.0.0 linux x64';
    expect(detectPackageManager()).toBe('bun');
  });

  it('returns null for an unrecognised agent string', () => {
    process.env.npm_config_user_agent = 'deno/1.34.0 unknown-runtime';
    expect(detectPackageManager()).toBeNull();
  });
});
