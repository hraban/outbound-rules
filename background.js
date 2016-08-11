// Copyright © 2016 Authors (see AUTHORS file)
//
// Licensed under the AGPL. See the LICENSE file for more info.


// Filter outgoing requests based on the Outbound-Rules header received from
// servers (if present).

function matchSubdomain(teststr, host) {
    console.assert(host[0] === ".", "matchSubdomain: host MUST start with a period:", host);
    if (host.length === teststr.length + 1) {
        // same domain, remove the dot
        return host.slice(1) === teststr;
    }
    // subdomain, make sure to include the dot!
    return teststr.endsWith(host);
}

// true if the teststr matches the hostname denoted by the host parameter
//
// matchHost("ravelin.com", ".ravelin.com")
// > true
function matchHost(teststr, host) {
    if (host === "ALL") {
        return true;
    }
    if (host.startsWith(".")) {
        return matchHostDot(teststr, host);
    }
    return teststr === host;
}

function getHost(url) {
    const a = document.createElement('A');
    a.href = url;
    return a.hostname;
}

// This dance is necessary because onBeforeSendHeaders doesn't provide access to
// the response context of the page that caused this request.
var cache = {};
// Keep track of fresh requests
var fresh = {};

// < "Deny: SELF   , Allow    :  Foo Bar bas.sadf.sadf.f,Deny:ALL"
// > [{"action":"Deny","from":["SELF"]},{"action":"Allow","from":["Foo","Bar","bas.sadf.sadf.f"]},{"action":"Deny","from":["ALL"]}]
function parse(outheader) {
    function trim(x) { return x.trim(); }
    function sub(action, from_) {
        return {
            action: action.trim(),
            from: from_.split(/\s/).map(trim).filter(Boolean),
        };
    }
    return outheader.split(',').map(trim).filter(Boolean).map(function (subrule) {
        let rule = sub.apply(null, subrule.split(':'));
        rule.text = subrule;
        return rule;
    });
}

function onHeadersReceived(details) {
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
    // Note: indexed by tab id
    console.log("onHeadersReceived: got outboundRules for", details.url, ":", outboundRules);
    cache[details.tabId] = parse(outboundRules || "");
}

function onBeforeSendHeaders(details) {
    var headers = details.requestHeaders;
    if (headers === undefined) {
        console.error("onBeforeSendHeaders: No request headers available");
        return;
    }

    // Use the headers to get the origin because tab.get is async
    var origin, outboundRules;
outer:
    for (let header of headers) {
        switch (header.name) {
        case "Origin":
        case "Referer":
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

    var outbound = cache[details.tabId];
    if (outbound === undefined) {
        console.error("onBeforeSendHeaders: no outbound rules cached for " + details.tabId + " (" + details.requestId + "): "+ details.url);
        return;
    }

    // TODO: schemas

    const targetDomain = getHost(details.url);
    const originDomain = getHost(origin);
    let cancel;
    let rule;
outer:
    for (rule of outbound) {
        for (let host of rule.from) {
            if (host === "SELF") {
                host = originDomain;
            }
            if (matchHost(targetDomain, host)) {
                cancel = rule.action === "Deny";
                break outer;
            }
        }
    }

    if (cancel === true) {
        console.log("Blocked loading", details.url, "from", origin, "(rule: " + rule.text + ")");
    }

    // Don't use {cancel: ..} because a link visit will automatically reload
    return {cancel: !!cancel};
}

var filter = {
    urls: ["<all_urls>"],
};

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["responseHeaders" /*,  "blocking"? would it be a race not to? */]);
chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, filter, ["blocking", "requestHeaders"]);
