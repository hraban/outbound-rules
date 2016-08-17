jest.unmock('../logic');

import { parseOne, parse } from '../logic';

describe('parse rule with one from: Allow: ALL', () => {
  const rule = parseOne("Allow: ALL");

  it('has action Allow', () => {
    expect(rule.allow).toBe(true);
  });

  it('has original text', () => {
    expect(rule.text).toBe('Allow: ALL');
  });

  it('has from array [ALL]', () => {
    expect(rule.from).toEqual(['ALL']);
  });
});

describe('parse rule with three froms: Deny: SELF x foo.bar', () => {
  const rule = parseOne('Deny: SELF x foo.bar');

  it('has action Deny', () => {
    expect(rule.allow).toBe(false);
  });

  it('has from array [SELF, x, foo.bar]', () => {
    expect(rule.from).toEqual(['SELF', 'x', 'foo.bar']);
  });
});
