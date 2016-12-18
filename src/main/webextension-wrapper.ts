// Copyright © 2016 Authors (see AUTHORS file)
//
// Licensed under the AGPL. See the LICENSE file for more info.

import {IPluginBackend, IPluginBackendFactory, PluginBackend} from './logic';

declare global {
    module chrome.webRequest {
        export interface WebRequestHeadersDetails {
            // Non-standard property only supported by Firefox
            originUrl?: string;
        }
    }
}

function getOriginHeader(headers: chrome.webRequest.HttpHeader[]): string {
    for (let header of headers) {
        switch (header.name.toLowerCase()) {
            case "origin":
            case "referer":
            case "referrer":
                return header.value;
        }
    }
}

function getOrigin(details: chrome.webRequest.WebRequestHeadersDetails): string {
    // Firefox provides details.originUrl, which is exactly what we need.
    if (details.originUrl !== undefined) {
        return details.originUrl;
    }
    // Use the headers to get the origin because tab.get is async
    // BUG: Doesn't work for https:// -> http:// connections
    const headers = details.requestHeaders;
    if (headers === undefined) {
        console.error("onBeforeSendHeaders: No request headers available");
        return;
    }
    return getOriginHeader(headers);
}

function getOutboundHeader(headers: chrome.webRequest.HttpHeader[]): string {
    for (let header of headers) {
        switch (header.name.toLowerCase()) {
            case "outbound-rules":
                return header.value;
        }
    }
}

// Wrapper class to translate from the plugin semantics to Web Extension API.
export class OutboundRulesPlugin {
    // Keep track of fresh requests. These are "initializing" requests: e.g.
    // when you enter a URL on the address bar and press enter: the "fresh"
    // request will be the one actually fetching that URL. This is marked by the
    // "beforeSendHeaders" handlers, but actually used by the "receivedHeaders"
    // handler to extract the Outbound-Rules header.
    private fresh: {[requestId: string]: boolean} = {};
    private backend: IPluginBackend;

    // verbosity:
    //   - 0: silent
    //   - 1: info
    //   - 2: debug
    constructor(private debug: number, backendConstructor: IPluginBackendFactory = PluginBackend) {
        this.backend = new backendConstructor(debug);
    }

    register(): void {
        const filter = {
            urls: ["<all_urls>"],
        };
        chrome.webRequest.onHeadersReceived.addListener(x => this.onHeadersReceived(x), filter, ["responseHeaders" /*,  "blocking"? would it be a race not to? */]);
        chrome.webRequest.onBeforeSendHeaders.addListener(x => this.onBeforeSendHeaders(x), filter, ["blocking", "requestHeaders"]);
    }

    // WebExtension handler called when headers are received but not yet
    // processed by the application.
    onHeadersReceived(details: chrome.webRequest.WebResponseHeadersDetails) {
        const headers = details.responseHeaders;
        if (headers === undefined) {
            console.error("onHeadersReceived: No response headers available");
            return;
        }

        if (this.debug >= 2) {
            const fresh = details.requestId in this.fresh ? "fresh" : "not fresh";
            console.log(`onHeadersReceived() (${fresh}):`, details);
        }

        if (!(details.requestId in this.fresh)) {
            // This is a subrequest of a tab (e.g. a loaded resource). Don't
            // use this to set the outbound rules.
            return;
        }
        delete this.fresh[details.requestId];

        const outboundRules = getOutboundHeader(headers);
        if (this.debug) {
            console.log(`Initializing rules for tab #${details.tabId} ${details.url}:`, outboundRules);
        }

        this.backend.initRequest(details.tabId, details.url, outboundRules);
    }

    // WebExtension handler called when a request is *about to get made*
    // but has not actually been sent yet. Last chance to cancel it.
    onBeforeSendHeaders(details: chrome.webRequest.WebRequestHeadersDetails) {
        const origin = getOrigin(details);

        if (this.debug >= 2) {
            console.log("onBeforeSendHeaders():", details, " -- origin:", origin);
        }

        if (origin === undefined || origin === details.url) {
            this.fresh[details.requestId] = true;
            return;
        }

        const accept = this.backend.shouldAccept(details.tabId, details.url, origin);

        // TODO: Don't use {cancel: ..} because a link visit will automatically reload (on Chrome)
        // https://github.com/hraban/outbound-rules/issues/1
        return { cancel: !accept };
    }
}
