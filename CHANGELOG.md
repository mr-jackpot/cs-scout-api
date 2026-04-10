# Changelog

## [1.3.4](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.3.3...cs-scout-api-v1.3.4) (2026-04-10)


### Bug Fixes

* revert to --allow-unauthenticated flag on deploy instead of separate IAM binding step ([#26](https://github.com/mr-jackpot/cs-scout-api/issues/26)) ([3c55844](https://github.com/mr-jackpot/cs-scout-api/commit/3c558442f7e58794f92bfb5f818d385ae4976626))

## [1.3.3](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.3.2...cs-scout-api-v1.3.3) (2026-04-10)


### Bug Fixes

* explicitly grant allUsers invoker role after deploy ([#24](https://github.com/mr-jackpot/cs-scout-api/issues/24)) ([02e2013](https://github.com/mr-jackpot/cs-scout-api/commit/02e2013411df0785248471860784a20eec039dc2))

## [1.3.2](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.3.1...cs-scout-api-v1.3.2) (2026-04-10)


### Bug Fixes

* use pipe delimiter in gcloud set-env-vars to allow commas in ALLOWED_ORIGINS ([#22](https://github.com/mr-jackpot/cs-scout-api/issues/22)) ([5840da1](https://github.com/mr-jackpot/cs-scout-api/commit/5840da1020b79dd2ed19cbb443378ce2b093366e))

## [1.3.1](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.3.0...cs-scout-api-v1.3.1) (2026-04-10)


### Bug Fixes

* add CORS wildcard support and configure allowed origins for production ([#20](https://github.com/mr-jackpot/cs-scout-api/issues/20)) ([a8a9bca](https://github.com/mr-jackpot/cs-scout-api/commit/a8a9bca9753373faa2ba1d00a8b3c55929759db1))

## [1.3.0](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.2.1...cs-scout-api-v1.3.0) (2026-04-10)


### Features

* expand FACEIT stats with per-map breakdown and match history endpoint ([#18](https://github.com/mr-jackpot/cs-scout-api/issues/18)) ([bb00121](https://github.com/mr-jackpot/cs-scout-api/commit/bb00121f7c0d125975931e6fe1046de2b0a9d9fd))

## [1.2.1](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.2.0...cs-scout-api-v1.2.1) (2026-04-09)


### Bug Fixes

* wrap vi.useFakeTimers/useRealTimers in block bodies to satisfy tsc ([eff96b8](https://github.com/mr-jackpot/cs-scout-api/commit/eff96b84f8cf161db592c1963c376a44f794cd8a))

## [1.2.0](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.1.0...cs-scout-api-v1.2.0) (2026-04-09)


### Features

* added node-cache and fix for 429 ([f24bc92](https://github.com/mr-jackpot/cs-scout-api/commit/f24bc9272b27cf6c829b31affe5681183c9798f2))
* added node-cache and fix for 429 ([f24bc92](https://github.com/mr-jackpot/cs-scout-api/commit/f24bc9272b27cf6c829b31affe5681183c9798f2))

## [1.1.0](https://github.com/mr-jackpot/cs-scout-api/compare/cs-scout-api-v1.0.0...cs-scout-api-v1.1.0) (2026-04-09)


### Features

* added api key header ([318802a](https://github.com/mr-jackpot/cs-scout-api/commit/318802ab609b5cef25953c0df3c69f0a5d710900))
* added getPlayer endpoint ([b68f4be](https://github.com/mr-jackpot/cs-scout-api/commit/b68f4be6fdf4f7df16f3deb34e516d237d7081b0))
* added security features ([ddbbb6a](https://github.com/mr-jackpot/cs-scout-api/commit/ddbbb6a37420f5ee5c3c5e41e60311df496f6c2d))
* added tests ([b9579c7](https://github.com/mr-jackpot/cs-scout-api/commit/b9579c7d6a7f56b75fe83c9f0b31fe1d96ecf1cd))
* cleaned up endpoints and simplify ([93be9f2](https://github.com/mr-jackpot/cs-scout-api/commit/93be9f26cbad5702abfc7b3aa57c1405cdf4b34f))
* enabled gcp cloud run deployments ([75dffce](https://github.com/mr-jackpot/cs-scout-api/commit/75dffce18789aaf3e28ee640b92fccf41ee95658))
* fixed bug where api key was not enforced ([c384540](https://github.com/mr-jackpot/cs-scout-api/commit/c384540b23682b626faf2418fd1b9b739b45e968))
* init ap ([2b4765f](https://github.com/mr-jackpot/cs-scout-api/commit/2b4765fe49b25666b050e32c4f855493a47a2fdd))
* paginated faceit matches to reach 500 total ([d4d5b5a](https://github.com/mr-jackpot/cs-scout-api/commit/d4d5b5ab8f58dc1ec8c6f50366b6eb65a085939e))
* pr review ([a33a969](https://github.com/mr-jackpot/cs-scout-api/commit/a33a969436c29626f2acb2d93aef3ed1f9ffbfbc))
* returning more profile data ([dd6f741](https://github.com/mr-jackpot/cs-scout-api/commit/dd6f7413baaca7b7f149a101d40bc370f9c4b995))
* unit tests ([47ddac8](https://github.com/mr-jackpot/cs-scout-api/commit/47ddac8c8640239e8a206ce261a540fc84fdb808))
* updated npm build ([e436c2b](https://github.com/mr-jackpot/cs-scout-api/commit/e436c2b9e716b9b83cf56ca2133c47baf9f84764))


### Bug Fixes

* add node globals to eslint config to resolve no-undef errors ([aab58ff](https://github.com/mr-jackpot/cs-scout-api/commit/aab58ff78eda1cf0a0330c26268ad21170b73c8b))
* address copilot pr review comments ([799cb91](https://github.com/mr-jackpot/cs-scout-api/commit/799cb91cd31b2e691afb4b16d7ca9134bb57993f))
* address PR review comments ([c1d7faa](https://github.com/mr-jackpot/cs-scout-api/commit/c1d7faa275feb923f633364c11823fd505f65744))
* revert to github secrets for env vars in cloud run deploy ([cd56f6f](https://github.com/mr-jackpot/cs-scout-api/commit/cd56f6f2db5caf6c54059697b76383e7356b551d))
* updated limit ([95da041](https://github.com/mr-jackpot/cs-scout-api/commit/95da0417f768c79d9c3801064e2ab62712bcdb3b))
