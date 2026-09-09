# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Two things ship from this file.
#
#   dev      ruby + `jekyll serve`, bind-mounted by docker-compose and used as
#            the devcontainer. Rebuilds on edit; not a web server.
#   runtime  the website itself: the site built once, then served by nginx.
#            This is the default target, so a bare `docker build .` produces
#            the thing that represents production rather than a dev server.
#
# `jekyll serve` is a single-threaded development server with no compression
# and no cache headers. It is right for editing and wrong for serving, so the
# two are now separate images instead of one doing both jobs badly.
# ---------------------------------------------------------------------------

FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
# Cache mounts keep the dependency download out of every rebuild; the layer
# still busts correctly because the lockfile is copied above them.
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build:cosmic

# Ruby toolchain and gems, shared by dev and the site build.
FROM ruby:3.3-slim-bookworm AS jekyll-base
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl git \
    && rm -rf /var/lib/apt/lists/*
ENV BUNDLE_FROZEN=true \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3
WORKDIR /usr/src/app
COPY Gemfile Gemfile.lock ./
RUN --mount=type=cache,target=/usr/local/bundle/cache \
    gem install bundler:2.4.19 --no-document && bundle install

# ---------------------------------------------------------------------------
# dev: live-editing container. compose overlays the working tree over /usr/src/app.
# ---------------------------------------------------------------------------
FROM jekyll-base AS dev
ARG SITE_REVISION=local
ENV JEKYLL_ENV=production
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
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", \
     "--force_polling", "--config", "_config.yml,_config_docker.yml"]

# ---------------------------------------------------------------------------
# builder: one production build of the site.
# ---------------------------------------------------------------------------
FROM jekyll-base AS builder
ARG SITE_REVISION=local
ENV JEKYLL_ENV=production
COPY . .
COPY --from=frontend /build/assets/cosmic /usr/src/app/assets/cosmic
RUN bundle exec jekyll build --trace --destination /site \
    && printf '{"sha":"%s"}\n' "$SITE_REVISION" > /site/site-revision.json

# ---------------------------------------------------------------------------
# runtime: nginx serving the built site. Default target.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
ARG SITE_REVISION=local
LABEL org.opencontainers.image.title="namo507 portfolio" \
      org.opencontainers.image.source="https://github.com/namo507/namo507.github.io" \
      org.opencontainers.image.revision="${SITE_REVISION}"
RUN apk add --no-cache curl
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /site /usr/share/nginx/html
# nginx's own user, so nothing runs as root beyond the master process.
RUN chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl --fail --silent --max-time 4 --output /dev/null http://127.0.0.1:4000/ || exit 1
