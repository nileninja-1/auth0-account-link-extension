# Auth0 Account Link Extension

This extension provides a rule and interface for giving users the option of linking a new account
with an existing registered with the same email address from a different provider.

> **NOTE:** Please make sure you are using your own social connections (Google, Facebook, etc...) API keys. Using Auth0's keys will result on an 'Unauthorized' error on account linking skip.

## Example:
- You signed up with FooApp with your email, `greatname@example.com`.
- You come back some time later and forget whether you signed in with your email or Google account with the same email address.
- You try to use your Google account
- You're then greeted with the UI presented from this extension, asking you if
  you'd like to link this account created with your Google account with a
  pre-existing account (the original you created with a username and password).

## Running in Development

> **NOTE:** You will need your own NGROK_TOKEN. You can sign up for a free account at: https://dashboard.ngrok.com/signup

Update the configuration file under `./server/config.json`:

```json
{
  "EXTENSION_SECRET": "mysecret",
  "AUTH0_DOMAIN": "me.auth0.com",
  "AUTH0_CLIENT_ID": "myclientid",
  "AUTH0_CLIENT_SECRET": "myclientsecret",
  "WT_URL": "http://localhost:3000",
  "AUTH0_CALLBACK_URL": "http://localhost:3000/callback",
  "NGROK_TOKEN": "myngroktoken"
}
```

Then you can run the extension:

```bash
nvm use 22
yarn install
yarn run build
yarn run serve:dev
```

## Running puppeteer tests

In order to run the tests you'll have to [start the extension server locally](https://github.com/auth0-extensions/auth0-account-link-extension#running-in-development), fill the `config.test.json` file (normally with the same data as the `config.json` file) and run the Sample Test application located in `sample-app/` (create a dedicated client for this app).

Then, you can run the tests running:
```bash
yarn test
```

## Release Process

Deployment is handled by the GitHub Actions workflow (`.github/workflows/build.yml`). It runs automatically on:

1. Push/merge to `master` (stable release → prod CDN path `/extensions`)
2. Any pull request activity (open/update/reopen/labeled) that has the `publish-beta` label (beta pre-release → beta CDN path `/extensions/develop`)

### 1. Versioning
Stable releases: manually bump the semantic version in BOTH `package.json` and `webtask.json` on a branch that will merge to `master` (e.g. set to `3.5.0`).

Beta releases: DO NOT add a `-beta` suffix yourself. Label the PR with `publish-beta`. During the workflow the versions in `package.json` and `webtask.json` are rewritten (in the workspace of the build only) to:

```
<baseVersion>-beta.<RUN_NUMBER>
```

`<RUN_NUMBER>` is the monotonically increasing GitHub workflow run number, ensuring every beta publish produces a unique, non-overwritten artifact. Example: base `3.5.0` + run `451` → `3.5.0-beta.451`.

### 2. Open a PR
Commit the stable version bump + changes. When the PR merges to `master`, a stable publish occurs.

For a beta: open a PR from any internal branch, apply the `publish-beta` label. Each workflow run (new commit or relabel) generates a fresh `<base>-beta.<RUN_NUMBER>` version. Older beta versions remain in the CDN; only the major.minor alias (e.g. `3.5`) is overwritten.

### 3. Build Locally (if you want to verify before pushing)
```bash
nvm use 22
yarn install
yarn run build
```

Artifacts produced:
- Bundle file (`auth0-account-link.extension.VERSION.js`) is found in `/dist`
- Asset CSS files are found in `/dist/assets`

### 4. Publication Targets
The workflow/script (`tools/cdn.sh`) uploads to S3:
- Stable (no `beta` in version): `s3://assets.us.auth0.com/extensions/auth0-account-link/`
- Beta (version contains `beta`): `s3://assets.us.auth0.com/extensions/develop/auth0-account-link/`

We publish both a full version (eg: `1.2.3`), and a major.minor version (eg: `1.2`). The major.minor version will be overwritten on each publish, while the full version will NOT be overwritten. 

### 5. Caching & Re-Publishing
Stable: increment the version (e.g. `3.5.1`) to publish a new immutable full version plus updated major.minor alias.
Beta: every run already creates a unique `<base>-beta.<RUN_NUMBER>`; no manual increment needed unless you change the base version.

### 6. Testing a Beta or Candidate
Because beta assets are isolated under `extensions/develop`, production consumers will not pick them up automatically.

### 7. Promoting to Stable
Remove the `publish-beta` label, ensure `package.json` & `webtask.json` have the desired final version without any beta suffix (e.g. `3.5.0`), merge to `master`. A stable publish with immutable full version + refreshed major.minor alias occurs.
