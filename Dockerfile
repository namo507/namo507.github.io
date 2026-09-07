FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:cosmic

# Keep Ruby aligned with the GitHub Actions build and use the committed lockfile.
FROM ruby:3.3-slim-bookworm
ARG SITE_REVISION=local
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl git \
    && rm -rf /var/lib/apt/lists/*
ENV BUNDLE_FROZEN=true \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3 \
    JEKYLL_ENV=development
WORKDIR /usr/src/app
COPY Gemfile Gemfile.lock ./
RUN gem install bundler:2.4.19 --no-document && bundle install
RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid vscode --create-home vscode
COPY --chown=vscode:vscode . .
COPY --from=frontend --chown=vscode:vscode /build/assets/cosmic /usr/src/app/assets/cosmic
RUN mkdir -p _site .sass-cache \
    && printf '{"sha":"%s"}\n' "$SITE_REVISION" > site-revision.json \
    && chown -R vscode:vscode /usr/src/app
USER vscode
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=6s --start-period=90s --retries=3 \
    CMD curl --fail --silent --max-time 5 --output /dev/null http://127.0.0.1:4000/ || exit 1
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--force_polling", "--config", "_config.yml,_config_docker.yml"]
