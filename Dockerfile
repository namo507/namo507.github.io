# Base image: Ruby with necessary dependencies for Jekyll.
# Pinned to 3.3 to match .github/workflows/site-health.yml (ruby-version: '3.3')
# so local Docker builds and CI resolve identical native gems.
FROM ruby:3.3

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    && rm -rf /var/lib/apt/lists/*


# Create a non-root user with UID 1000
RUN groupadd -g 1000 vscode && \
    useradd -m -u 1000 -g vscode vscode

# Set the working directory
WORKDIR /usr/src/app

# Set permissions for the working directory
RUN chown -R vscode:vscode /usr/src/app

# Switch to the non-root user
USER vscode

# Copy the dependency manifests so bundle install matches the repo lockfile.
COPY Gemfile Gemfile.lock ./



# Install bundler and dependencies.
# Bundler is pinned to the version recorded in Gemfile.lock (BUNDLED WITH 2.4.19)
# so `bundle install` never rewrites the lockfile inside the image.
RUN gem install connection_pool:2.5.0
RUN gem install bundler:2.4.19
RUN bundle install

# Command to serve the Jekyll site
CMD ["jekyll", "serve", "-H", "0.0.0.0", "-w", "--config", "_config.yml,_config_docker.yml"]
