## Outbound-Rules WebExtension for Chrome and Firefox

To protect your page against XSS, specify which hosts the page is allowed to
issue outgoing requests to. E.g.:

```
Outbound-Rules: Accept: SELF code.jquery.com, Deny: ALL
```

will only allow requests to your own hostname and to code.jquery.com. Anything
else is forbidden.

## Details

This system protects you against an attack where some malicious javascript finds
its way onto your page (e.g. you forgot to HTML escape a value before rendering
it on your page, like a user's e-mail address in an admin dashboard). Once this
attacker controlled javascript is executed, they can "steal" session cookies or
other data only visible to your session by sending it to an attacker controlled
server. E.g.  through XHR, by loading an image in the background, or by making
the entire page a link to a remote page which quickly links back.

This plugin doesn't prevent the initial javascript from being loaded or
executed. Rather, it prevents it from ever "escaping" your host. This means that
even though the script now has access to sensitive data, it cannot send it
anywhere. At least not through the browser.

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
as the action to take for a request. If rules were specified, but none match,
the default is to deny the request.

## Inspired by NoScript's ABE

The syntax was inspired by NoScript's ABE: https://noscript.net/abe/. ABE is the
Application Boundaries Enforcer, and on the surface it's the perfect fit for
what Outbound-Rules tries to solve:

> Many of the threats NoScript is currently capable of handling, such as XSS,
> CSRF or ClickJacking, have one common evil root: lack of proper isolation at
> the web application level. Since the web has not been originally conceived as
> an application platform, it misses some key features required for ensuring
> application security. Actually, it cannot even define what a “web application”
> is, or declare its boundaries especially if they span across multiple domains,
> a scenario becoming more common and common in these “mashups” and “social
> media” days.
>
> The idea behind the Application Boundaries Enforcer (ABE) module is hardening
> the web application oriented protections already provided by NoScript, by
> delivering a firewall-like component running inside the browser. This
> "firewall" is specialized in defining and guarding the boundaries of each
> sensitive web application relevant to the user (e.g. webmail, online banking
> and so on), according to policies defined either by the user himself, or by
> the web developer/administrator, or by a trusted 3rd party.

Hear, hear.

Unfortunately, as it turns out, ABE is mostly about defining what _incoming_
requests are legal for your server. It doesn't really let you specify what
_outgoing_ requests are legal.

Still, in trying not to reinvent the wheel, I have tried to imitate their style
and syntax as much as reasonable.

## Build

Install the necessary dependencies:

```sh
$ npm install
```

Build the WebExtension plugin for a browser, unpackaged, in the `plugin`
directory:

```sh
$ npm run build-chrome   # or
$ npm run build-firefox
```

You can load the plugin from Chrome by visiting
[chrome://extensions](chrome://extensions), enabling "developer mode" and
clicking "load unpackaged extension". Load the `plugin` directory.

For Firefox, visit [about:debugging](about:debugging), click Load Temporary
Add-on, and select any file in the `plugin` directory.

To create releaseable plugin files:

```sh
$ npm run release-chrome
$ npm run release-firefox
```

### Testing

Full test suite (requires selenium and Chrome installed):

```sh
$ npm test
```

Full test suite in Docker:

```sh
$ docker build -t outboundrules-test .
$ docker run --rm outboundrules-test
```

Only the unit tests or integration tests:

```sh
$ npm run unit-tests-bare
$ npm run integration-tests
```

The integration tests require Selenium and Chrome. They don't work in Firefox
because there is no Selenium + WebExtension + Firefox support yet:

https://github.com/seleniumhq/selenium/issues/1181

## Source, license and authors

The license for this program can be found in the LICENSE file. The list of
authors is kept in the AUTHORS file.

The full, buildable source code can be found on the project's GitHub page:
https://github.com/hraban/outbound-rules.
