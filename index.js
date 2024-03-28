/// <reference types="semantic-release" />

// From https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#multiple-analyzecommits-plugins
// This is used to determine the priority of a release type. The higher the index, the higher the priority.
const releaseTypes = [
  "prerelease",
  "prepatch",
  "patch",
  "preminor",
  "minor",
  "premajor",
  "major",
];

function createGitHubApiFetcher(pluginConfig, context) {
  const apiUrl =
    pluginConfig.apiUrl ??
    context.env.GITHUB_API_URL ??
    "https://api.github.com";
  const token = pluginConfig.token ?? context.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      `Missing required option "token" in plugin config or GITHUB_TOKEN environment variable`
    );
  }
  return fetchGitHubApi;

  async function fetchGitHubApi(path, options) {
    const { queryParams } = options ?? {};
    const url =
      `${apiUrl}${path}` +
      (queryParams ? `?${new URLSearchParams(queryParams).toString()}` : "");
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${
          response.statusText
        }\n\n${await response.text()}`
      );
    }
    return response.json();
  }
}

function parseGitHubUrl(repositoryUrl) {
  const [match, auth, host, path] =
    /^(?!.+:\/\/)(?:(?<auth>.*)@)?(?<host>.*?):(?<path>.*)$/.exec(
      repositoryUrl
    ) || [];
  try {
    const [, owner, repo] =
      /^\/(?<owner>[^/]+)?\/?(?<repo>.+?)(?:\.git)?$/.exec(
        new URL(
          match
            ? `ssh://${auth ? `${auth}@` : ""}${host}/${path}`
            : repositoryUrl
        ).pathname
      );
    return { owner, repo };
  } catch {
    return undefined;
  }
}

function parseRepository(repository) {
  const match = /^([^/]+)\/([^/]+)$/.exec(repository);
  if (!match) {
    return undefined;
  }
  const [, owner, repo] = match;
  return { owner, repo };
}

function mapOptional(value, fn) {
  return value !== undefined ? fn(value) : undefined;
}

function getRepositoryInfo(pluginConfig, context) {
  return (
    mapOptional(pluginConfig.repository, parseRepository) ??
    mapOptional(context.options.repositoryUrl, parseGitHubUrl) ??
    mapOptional(context.env.GITHUB_REPOSITORY, parseRepository)
  );
}

async function getPullRequestInfo({ fetchGitHubApi, owner, repo, commit }) {
  const match = /^Merge pull request #(\d+) from/.exec(commit.subject);
  if (!match) {
    return;
  }
  const pullRequestNumber = parseInt(match[1], 10);
  const pullRequestInfo = await fetchGitHubApi(
    `/repos/${owner}/${repo}/pulls/${pullRequestNumber}`
  );
  return pullRequestInfo;
}

/**
 * Validate the plugin configuration.
 */
export function verifyConditions(pluginConfig, context) {
  if (!pluginConfig.labels) {
    throw new Error(`Missing required option "labels" in plugin config`);
  }
  if (typeof pluginConfig.labels !== "object") {
    throw new Error(`The "labels" option must be an object`);
  }
  for (const [label, releaseType] of Object.entries(pluginConfig.labels)) {
    if (!releaseTypes.includes(releaseType)) {
      throw new Error(
        `Invalid release type "${releaseType}" for label "${label}"`
      );
    }
  }
  createGitHubApiFetcher(pluginConfig, context);
  getRepositoryInfo(pluginConfig, context);
}

/**
 * Determine what release type the merged pull requests should result in.
 */
export async function analyzeCommits({ labels }, context) {
  const fetchGitHubApi = createGitHubApiFetcher(labels, context);
  const { owner, repo } = getRepositoryInfo(labels, context);

  // Keep track of the highest release type that we've found.
  // By default it has no release type.
  let releaseTypeIndex = -1;

  for (const commit of context.commits) {
    const pullRequestInfo = await getPullRequestInfo({
      fetchGitHubApi,
      owner,
      repo,
      commit,
    });
    if (!pullRequestInfo?.labels) {
      continue;
    }

    // Get the release type indexes for each label.
    const labelReleaseTypeIndexes = pullRequestInfo.labels.map((label) =>
      releaseTypes.indexOf(labels[label.name])
    );

    // Determine the highest release type index.
    releaseTypeIndex = Math.max(releaseTypeIndex, ...labelReleaseTypeIndexes);
  }
  return releaseTypes[releaseTypeIndex];
}

/**
 * Generate the release notes using GitHub release-note generator.
 */
export async function generateNotes(config, context) {
  const fetchGitHubApi = createGitHubApiFetcher(config, context);
  const { owner, repo } = getRepositoryInfo(config, context);

  const releaseNotes = await fetchGitHubApi(
    `/repos/${owner}/${repo}/releases/generate-notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag_name: context.nextRelease.gitTag,
        target_commitish: context.branch.name,
        previous_tag_name: context.lastRelease.gitTag,
      }),
    }
  );
  return releaseNotes.body;
}
