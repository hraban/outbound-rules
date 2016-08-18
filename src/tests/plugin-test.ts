jest.unmock('../logic');

import { OutboundRulesPlugin } from '../logic';

describe('plugin object', () => {
  const plugin = new OutboundRulesPlugin(false);

  it('accepts initialization of requests', () => {
    plugin.initRequest(1, "https://foo.bar/", "Accept: SELF example.com, Deny: evil.com");
  });

  it('allows requests to itself', () => {
    expect(plugin.shouldCancel(1, "https://foo.bar/some/resource", "foo.bar")).toBe(false);
  });

  it('allows requests to example.com', () => {
    expect(plugin.shouldCancel(1, "https://example.com", "foo.bar")).toBe(false);
  });

  it('denies requests to evil.com', () => {
    expect(plugin.shouldCancel(1, "https://evil.com/no/senor", "foo.bar")).toBe(true);
  });

  it('is undecided about unknown.net', () => {
    expect(plugin.shouldCancel(1, "https://unknown.net/que", "foo.bar")).toBe(undefined);
  });
});
