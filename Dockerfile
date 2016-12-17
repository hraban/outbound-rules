#####
#
# If you ever run into trouble because:
#
#     error TS5033: Could not write file '/app/build/js/__tests__/match-test.js': EACCES: permission denied, open '/app/build/js/__tests__/match-test.js'
#
# what you're seeing is the combination of:
#
# * a Docker bug (ADD and COPY don't honour USER---files are always added as
#   root), and
# * you built the docker image from a "dirty" working directory.
#
# Your working dir already had a "build" dir, which was added as root. Now the
# unit tests (which run as seluser) can't overwrite those files.
#
# To fix it, commit all your outstanding changes to git, and:
#
#     $ git clean -dfx
#
######



FROM selenium/standalone-chrome:3.0.1-aluminum


USER root
RUN apt-get -y update && apt-get -y install zip jq curl

# Install latest nodejs
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get -y update && apt-get -y install nodejs

# Init app dir
RUN mkdir -p /app && chown seluser /app
USER seluser
WORKDIR /app
ADD package.json /app/
RUN npm install
# Only reinstall dependencies if package.json changed
ADD . /app/

CMD /app/run-dockerized-tests.sh

