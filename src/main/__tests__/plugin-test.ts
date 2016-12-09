jest.unmock('../logic');

import { OutboundRulesPlugin } from '../logic';

describe('plugin object with rules', () => {
  const plugin = new OutboundRulesPlugin(1);

  it('can be initialized', () => {
    plugin.initRequest(1, "https://foo.bar/", "Accept: SELF example.com, Deny: evil.com");
  });

  it('allows requests to itself', () => {
    expect(plugin.shouldAccept(1, "https://foo.bar/some/resource", "foo.bar")).toBe(true);
  });

  it('allows requests to example.com', () => {
    expect(plugin.shouldAccept(1, "https://example.com", "foo.bar")).toBe(true);
  });

  it('denies requests to evil.com', () => {
    expect(plugin.shouldAccept(1, "https://evil.com/no/senor", "foo.bar")).toBe(false);
  });

  it('defaults to Deny for requests not matching any rule', () => {
    expect(plugin.shouldAccept(1, "https://unknown.net/que", "foo.bar")).toBe(false);
  });

  it('defaults to Accept on completely missing rules', () => {
    // Note the different, uninitialized tab id
    expect(plugin.shouldAccept(2, "https://example.com/", "foo.bar")).toBe(true);
  });
});
