# lambda-edge-openid-auth

TODO: fixme

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
          clientId: '7804a3f3-5cd6-4ed6-8066-bb8819ee7d92',
          clientSecret: 'cktzg9nm10001isg55bazg2g8',
          name: 'Company Azure AD',
          props: {
            type: 'azuread',
            tenantId: 'e5c524fa-185a-4083-b1f1-2032f6bacbd1',
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

`````yaml
#.github/actions/update-azure-jwks/action.yml
name: 'Update azure login JWKS'
concurrency: deployment
env:
  JWKS_PATH: path/to-jwks.json
on:
  push:
    branches:
      - master
  schedule:
    - cron: '30 8 * * *'
jobs:
  redeploy-on-key-change:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0

      - name: Setup Github Runner
        uses: ./.github/actions/setup-github-runner
        with:
          setup-pulumi: false

      - name: Fetch Azure JWKS
        with:
          tenant_id: 'your-tenant-id'
        run: curl -o ${{JWKS_PATH}} https://login.microsoftonline.com/${{tenant_id}}/discovery/keys

      - name: Commit Changes
        continue-on-error: true
        run: |
          git config user.email "github.serviceaccount@wanews.com.au"
          git config user.name "SWM GitHub Service Account"
          git add ${{JWKS_PATH}}
          git commit -m "Update azure login JWKS" || echo "No changes to commit"
          git pull --rebase
          git push````
`````
