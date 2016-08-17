## Outbound-Rules extension for Chrome

To protect your page against XSS, specify which hosts the page is allowed to
issue outgoing requests to. E.g.:

```
Outbound-Rules: Accept: SELF code.jquery.com, Deny: ALL
```

will only allow requests to your own hostname and to code.jquery.com. Anything
else is forbidden.

## Syntax

If a page has a HTTP header with name `Outbound-Rules`, the value is parsed as a
set of rules:

```
rules  ::= <rule> ["," <rule>]*

rule   ::= <action> ":" <from> [" " <from>]*

action ::= "Deny" | "Accept"

from   ::= "ALL" | "SELF" | <hostname> | "." <hostname>
```

"ALL" is a wild-card hostname which matches all hosts. If the hostname starts
with a dot, the full hostname and any subdomain will be matched. E.g.
".google.com" matches both "google.com" and "www.google.com".

If the hostname is "SELF", it is treated as the full domain name that the page
is currently loaded from.

For every outgoing request generated from that page, all rules are tested
sequentially (before the request is made). The first matching rule will be used
as the action to take for a request. If no rule matches, the default is to allow
the request.

### Inspired by NoScript's ABE

The syntax was inspired by NoScript's ABE: https://noscript.net/abe/. ABE is the
Application Boundaries Enforcer, and on the surface it's the perfect fit for
what Outbound-Rules tries to solve. Unfortunately, as it turns out, ABE is
mostly about defining what _incoming_ requests are legal for your server. It
doesn't really let you what _outgoing_ requests are legal.

Still, in trying not to reinvent the wheel, I have tried to imitate their style
and syntax as much as reasonable.

## Details

This system protects you against an attack where some malicious javascript finds
its way onto your page (e.g. you forgot to HTML escape a value before rendering
it on your page, like a user's e-mail address). Once this attacker controlled
javascript is executed, they can "steal" session cookies or other data only
visible to your session by sending it to an attacker controlled server. E.g.
through XHR, by loading an image in the background, or by making the entire page
a link to a remote page which quickly links back.

This plugin doesn't prevent the initial javascript from being loaded or
executed. Rather, it prevents it from ever "escaping" your host. This means that
even though the script now has access to sensitive data, it cannot send it
anywhere. At least not through the browser.


