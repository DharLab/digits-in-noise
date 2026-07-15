# digits-in-noise

Digits-in-Noise implementation for the NextGenOAE project at the Auditory Research Lab, Northwestern University.

# digits-in-noise
Temporary deployment link: https://lustrous-mermaid-bdd819.netlify.app/

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```
Open the application in your browser at http://localhost:5173

### Deployment

```sh
npm run build
# this will create a /dist folder in your local environment
```
- Login into Firebase with 
- Install firebase CLI

```shell
firebase login
# login with nuhearing.webapps@gmail.com 
firebase deploy
```

- App URL https://digits-in-noise.web.app

## Testing

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

## Linting

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
