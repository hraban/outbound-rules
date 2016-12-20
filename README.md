## Outbound-Rules: Protect your admin dashboards from XSS

Does your company have an "admin dashboard"? A website where you manage your
users' data, like their e-mail and their profile pictures? Then you are at risk
of the top-3 security vulnerability in the world: XSS.

This plugin, **Outbound-Rules**, will protect you, your employees and your
customers.

## Introduction: What is XSS? An example.

XSS is a dangerous security vulnerability. Not because it is complex, but
because it can happen in so many different places.

Imagine the following example: a web hosting company, FooBar Corp.  They have an
"admin page": a website, written in Angular. Employees use it to manage customer
support tickets, payments, addresses, etc. It's hosted on
https://admin.foobarcorp.com/. They use a standard Angular plugin for
authentication (ng-token-auth).

![sample web interface login screen](https://s3-us-west-2.amazonaws.com/outboundrules-readme-files/foobarcorp-admin-login-small.png)

Where do you have to look out for XSS? What if there is one bug, how big is the
damage?

XSS attacks are like spy drones: they go behind enemy lines, take photos of
secret stuff they're not allowed to see, and send that back to base. A
successful XSS attack on this dashboard has two steps:

1. An attacker has to get the browser to execute some JavaScript, thinking that
   the JavaScript actually came from "https://admin.foobarcorp.com/". That means
   that the JavaScript will have access to private cookies and auth tokens from
   the dashboard.
2. The JavaScript then has to send that private data back to a server belonging
   to the attacker. For example, through Ajax.

Step #1 can occur: *everywhere user data displayed on the dashboard.* User
e-mail, address, user tickets, profile pictures, payment info, anything.  Any
piece of text controlled by a user must be very carefully handled when
displaying it in the dashboard. If you use Angular as intended, you "should be
fine", but XSS will always be lurking in the shadows. One mistake, one
misunderstood library API which you think escapes values for you but actually
doesn't, one misstep: XSS.

Because the site is written in Angular, anyone can download the entire
dashboard code, even without logging in. They won't have the actual user
details, but they can see exactly how the dashboard behaves: what pieces of user
data it shows, how it stores sensitive data like cookies, and if there are any
security flaws.

And what if, one day, someone does find an XSS bug in your dashboard? Say, for
example, users are allowed to supply a URL as their profile picture. This is
passed to a library which expects it to be escaped, but that's not immediately
clear, so you pass it the raw URL from the user.

Now, somebody figures this out, and sets their profile picture URL to:

```
https://images.com/myimage.jpg" onload="(function () {..Evil JavaScript Here...})()
```

The resulting `img` tag on the dashboard:

```html
<img
  src="https://images.com/myimage.jpg"
  onload="(
    function () {
      ..Evil JavaScript Here...
    }
  )()" />
```

The next time an employee logs in to the dashboard, they will execute whatever
JavaScript is in the `'..Evil JavaScript Here...'` bit, but *as admin*. Meaning
the evil JavaScript could look for the authentication cookie (which they know
exactly how to find, because the entire dashboard source code is available),
send it to their own server using Ajax, and voila: full access to the entire
admin dashboard. No interaction by the employee required, no phishing, no "click
here"; just logging in. As usual.

"But," I hear you say, "this won't happen if you always follow security best
practices." True! Just escape user input when displaying it. This is our current
approach to protecting against XSS: just don't make any mistakes. Ever.

There are problems with that:

First, this is hard. What is the DOM? what is escaping? why? Try explaining all
the semantic levels, which escaping makes sense, when, to somebody who started
programming by jumping into JS frameworks in 2016. It's easy to forget how hard
this all is, once you know it.

Second, even assuming that someone knows exactly what XSS is and how to prevent
it: the problem is not that a *single* XSS bug is impossible to prevent. The
problem is that there are *so many possible XSS bugs*. **Every single piece of
user data displayed on your admin page, anywhere, is a possible XSS bug.**
Sooner or later, someone, somewhere, will make a mistake.

## How Current Solutions Protect Against XSS

The example above explains that a successful XSS attack is like a spy drone in
action, it has two steps:

1. **See the secret:** Get the victim's browser to execute some JS, thinking
   that the JS came from a trusted website. E.g. put evil JS in your e-mail:
   when an admin visits their company's web dashboard, they execute the JS. The
   browser thinks that JS came from the admin dashboard and gives it access to
   the login cookie, auth tokens, ...
2. **Send the secret back to home base:** send that private data back to the
   attacker's server, e.g. through Ajax.

After this, the attacker picks up the private data from the evil server and uses
it to log in to the admin dashboard, himself.

Currently, almost all XSS mitigation techniques focus on preventing step #1.
Barely anyone focuses on step #2. Basically, once someone gets to execute
untrusted JS on your site, we consider it "case closed, you're pwned." This is
evident from XSS bug reports using `alert("pwnd!");` as proof of the XSS bug. As
if showing an alert box to a victim would help an attacker.

While protecting yourself from #1 is a good idea, it's not the only thing you
can do.

## How The "Outbound-Rules" Protocol Protects Against XSS

The **Outbound-Rules** protocol protects you from step #2 in XSS: it prevents
evil JavaScript from sending any private data back to the attacker.

This limits the possible damage of XSS, in the unfortunate case that your
regular defenses against #1 fail: even though their evil JavaScript knows what
the secret login cookie is, it can't communicate it back. Like a spy drone that
can't send its images back to base.

It is done by whitelisting the "known good external servers". Any Javascript or
HTML on your page can only contact these servers.

To protect a page against XSS using **Outbound-Rules**, the server must send a
`Outbound-Rules` header with a list of rules. E.g.:

```
Outbound-Rules: Accept: SELF code.jquery.com, Deny: ALL
```

will only allow requests to your own hostname and to code.jquery.com. Anything
else is forbidden.

In the example above, **Outbound-Rules** wouldn't have prevented the XSS exploit
from being loaded. However, it would have prevented the javascript from sending
the secret cookies anywhere. With **Outbound-Rules**, even if there is a XSS bug
on your site, it's much less useful to attackers because they can't send the
secret data back to themselves.

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
* Help me create a good demo website which clearly shows how XSS works, and what
  Outbound-Rules does (and doesn't do) to prevent it.

See below for more information on how the tests work.

If you can't code:

* **Install the plugin and help me find bugs.** Use the Github issue tracker to
  report them.
* Help me with documentation.
* Screenshots for the Firefox and Chrome plugin pages
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
* a separate test script per test (`src/integration-tests/ts/test-*.ts`),
  accessing those test resources through Selenium (using Chrome with the plugin
  loaded).

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
