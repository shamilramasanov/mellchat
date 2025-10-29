20:26:35.149 Running build in Washington, D.C., USA (East) – iad1
20:26:35.150 Build machine configuration: 4 cores, 8 GB
20:26:35.161 Cloning github.com/shamilramasanov/mellchat (Branch: main, Commit: 6b3b5d3)
20:26:35.176 Skipping build cache, deployment was triggered without cache.
20:26:35.515 Cloning completed: 352.000ms
20:26:35.577 Found .vercelignore
20:26:35.584 Removed 70 ignored files defined in .vercelignore
20:26:35.584   /backend/api-gateway/.gitignore
20:26:35.584   /backend/api-gateway/apply_indexes.sh
20:26:35.584   /backend/api-gateway/apply_user_sessions_migration.sh
20:26:35.584   /backend/api-gateway/database/migrations/add_advanced_indexes.sql
20:26:35.584   /backend/api-gateway/database/migrations/add_critical_indexes.sql
20:26:35.585   /backend/api-gateway/database/migrations/add_materialized_views.sql
20:26:35.585   /backend/api-gateway/database/migrations/add_performance_monitoring.sql
20:26:35.585   /backend/api-gateway/database/migrations/add_user_sessions.sql
20:26:35.585   /backend/api-gateway/database/migrations/fix_schema_critical.sql
20:26:35.585   /backend/api-gateway/database/migrations/fix_user_id.sql
20:26:35.817 Running "vercel build"
20:26:36.229 Vercel CLI 48.6.0
20:26:36.876 Warning: Detected "engines": { "node": ">=22.0.0" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: http://vercel.link/node-version
20:26:36.882 Running "install" command: `cd frontend/pwa && npm install`...
20:26:39.150 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
20:26:39.311 npm warn deprecated sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead
20:26:39.743 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
20:26:39.777 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
20:26:39.963 npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions
20:26:40.565 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
20:26:40.579 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
20:26:42.685 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
20:26:47.881 
20:26:47.881 added 500 packages, and audited 501 packages in 11s
20:26:47.881 
20:26:47.881 133 packages are looking for funding
20:26:47.882   run `npm fund` for details
20:26:47.894 
20:26:47.894 3 moderate severity vulnerabilities
20:26:47.894 
20:26:47.894 To address all issues (including breaking changes), run:
20:26:47.895   npm audit fix --force
20:26:47.895 
20:26:47.895 Run `npm audit` for details.
20:26:49.010 
20:26:49.011 up to date, audited 501 packages in 896ms
20:26:49.011 
20:26:49.011 133 packages are looking for funding
20:26:49.011   run `npm fund` for details
20:26:49.020 
20:26:49.020 3 moderate severity vulnerabilities
20:26:49.020 
20:26:49.020 To address all issues (including breaking changes), run:
20:26:49.020   npm audit fix --force
20:26:49.020 
20:26:49.020 Run `npm audit` for details.
20:26:49.145 
20:26:49.145 > mellchat-pwa@2.0.0 build
20:26:49.145 > vite build
20:26:49.145 
20:26:49.458 [36mvite v5.4.21 [32mbuilding for production...[36m[39m
20:26:49.517 transforming...
20:26:49.557 [32m✓[39m 4 modules transformed.
20:26:53.173 
20:26:53.173 PWA v0.17.5
20:26:53.173 mode      generateSW
20:26:53.173 precache  9 entries (0.00 KiB)
20:26:53.173 files generated
20:26:53.174   dist/sw.js
20:26:53.174   dist/workbox-629f8be9.js
20:26:53.174 warnings
20:26:53.174   One of the glob patterns doesn't match any files. Please remove or fix the following: {
20:26:53.174   "globDirectory": "/vercel/path0/frontend/pwa/dist",
20:26:53.174   "globPattern": "**/*.{js,wasm,css,html}",
20:26:53.174   "globIgnores": [
20:26:53.174     "**/node_modules/**/*",
20:26:53.174     "sw.js",
20:26:53.174     "workbox-*.js"
20:26:53.174   ]
20:26:53.174 }
20:26:53.175 
20:26:53.181 [31mx[39m Build failed in 3.70s
20:26:53.181 [31merror during build:
20:26:53.181 [31m[vite-plugin-pwa:build] [plugin vite-plugin-pwa:build] There was an error during the build:
20:26:53.181   [vite]: Rollup failed to resolve import "react-i18next" from "/vercel/path0/frontend/pwa/src/main.jsx".
20:26:53.181 This is most likely unintended because it can break your application at runtime.
20:26:53.181 If you do want to externalize this module explicitly add it to
20:26:53.181 `build.rollupOptions.external`
20:26:53.181 Additionally, handling the error in the 'buildEnd' hook caused the following error:
20:26:53.182   [vite]: Rollup failed to resolve import "react-i18next" from "/vercel/path0/frontend/pwa/src/main.jsx".
20:26:53.182 This is most likely unintended because it can break your application at runtime.
20:26:53.182 If you do want to externalize this module explicitly add it to
20:26:53.182 `build.rollupOptions.external`[31m
20:26:53.182     at getRollupError (file:///vercel/path0/frontend/pwa/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
20:26:53.182     at file:///vercel/path0/frontend/pwa/node_modules/rollup/dist/es/shared/node-entry.js:23322:39
20:26:53.182     at async catchUnfinishedHookActions (file:///vercel/path0/frontend/pwa/node_modules/rollup/dist/es/shared/node-entry.js:22780:16)
20:26:53.182     at async rollupInternal (file:///vercel/path0/frontend/pwa/node_modules/rollup/dist/es/shared/node-entry.js:23305:5)
20:26:53.182     at async build (file:///vercel/path0/frontend/pwa/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65709:14)
20:26:53.182     at async CAC.<anonymous> (file:///vercel/path0/frontend/pwa/node_modules/vite/dist/node/cli.js:829:5)[39m
20:26:53.209 Error: Command "cd frontend/pwa && npm install && npm run build" exited with 1