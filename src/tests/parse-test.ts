jest.unmock('../logic');

import { parseOne, parse } from '../logic';

describe('parse rule with one from: Accept: ALL', () => {
  const rule = parseOne("Accept: ALL");

  it('has action Accept', () => {
    expect(rule.accept).toBe(true);
  });

  it('has original text', () => {
    expect(rule.text).toBe('Accept: ALL');
  });

  it('has from array [ALL]', () => {
    expect(rule.from).toEqual(['ALL']);
  });
});

describe('parse rule with three froms: Deny: SELF x foo.bar', () => {
  const rule = parseOne('Deny: SELF x foo.bar');

  it('has action Deny', () => {
    expect(rule.accept).toBe(false);
  });

  it('has from array [SELF, x, foo.bar]', () => {
    expect(rule.from).toEqual(['SELF', 'x', 'foo.bar']);
  });
});

describe('parse composite rules', () => {
  const rules = parse("Deny: SELF   , Accept    :  Foo Bar bas.sadf.sadf.f,Deny:ALL");

  it('has expected parse output', () => {
    expect(rules).toEqual([
      {
        accept: false,
        from: ["SELF"],
        text: "Deny: SELF"
      },
      {
        accept: true,
        from: ["Foo", "Bar", "bas.sadf.sadf.f"],
        text: "Accept    :  Foo Bar bas.sadf.sadf.f"
      },
      {
        accept: false,
        from: ["ALL"],
        text: "Deny:ALL"
      }
    ]);
  });
});

