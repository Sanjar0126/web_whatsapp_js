FROM node:24.11.1-slim

RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
    >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
    # fonts-ipafont-gothic \
    # fonts-wqy-zenhei \
    # fonts-thai-tlwg \
    # fonts-kacst \
    # fonts-freefont-ttf \

RUN yarn global add puppeteer 
    # && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    # && mkdir -p /home/pptruser/Downloads \
    # && chown -R pptruser:pptruser /home/pptruser \
    # && mkdir -p /usr/local/share/.config \
    # && chown -R pptruser:pptruser /usr/local/share/.config

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

# to run Chrome without --no-sandbox
# USER pptruser

CMD ["yarn", "start"]
