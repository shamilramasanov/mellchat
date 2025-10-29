20:59:55.014 Running build in Washington, D.C., USA (East) – iad1
20:59:55.015 Build machine configuration: 4 cores, 8 GB
20:59:55.165 Cloning github.com/shamilramasanov/mellchat (Branch: main, Commit: c4b8094)
20:59:55.437 Previous build caches not available.
20:59:55.725 Cloning completed: 559.000ms
20:59:55.804 Found .vercelignore (repository root)
20:59:55.820 Removed 110 ignored files defined in .vercelignore
20:59:55.820   /.git/config
20:59:55.820   /.git/description
20:59:55.820   /.git/FETCH_HEAD
20:59:55.820   /.git/HEAD
20:59:55.820   /.git/hooks/applypatch-msg.sample
20:59:55.820   /.git/hooks/commit-msg.sample
20:59:55.820   /.git/hooks/fsmonitor-watchman.sample
20:59:55.820   /.git/hooks/post-update.sample
20:59:55.820   /.git/hooks/pre-applypatch.sample
20:59:55.821   /.git/hooks/pre-commit.sample
20:59:56.087 Running "vercel build"
20:59:56.517 Vercel CLI 48.6.0
20:59:57.150 Warning: Detected "engines": { "node": ">=22.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
20:59:57.155 Running "install" command: `npm install`...
21:00:20.675 npm warn deprecated sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead
21:00:21.559 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
21:00:21.559 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
21:00:21.626 npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions
21:00:21.748 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
21:00:22.326 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
21:00:22.425 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
21:00:24.354 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
21:00:29.267 
21:00:29.268 added 503 packages, and audited 505 packages in 32s
21:00:29.268 
21:00:29.268 131 packages are looking for funding
21:00:29.268   run `npm fund` for details
21:00:29.275 
21:00:29.276 3 moderate severity vulnerabilities
21:00:29.276 
21:00:29.276 To address all issues (including breaking changes), run:
21:00:29.276   npm audit fix --force
21:00:29.276 
21:00:29.276 Run `npm audit` for details.
21:00:29.646 
21:00:29.646 > mellchat-pwa@2.0.1 build
21:00:29.646 > vite build
21:00:29.647 
21:00:31.750 [36mvite v5.4.21 [32mbuilding for production...[36m[39m
21:00:31.810 transforming...
21:00:32.049 [32m✓[39m 42 modules transformed.
21:00:35.638 
21:00:35.638 PWA v0.17.5
21:00:35.638 mode      generateSW
21:00:35.638 precache  9 entries (0.00 KiB)
21:00:35.638 files generated
21:00:35.638   dist/sw.js
21:00:35.638   dist/workbox-5fa6c2c6.js
21:00:35.639 warnings
21:00:35.639   One of the glob patterns doesn't match any files. Please remove or fix the following: {
21:00:35.639   "globDirectory": "/vercel/path0/frontend/pwa/dist",
21:00:35.639   "globPattern": "**/*.{js,wasm,css,html}",
21:00:35.639   "globIgnores": [
21:00:35.639     "**/node_modules/**/*",
21:00:35.639     "sw.js",
21:00:35.639     "workbox-*.js"
21:00:35.639   ]
21:00:35.639 }
21:00:35.639 
21:00:35.646 [31mx[39m Build failed in 3.87s
21:00:35.646 [31merror during build:
21:00:35.646 [31m[vite-plugin-pwa:build] [plugin vite-plugin-pwa:build] There was an error during the build:
21:00:35.646   [vite]: Rollup failed to resolve import "zustand" from "/vercel/path0/frontend/pwa/src/features/auth/store/authStore.js".
21:00:35.647 This is most likely unintended because it can break your application at runtime.
21:00:35.647 If you do want to externalize this module explicitly add it to
21:00:35.647 `build.rollupOptions.external`
21:00:35.647 Additionally, handling the error in the 'buildEnd' hook caused the following error:
21:00:35.647   [vite]: Rollup failed to resolve import "zustand" from "/vercel/path0/frontend/pwa/src/features/auth/store/authStore.js".
21:00:35.647 This is most likely unintended because it can break your application at runtime.
21:00:35.647 If you do want to externalize this module explicitly add it to
21:00:35.647 `build.rollupOptions.external`[31m
21:00:35.647     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
21:00:35.647     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:23322:39
21:00:35.647     at async catchUnfinishedHookActions (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22780:16)
21:00:35.647     at async rollupInternal (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:23305:5)
21:00:35.647     at async build (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65709:14)
21:00:35.647     at async CAC.<anonymous> (file:///vercel/path0/node_modules/vite/dist/node/cli.js:829:5)[39m
21:00:35.669 npm error Lifecycle script `build` failed with error:
21:00:35.669 npm error code 1
21:00:35.669 npm error path /vercel/path0/frontend/pwa
21:00:35.669 npm error workspace mellchat-pwa@2.0.1
21:00:35.669 npm error location /vercel/path0/frontend/pwa
21:00:35.669 npm error command failed
21:00:35.670 npm error command sh -c vite build
21:00:35.677 Error: Command "npm run build" exited with 1