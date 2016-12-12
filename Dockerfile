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

