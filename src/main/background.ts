// Copyright © 2016 Authors (see AUTHORS file)
//
// Licensed under the AGPL. See the LICENSE file for more info.


// Filter outgoing requests based on the Outbound-Rules header received from
// servers (if present).

import {OutboundRulesPlugin} from './webextension-wrapper';

function main() {
    const plugin = new OutboundRulesPlugin(0);
    plugin.register();
}

main();