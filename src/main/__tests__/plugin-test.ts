jest.unmock('../logic');

import { PluginBackend } from '../logic';

const DEBUG_LVL = 0;

describe('plugin backend with rules', () => {
  const backend = new PluginBackend(DEBUG_LVL);

  it('can be initialized', () => {
    backend.initRequest(1, "https://foo.bar/", "Accept: SELF example.com, Deny: evil.com");
  });

  it('allows requests to itself', () => {
    expect(backend.shouldAccept(1, "https://foo.bar/some/resource", "foo.bar")).toBe(true);
  });

  it('allows requests to example.com', () => {
    expect(backend.shouldAccept(1, "https://example.com", "foo.bar")).toBe(true);
  });

  it('denies requests to evil.com', () => {
    expect(backend.shouldAccept(1, "https://evil.com/no/senor", "foo.bar")).toBe(false);
  });

  it('defaults to Deny for requests not matching any rule', () => {
    expect(backend.shouldAccept(1, "https://unknown.net/que", "foo.bar")).toBe(false);
  });

  it('defaults to Accept on completely missing rules', () => {
    // Note the different, uninitialized tab id
    expect(backend.shouldAccept(2, "https://example.com/", "foo.bar")).toBe(true);
  });
});

describe('plugin backend without rules', () => {
  const backend = new PluginBackend(DEBUG_LVL);

  it('can be initialized', () => {
    backend.initRequest(1, "https://foo.bar/", undefined);
  });

  it('allows requests to itself', () => {
    expect(backend.shouldAccept(1, "https://foo.bar/some/resource", "foo.bar")).toBe(true);
  });

  it('allows requests to example.com', () => {
    expect(backend.shouldAccept(1, "https://example.com", "foo.bar")).toBe(true);
  });

  it('allows requests to evil.com', () => {
    expect(backend.shouldAccept(1, "https://evil.com/no/senor", "foo.bar")).toBe(true);
  });

  it('defaults to Allow for any request', () => {
    expect(backend.shouldAccept(1, "https://unknown.net/que", "foo.bar")).toBe(true);
  });
});
