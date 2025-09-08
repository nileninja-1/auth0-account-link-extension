/*
 * Automatically adjust package.json and webtask.json versions for beta publishes.
 * Triggered only in pull_request context when the PR has the 'publish-beta' label.
 *
 * Rules:
 *  - Reads current package.json version (e.g., 3.1.0).
 *  - Produces a beta version: <MAJOR>.<MINOR>.<PATCH>-beta.<SEQ>
 *    where <SEQ> is an incrementing number (GITHUB_RUN_NUMBER) so each run
 *    creates a unique beta artifact without overwriting previous ones.
 *    (If patch already contains -beta, it's replaced.)
 *  - Writes back to package.json and webtask.json.
 *  - Echoes the new version so subsequent steps (build, cdn.sh) use it.
 */

const fs = require('fs');
const path = require('path');

function computeBeta(baseVersion, sequence) {
  // Strip existing beta suffix if present.
  const core = baseVersion.split('-')[0];
  return `${core}-beta.${sequence}`;
}

function updateFile(filePath, newVersion) {
  const src = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(src);
  json.version = newVersion;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
}

function run() {
  // Sequence number is provided as first CLI argument. Fallback to '0' if missing.
  const sequence = process.argv[2] || '0';
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const webtaskPath = path.join(__dirname, '..', 'webtask.json');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const baseVersion = pkg.version;
  const betaVersion = computeBeta(baseVersion, sequence);

  updateFile(pkgPath, betaVersion);
  updateFile(webtaskPath, betaVersion);

  console.log(`Beta version injected (sequence ${sequence}): ${betaVersion}`);
}

run();
