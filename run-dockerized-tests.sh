#!/bin/bash

# This system would be better off having separate containers for:
#
# - compiling the plugin
# - running headless chrome in xvfb
# - compiling and running the integration tests
#
# But that won't work because:
#
# - oh my god, seriously. no way.
# - you can't load extensions dynamically through remote selenium drivers
#
# So I compile, serve and run everything in one nice fat container. Yay!

set -eu -o pipefail


# Launch xvfb and a selenium server. We don't actually use the latter, but the
# xvfb launching is some voodoo that I'd rather not get too involved with.
/opt/bin/entry_point.sh &
# No need to wait, npm test starts with unit tests anyway.
#sleep 3

# Run the tests
npm test
