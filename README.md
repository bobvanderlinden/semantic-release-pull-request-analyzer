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
          "feature": "minor",
          "fix": "patch",
          "bug": "patch"
        }
      }
    ]
  ]
}
```

With this example:

* the merged pull requests with label `feature` will be associated with a `minor` release.
* the merged pull requests with label `fix` will be associated with a `patch` release.

Make sure you do _not_ include `@semantic-release/commit-analyzer` nor `@semantic-release/release-notes-generator`. These plugins rely on semantic-commit messages.

In addition, you should set the environment variable `GITHUB_TOKEN` in order for the plugin to communicate with GitHub APIs.

Note that this plugin will only associate pull requests with the merge-commit title `Merged pull request #XXX from`. This is the default merge-commit title that GitHub uses for non-squash, non-rebase merges.
