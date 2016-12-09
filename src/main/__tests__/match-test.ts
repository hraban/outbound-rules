jest.unmock('../logic');

import { matcher } from '../logic';

describe('matcher of ALL', () => {
  const m = matcher("ALL");

  it('matches a full domain', () => {
    expect(m("https://x.y.z")).toBe(true);
  });

  it('matches an empty string', () => {
    expect(m("")).toBe(true);
  });

  it('matches a simple hostname', () => {
    expect(m("https://foo")).toBe(true);
  })

  it ('matches weird unicode chars', () => {
    expect(m("https://test.ééé.test")).toBe(true);
  });
});

describe('matcher of foo.bar', () => {
  const m = matcher("foo.bar");

  it('matches foo.bar', () => {
    expect(m("https://foo.bar")).toBe(true);
  });

  it('matches nothing else', () => {
    expect(m("https://sub.foo.bar")).toBe(false);
    expect(m("")).toBe(false);
    expect(m("https://bar.foo")).toBe(false);
    expect(m("SELF")).toBe(false);
  });
});

describe('matcher of .foo.bar', () => {
  const m = matcher(".foo.bar");
 
  it('matches foo.bar', () => {
    expect(m("https://foo.bar")).toBe(true);
  });

  it('matches sub.foo.bar', () => {
    expect(m("https://sub.foo.bar")).toBe(true);
  });

  it('matches very.deep.subdomain.foo.bar', () => {
    expect(m("https://very.deep.subdomain.foo.bar")).toBe(true);
  });

  it('matches nothing else', () => {
    expect(m("")).toBe(false);
    expect(m("https://bar.foo")).toBe(false);
    expect(m("https://SELF")).toBe(false);
  });
});