// Copyright © 2016 Authors (see AUTHORS file)
//
// Licensed under the AGPL. See the LICENSE file for more info.


// The logic for the WebExtension plugin as a module.

// A pattern transformed to a function closure which applies the pattern to a
// URL. Used to keep rule users agnostic of their implementation.
interface PatternMatcher {
    (url: string): boolean
}

interface ParsedRule {
    accept: boolean,
    from: string[],
    text: string
}

interface Rule extends ParsedRule {
    // Use this to test whether the rule applies to a URL.
    matcher: PatternMatcher
}

function matchDot(pattern: string, url: string): boolean {
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
export function matcher(pattern: string): PatternMatcher {
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
    // TODO: port?
    return a.hostname;
}

function trim(x: string) { return x.trim() }

function parseOneAux(action: string, from_: string) {
    return {
        // err on the side of deny; any typos or otherwise unknown actions become "deny"
        accept: action.trim().toLowerCase() === "accept",
        from: from_.split(/\s/).map(trim).filter(Boolean),
    };
}

export function parseOne(ruletext: string): ParsedRule {
    let rule = parseOneAux.apply(null, ruletext.split(':'));
    rule.text = ruletext;
    return rule;
}

export function parse(outheader: string): ParsedRule[] {
    return outheader.split(',').map(trim).filter(Boolean).map(parseOne);
}

// Attach matcher functions to each rule
function ruleMatchers(rules: Rule[], originHost: string) {
    rules.forEach(function (rule) {
        // The hosts this rule matches on
        const from = rule.from.map(x => x === "SELF" ? originHost : x);
        // Every function in this array must be applied to an incoming URL.
        // If any of them returns true, the rule matches.
        const matchers = from.map(matcher);
        rule.matcher = url => matchers.some(match => match(url));
    });
}

export interface IPluginBackend {
    initRequest(tabId: number, url: string, outboundRules: string);
    shouldAccept(tabId: number, url: string, origin: string): boolean;
}

// putting the Java back in JavaScript
export interface IPluginBackendFactory {
    new(debug: number): IPluginBackend
}

// Manage state for the plugin between responses (containing outbound rules)
// and requests which come from those responses.
// This dance is necessary because onBeforeSendHeaders doesn't provide
// access to the response context of the page that caused this request.
//
// This class is "plugin system" agnostic. Its API reflects the implementation,
// not the expected API.
export class PluginBackend implements IPluginBackend {
    private cache: {[id: string]: Rule[]} = {};

    // verbosity:
    //   - 0: silent
    //   - 1: info
    //   - 2: debug
    constructor(private debug: number) {}

    // The rule that matches this outgoing request, if any.
    //
    // If no outbound rules were defined for this request, this function returns
    // undefined. If outbound rules were defined but none matched, it returns
    // null.
    private findRule(tabId: number, url: string): Rule {
        const outbound = this.cache[tabId];

        if (outbound === undefined) {
            // This page had no outbound rules
            return undefined;
        }

        // TODO: schemas. Currently still vulnerable to downgrading https to http.

        return outbound.find(rule => rule.matcher(url)) || null;
    }

    initRequest(tabId: number, url: string, outboundRules: string) {
        const originHost = getHost(url).toLowerCase();

        const rules = <Rule[]>parse(outboundRules);
        ruleMatchers(rules, originHost);

        // TODO: indexed by tab id --- how does that play with frames?
        this.cache[tabId] = rules;
    }

    // The origin parameter is only required for logging. (TODO: refactor)
    shouldAccept(tabId: number, url: string, origin: string): boolean {
        const rule = this.findRule(tabId, url);

        if (rule === undefined) {
            // No rules set, default to accept
            return true;
        }

        // Default to deny if no rule was found
        const accept = rule === null ? false : rule.accept;

        if (this.debug) {
            const verb = accept ? "Allowed" : "Blocked";
            const ruletext = rule === null ? "default: deny" : `rule: ${rule.text}`;
            console.log(verb, "loading", url, "from", origin, `(${ruletext})`);
        }

        return accept;
    }
}
