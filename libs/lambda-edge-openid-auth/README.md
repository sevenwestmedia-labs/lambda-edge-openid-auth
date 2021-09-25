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
                    type: 'azuread',
                    props: {
                      tenantId: 'e5c524fa-185a-4083-b1f1-2032f6bacbd1',
                    },
                },
            ],
        },
        log,
        request,
    )
}
```
