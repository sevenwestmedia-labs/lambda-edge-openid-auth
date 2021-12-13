import { CloudFrontRequest, CloudFrontResultResponse } from 'aws-lambda'
import cookie from 'cookie'
import queryString from 'query-string'
import { Config, Idp } from '../config'
import { generateNonce } from '../utils/nonce'

export function redirect(
    config: Config,
    idpConfig: Idp,
    request: CloudFrontRequest,
): CloudFrontResultResponse {
    const queryDict = queryString.parse(request.querystring)
    const n = generateNonce()

    const queryRequest = {
        redirect_uri: config.redirectUri,
        response_type: 'code',
        response_mode: 'query',
        scope: 'openid offline_access',
        nonce: n[0],
        state: queryDict.next || '/',
        client_id: idpConfig.clientId,
    }

    // Redirect to Authorization Server
    return {
        status: '302',
        statusDescription: 'Found',
        body: 'Redirecting to OIDC provider',
        headers: {
            location: [
                {
                    key: 'Location',
                    value: `${
                        idpConfig.discoveryDoc.authorization_endpoint
                    }?${queryString.stringify(queryRequest)}`,
                },
            ],
            'set-cookie': [
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('IDP', idpConfig.name, {
                        path: '/',
                        httpOnly: true,
                    }),
                },
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('TOKEN', '', {
                        path: '/',
                        expires: new Date(1970, 1, 1, 0, 0, 0, 0),
                    }),
                },
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('NONCE', n[1], {
                        path: '/',
                        httpOnly: true,
                    }),
                },
            ],
        },
    }
}
