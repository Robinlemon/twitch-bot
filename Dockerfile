FROM keymetrics/pm2:12-alpine
LABEL maintainer="Lewis Gibson <lewis-gibson@hotmail.com>"

# Custom directory
WORKDIR /usr/twitch-bot

# Install git
RUN set -x \
    && apk add --no-cache bash git openssh \
    && git --version && bash --version && ssh -V && npm -v && node -v && yarn -v

# Copy package.json and lockfile
COPY package.json yarn.lock ./

# Install runtime and buildtime dependencies
RUN yarn install

# Bundle source code
COPY . .

# Compile TypeScript source
RUN yarn build

# Run the application and expose private port to host
USER node
CMD [ "pm2-runtime", "./build/src/index.js" ]
