# semantic-release-pull-request-analyzer

A plugin for semantic-release that analyzes GitHub pull request labels instead of semantic commit messages. It allows using `semantic-release` without requiring semantic-commits.

It goes through commits and looks up the labels of the associated merged pull requests. From the labels it determines the release type.

In addition, it uses [GitHub automatically generates release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes) to generate release notes. This may be configured using [`release.yml`](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes#example-configurations).

## Usage

The plugin can be configured in the [semantic-release configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    [
      "@bobvanderlinden/semantic-release-pull-request-analyzer",
      {
        "labels": {
          "enhancement": "minor",
          "documentation": "patch",
          "bug": "patch"
        }
      }
    ]
  ]
}
```

With this example:

- merged pull requests with label `enhancement` will result in a `minor` release.
- merged pull requests with label `documentation` will result in a `patch` release.
- merged pull requests with label `bug` will result in a `patch` release.

Note that this plugin will only associate pull requests with the merge-commit title `Merged pull request #XXX from`. This is the default merge-commit title that GitHub uses for non-squash, non-rebase merges.

## Configuration

Make sure there is a valid `GITHUB_TOKEN` that has at least `contents: read` rights.

Make sure `@semantic-release/commit-analyzer` nor `@semantic-release/release-notes-generator` are included plugins. These plugins conflict with the commit analyzer and release note generator of `semantic-release-pull-request-analyzer`.

### Options

| Option | Description |
| ------ | ----------- |
| `labels` | Required. An object that maps GitHub pull request labels to release types. The keys are the label names and the values are the corresponding release types. |
| `repository` | Optional. The owner/repo of the GitHub repository. Example `myusername/myproject`. Defaults to using `GITHUB_REPOSITORY`. |
| `apiUrl` | Optional. The GitHub API URL. Defaults to `GITHUB_API_URL`. |
| `token` | Optional. The GitHub token. Defaults to `GITHUB_TOKEN`. |

Possible release types are:

- `prerelease`
- `prepatch`
- `patch`
- `preminor`
- `minor`
- `premajor`
- `major`

### Environment variables

| Variable              | Description                           |
| --------------------- | ------------------------------------- |
| `GITHUB_TOKEN`        | Required. Token for GitHub API access. |
| `GITHUB_API_URL`      | Optional. URL for the GitHub API. Defaults to `https://api.github.com`              |
| `GITHUB_REPOSITORY`   | Optional. Owner/repo of the GitHub repository. Example `myusername/myproject`. Defaults to [`repositoryUrl`](https://semantic-release.gitbook.io/semantic-release/usage/configuration#repositoryurl)       |
