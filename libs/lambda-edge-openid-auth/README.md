# lambda-edge-openid-auth

Currently only supports Azure AD

## Usage

```ts
import { authenticateViewerRequest } from '@wanews/lambda-edge-openid-auth'
import { CloudFrontRequestHandler } from 'aws-lambda'
import pino from 'pino'

export const handler: CloudFrontRequestHandler = async (event, context) => {
    const record = event.Records[0]
    const request = record.cf.request

    return authenticateViewerRequest(
        {
            unauthenticatedPaths: [],
            idps: [
                {
                    clientId: 'FAKE',
                    clientSecret: 'FAKE',
                    name: 'FAKE',
                    tenantId: 'FAKE',
                },
            ],
        },
        pino({}),
        request,
    )
}
```
