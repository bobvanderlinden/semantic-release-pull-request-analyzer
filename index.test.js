import { describe, it } from "node:test";
import assert from "node:assert";
import { extractPullRequestNumber } from "./index.js";

describe("extractPullRequestNumber", () => {
  it("extracts PR number from normal merge commit", () => {
    const subject = "Merge pull request #123 from feature/branch";
    assert.strictEqual(extractPullRequestNumber(subject), 123);
  });

  it("extracts PR number from squash merge commit", () => {
    const subject = "feat: add new feature (#456)";
    assert.strictEqual(extractPullRequestNumber(subject), 456);
  });

  it("extracts PR number from squash merge with complex title", () => {
    const subject = "[#144] Remove v prefix from semantic-release tags (#143)";
    assert.strictEqual(extractPullRequestNumber(subject), 143);
  });

  it("returns null for regular commits without PR reference", () => {
    const subject = "fix: update dependencies";
    assert.strictEqual(extractPullRequestNumber(subject), null);
  });

  it("returns null for commits with issue reference in middle", () => {
    const subject = "fix issue #123 in module";
    assert.strictEqual(extractPullRequestNumber(subject), null);
  });

  it("handles PR number with trailing whitespace", () => {
    const subject = "feat: add feature (#789)  ";
    assert.strictEqual(extractPullRequestNumber(subject), 789);
  });
});
