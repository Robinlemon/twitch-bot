FROM keymetrics/pm2:12-alpine
LABEL maintainer="Lewis Gibson <lewis-gibson@hotmail.com>"

# Custom directory
WORKDIR /usr/twitch-bot

# Copy package.json and lockfile
COPY package.json yarn.lock ./

# Install runtime and buildtime dependencies
RUN yarn install

# Bundle source code
COPY . .

# Compile TypeScript source
RUN yarn build

# Only keep runtime dependencies
RUN yarn install --production --ignore-scripts --prefer-offline --force

# Install PM2 services
RUN pm2 install pm2-auto-pull
RUN pm2 install pm2-server-monit

# Run the application and expose private port to host
USER node
CMD [ "pm2-runtime", "./build/src/index.js" ]
