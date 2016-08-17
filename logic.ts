// Copyright © 2016 Authors (see AUTHORS file)
//
// Licensed under the AGPL. See the LICENSE file for more info.


// The logic for the plugin as a module.

function matchDot(pattern: string, url: string) {
    const host = getHost(url).toLowerCase();
    if (pattern.length === host.length + 1) {
        // same domain, remove the dot
        return pattern.slice(1) === host;
    }
    // subdomain, make sure to include the dot!
    return host.endsWith(pattern);
}

function isAbsolute(url: string): boolean {
    return /^\w+:\/\//.test(url);
}

// Create a matcher function for this pattern.
export function matcher(pattern: string): (url: string) => boolean {
    if (pattern === "ALL") {
        return () => true;
    }

    pattern = pattern.toLowerCase();

    if (pattern.startsWith(".")) {
        return (url: string) => matchDot(pattern, url);
    }

    if (pattern.indexOf('/') === -1) {
        // just a hostname
        return (url: string) => getHost(url).toLowerCase() === pattern;
    }

    // exact match
    return (url: string) => url.toLowerCase() === pattern;
}

function getHost(url: string): string {
    const a = document.createElement('a');
    a.href = url;
    return a.hostname;
}

// This dance is necessary because onBeforeSendHeaders doesn't provide access to
// the response context of the page that caused this request.
var cache: {[id: string]: Rule[]} = {};
// Keep track of fresh requests
var fresh = {};

// A pattern transformed to a function closure which applies the pattern to a
// URL.
interface PatternMatcher {
    (url: string): boolean
}

interface ParsedRule {
    allow: boolean,
    from: string[],
    text: string
}

interface Rule extends ParsedRule {
    matcher: PatternMatcher
}

function trim(x: string) { return x.trim() }

function parseOneAux(action: string, from_: string) {
    return {
        // err on the side of deny; any typos or otherwise unknown actions become "deny"
        allow: action.trim().toLowerCase() === "allow",
        from: from_.split(/\s/).map(trim).filter(Boolean),
    };
}

export function parseOne(ruletext: string): ParsedRule {
    let rule = parseOneAux.apply(null, ruletext.split(':'));
    rule.text = ruletext;
    return rule;
}

// < "Deny: SELF   , Allow    :  Foo Bar bas.sadf.sadf.f,Deny:ALL"
//
// > [
// >   {
// >     allow: false,
// >     from: ["SELF"],
// >     text: "Deny: SELF"
// >   },
// >   {
// >     allow: true,
// >     from: ["Foo", "Bar", "bas.sadf.sadf.f"],
// >     text: "Allow    :  Foo Bar bas.sadf.sadf.f"
// >   },
// >   {
// >     allow: false,
// >     from: ["ALL"],
// >     text: "Deny:ALL"
// >   }
// > ]
export function parse(outheader: string): ParsedRule[] {
    return outheader.split(',').map(trim).filter(Boolean).map(parseOne);
}

export function onHeadersReceived(details) {
    var headers = details.responseHeaders;
    if (headers === undefined) {
        console.error("onHeadersReceived: No resopnse headers available");
        return;
    }

    if (!(details.requestId in fresh)) {
        return;
    }
    delete fresh[details.requestId];

    var outboundRules;
outer:
    for (let header of headers) {
        switch (header.name) {
            case "Outbound-Rules":
                outboundRules = header.value;
                break outer;
        }
    }
    console.log("onHeadersReceived: got outboundRules for", details.url, ":", outboundRules);
    const originHost = getHost(details.url).toLowerCase();
    const rules = <Rule[]>parse(outboundRules || "");
    rules.forEach(function (rule) {
        // The hosts this rule matches on
        const from = rule.from.map(x => x === "SELF" ? originHost : x);
        // Every function in this array must be applied to an incoming URL.
        // If any of them returns true, the rule matches.
        const matchers = from.map(matcher);
        rule.matcher = url => matchers.some(match => match(url));
    });
    // TODO: indexed by tab id --- how does that play with frames?
    cache[details.tabId] = rules;
}

export function onBeforeSendHeaders(details) {
    const headers = details.requestHeaders;
    if (headers === undefined) {
        console.error("onBeforeSendHeaders: No request headers available");
        return;
    }

    // Use the headers to get the origin because tab.get is async
    let origin: string, outboundRules: string;
outer:
    for (let header of headers) {
        switch (header.name) {
            case "Origin":
            case "Referer":
            case "Referrer":
                origin = header.value;
                break outer;
        }
    }

    if (origin === undefined || origin === details.url) {
        // Assume this is a fresh request
        console.log("onBeforeSendHeaders: fresh page load: " + details.url);
        fresh[details.requestId] = true;
        return;
    }

    const outbound = cache[details.tabId];
    if (outbound === undefined) {
        console.error("onBeforeSendHeaders: no outbound rules cached for " + details.tabId + " (" + details.requestId + "): " + details.url);
        return;
    }

    // TODO: schemas

    const targetDomain = getHost(details.url);
    const originDomain = getHost(origin);
    let cancel: boolean;
    let rule: Rule;
    for (rule of outbound) {
        if (rule.matcher(details.url)) {
            cancel = !rule.allow;
            break;
        }
    }

    if (cancel !== undefined) {
        const verb = cancel ? "Blocked" : "Allowed";
        console.log(verb, "loading", details.url, "from", origin, "(rule: " + rule.text + ")");
    }

    // TODO: Don't use {cancel: ..} because a link visit will automatically reload
    return { cancel: !!cancel };
}
