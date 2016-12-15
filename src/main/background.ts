// Copyright © 2016 Authors (see AUTHORS file)
//
// Licensed under the AGPL. See the LICENSE file for more info.


// Filter outgoing requests based on the Outbound-Rules header received from
// servers (if present).

import {OutboundRulesPlugin} from './webextension-wrapper';

var filter = {
    urls: ["<all_urls>"],
};

const plugin = new OutboundRulesPlugin(1);
chrome.webRequest.onHeadersReceived.addListener(x => plugin.onHeadersReceived(x), filter, ["responseHeaders" /*,  "blocking"? would it be a race not to? */]);
chrome.webRequest.onBeforeSendHeaders.addListener(x => plugin.onBeforeSendHeaders(x), filter, ["blocking", "requestHeaders"]);
