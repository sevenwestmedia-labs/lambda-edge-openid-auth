# lambda-edge-openid-auth

## Usage

```ts
import { authenticateViewerRequest } from '@wanews/lambda-edge-openid-auth'
import { CloudFrontRequestHandler } from 'aws-lambda'
import pino from 'pino'

export const handler: CloudFrontRequestHandler = async (event, context) => {
  const record = event.Records[0]
  const request = record.cf.request
  const log = pino({})

  // Commit the jwks response into your repo (see below to keep updated)
  const jwks = require('../azure-login-jwks.json')

  return authenticateViewerRequest(
    {
      unauthenticatedPaths: ['/assets'],
      idps: [
        {
          clientId: '<client-id>',
          clientSecret: '<client-secret>',
          name: 'Company Azure AD',
          props: {
            type: 'azuread',
            tenantId: '<tenant-id>',
            jwks,
          },
        },
      ],
    },
    log,
    request,
  )
}
```

## Handling key rotation

Azure AD keys can be rotated at any time, so you need to check regularly for rotation
and redeploy to update the keys.

### Updating keys with github actions

```yaml
#.github/workflows/update-azure-jwks.yml
name: 'Update azure login JWKS'
concurrency: deployment
env:
  JWKS_PATH: path-to/azure-login-jwks.json
  # Tenant id doesn't actually matter - all the keys are the same but you need a valid one
  TENANT_ID: 'your-tenant-id'
on:
  schedule:
    - cron: '30 8 * * *'
jobs:
  redeploy-on-key-change:
    runs-on: self-hosted
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Fetch Azure JWKS
        run: |
          curl -o "$JWKS_PATH" "https://login.microsoftonline.com/$TENANT_ID/discovery/keys"
          git config user.email "github.serviceaccount@wanews.com.au"
          git config user.name "SWM GitHub Service Account"
          git add "$JWKS_PATH"
          git commit -m "Update azure login JWKS" || echo "No changes to commit"
          git pull --rebase
          git push
```
