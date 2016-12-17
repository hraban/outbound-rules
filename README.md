## Outbound-Rules: Turn XSS protection on its head

This is the Firefox and Chrome implementation of the Outbound-Rules protocol.

The Outbound-Rules protocol turns XSS protection upside down: instead of
preventing XSS from happening, instead it limits the possible damage of XSS.
This is achieved by whitelisting the "known good external servers". Any
Javascript, HTML, or other resource (including by XSS) can only contact these
servers.

To protect a page against XSS using Outbound-Rules, the server must send a
`Outbound-Rules` header with a list of rules. E.g.:

```
Outbound-Rules: Accept: SELF code.jquery.com, Deny: ALL
```

will only allow requests to your own hostname and to code.jquery.com. Anything
else is forbidden.

Firefox: https://addons.mozilla.org/en-US/firefox/addon/outbound-rules/

Chrome: https://chrome.google.com/webstore/detail/outbound-rules/jpkboijeielcdcjhjfokoielfjchipeo

## Details

This system protects you against an attack where some malicious javascript finds
its way onto your page (e.g. you forgot to HTML escape a value before rendering
it on your page, like a user's e-mail address in an admin dashboard, or a
comment on a blog post). Once this attacker controlled javascript is executed,
they can "steal" session cookies or other data only visible to your session by
sending it to an attacker controlled server. E.g. through XHR, by loading an
image in the background, or by making the entire page a link to a remote page
which quickly links back.

This plugin doesn't prevent the initial javascript from being loaded or
executed. Rather, it prevents it from ever "escaping" your trusted servers. This
means that even though the script now has access to sensitive data, it cannot
send it anywhere. At least not through the browser.

This plugin doesn't have any effect on pages without the `Outbound-Rules`
header. Because practically nobody sends that header, at present, the plugin has
no effect "in the wild." It's currently useful for environments where you
control both the browsers and the servers, e.g.: a company with an admin
dashboard for their service (which is only accessible by employees). All
employees can be asked to install the plugin, and the page can be configured to
send the appropriate header.

## Contribute

Contributions are very welcome!

If you can code:

* **Add (integration) test cases.** Especially failing ones. :)
* Fix bugs (see the issue tracker).
* Help me with the UI (halp)

See below for more information on how the tests work.

If you can't code:

* **Install the plugin and help me find bugs.** Use the Github issue tracker to
  report them.
* Help me with documentation.
* Tell me about your use case.

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

If a page has no Outbound-Rules header (most pages) the default is to allow all
connections (as usual). This makes the Outbound-Rules protocol effectively
"opt-in".

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

## Testing

Full test suite (requires selenium and Chrome installed):

```sh
$ npm test
```

Only the unit tests or integration tests:

```sh
$ npm run compile && npm run unit-tests-bare
$ npm run integration-tests
```

### Testing with Docker

Full test suite in Docker:

```sh
$ docker build -t outboundrules-test .
$ docker run --rm outboundrules-test
```

To rerun the tests in Docker after building the initial image, without
rebuilding the entire docker image:

```sh
$ docker rum --rm -v "$PWD"/src:/app/src outboundrules-test
```

This automatically takes your latest changes in `src/`, rebuilds it and runs all
tests. Useful if unit tests don't work locally, e.g. on Mac.

### Details on testing

#### Unit tests

The unit tests are written in jest (https://facebook.github.io/jest/). They're
located in `src/ts/__tests__`, which is the standard location for jest tests.

For some reason they don't work on Mac. Which is fine because it's just as easy
to use docker to test them (see instructions above). I don't care enough to
figure out what the problem is.

#### Integration tests

The integration tests require Selenium and Chrome. They're located in
`src/integration-tests`. There are three parts to it:

* a collection of HTML pages and associated resources (images, javascript
  files, ...) in `src/integration-tests/resources`,
* two web servers, one with `Outbound-Rules: Deny: ALL`, another without any
  rules, serving the static integration test resources,
* a separate test script per test (`src/integration-tests/test-*.ts`), accessing
  those test resources through Selenium (using Chrome with the plugin loaded).

The independent tests try to connect to an external resource and resolve as
either LOADED or BLOCKED.

When running the integration tests, Selenium is used to load the local Chrome
build of the plugin. Each test is then run sequentially. Tests are run twice:
once against the webserver with a `Deny: ALL` rule, and once against the server
without any rules. On the first run, all tests are expected to resolve as
BLOCKED. On the second, they're expected to resolve LOADED.

The integration tests don't work in Firefox because there is no Selenium +
WebExtension + Firefox support yet:

https://github.com/seleniumhq/selenium/issues/1181

## Source, license and authors

This program is licensed under the AGPLv3 (see the LICENSE file). The list of
authors is kept in the AUTHORS file.

The original Proof-of-Concept for this extension was developed as part of a
hackathon for Ravelin (https://ravelin.com). They're based in London, and always
hiring! https://ravelin.com/jobs

The full, buildable source code can be found on the project's GitHub page:
https://github.com/hraban/outbound-rules.
