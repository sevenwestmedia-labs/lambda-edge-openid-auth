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
            jwksPath: './path-to-jwks',
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

```ts
import { writeFileSync } from 'fs'
import { azureLoginKeyRotationCheck } from '@wanews/lambda-edge-openid-auth'

interface deploymentProvider {
  deploy(): void
  getState(name: string): string | undefined
  setState(name: string, value: string): void
}

export async function redeployOnKeyRotiation(provider: deploymentProvider) {
  // The jwks file must be included in your lambda bundle
  const jwksPath = './dist/azure-keys.json'
  const tenantId = 'your-tenant-id'

  // Azure key ids should be stored in your deployment provider
  const deployedAzureKeys = provider.getState('azure-key-ids')?.split(',') || []

  // Update the keys and redeploy if keys have rotated
  const result = await azureLoginKeyRotationCheck(tenantId, deployedAzureKeys)
  if (result.rotated) {
    writeFileSync(jwksPath, result.jwks)
    provider.setState('azure-key-ids', result.newKeyIds.join(','))
    provider.deploy()
  }
}
```
