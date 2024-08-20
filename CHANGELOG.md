## 1.1.1 (2024-08-20)

This was a version bump only, there were no code changes.

## 1.1.0 (2024-08-20)

- allow OIDC scope to be overridden using config [#12]

# 1.0.0 (2024-08-17)

- update to nx 19.6.0
- update to node 20
- update typescript to 5.5.4
- remove unused aws-lambda dependency (only using `@types/aws-lambda`)
- update jsonwebtoken to 9.0.2
- update jwk-to-pem to 2.0.6
- update query-string to 9.1.0
- update pino to 9.3.2
- update cookie to 0.6.0
- update node-fetch to 3.3.2
- refactored from an nx monorepo to a standalone nx package

## 0.2.1

### Patch Changes

- 2968a98: Remove node-jose

## 0.2.0

### Minor Changes

- 35d744b: Breaking change - remove hardcoded jwks from repo and move to config

## 0.1.2

### Patch Changes

- 00d4447: Update azuread jwks keys

## 0.1.1

### Patch Changes

- d885f46: Await the async callback handlers since they throw errors which are caught and error responses are returned

## 0.1.0

### Minor Changes

- 483ed1a: Added token refresh endpoint

## 0.0.8

### Patch Changes

- e231d8f: Added missing jwks keys for azuread

## 0.0.7

### Patch Changes

- 997b27b: Explicity set the domain in set-cookie responses, and ensure secure: true
- 1d995db: clear cookies in 400 error page

## 0.0.6

### Patch Changes

- 8bb0c71: Fixed trailing comma appearing in selectIdp page when multiple IDPs are defined

## 0.0.4

### Patch Changes

- d0cc0af: Set dependencies in package.json

## 0.0.3

### Patch Changes

- 7b60ce2: More build issue fixes

## 0.0.2

### Patch Changes

- 91e774b: Fixed build issue

## 0.0.1

### Patch Changes

- 31d9dcf: Fixed dependencies in package.json
