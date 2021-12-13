import { CloudFrontRequest, CloudFrontResultResponse } from 'aws-lambda'
import cookie from 'cookie'
import queryString from 'query-string'
import { Config, Idp } from '../config'
import { unauthorized } from '../views/unauthorized'
import { badRequest } from '../views/bad-request'
import { Logger } from 'typescript-log'
import { fetchToken, verifyIdToken } from '../utils/auth-token'

const IDP_ERRORS: { [key: string]: string } = {
    invalid_request: 'Invalid Request',
    unauthorized_client: 'Unauthorized Client',
    access_denied: 'Access Denied',
    unsupported_response_type: 'Unsupported Response Type',
    invalid_scope: 'Invalid Scope',
    server_error: 'Server Error',
    temporarily_unavailable: 'Temporarily Unavailable',
}

export async function callbackHandler(
    config: Config,
    idpConfig: Idp,
    log: Logger,
    request: CloudFrontRequest,
    nonce?: string,
): Promise<CloudFrontResultResponse> {
    const queryDict = queryString.parse(request.querystring)

    // Check for error response (https://tools.ietf.org/html/rfc6749#section-4.2.2.1)
    if (queryDict.error) {
        if (Array.isArray(queryDict.error)) {
            return badRequest()
        }
        const error = IDP_ERRORS[queryDict.error] || queryDict.error

        let error_description = ''
        if (
            queryDict.error_description &&
            typeof queryDict.error_description === 'string'
        ) {
            error_description = queryDict.error_description
        }

        let error_uri = ''
        if (queryDict.error_uri && typeof queryDict.error_uri === 'string') {
            error_uri = queryDict.error_uri
        }

        return unauthorized(error, error_description, error_uri)
    }

    // Verify code is in querystring
    if (!queryDict.code || typeof queryDict.code !== 'string') {
        return unauthorized('No Code Found', '', '')
    }

    // Verify state in querystring is a string
    if (!queryDict.state || typeof queryDict.state !== 'string') {
        log.warn({ state: queryDict.state }, 'invalid state')
        return badRequest()
    }

    const {
        id_token: idToken,
        refresh_token: refreshToken,
        expires_in: tokenExpiresIn,
    } = await fetchToken(log, idpConfig, config.redirectUri, queryDict.code)

    const payload = verifyIdToken(log, idpConfig, idToken, nonce)

    const tokenExpiry =
        payload.exp ?? new Date().getTime() / 1000 + tokenExpiresIn

    // Once verified, create new JWT for this server
    return {
        status: '302',
        statusDescription: 'Found',
        body: 'ID token retrieved.',
        headers: {
            location: [
                {
                    key: 'Location',
                    value: queryDict.state,
                },
            ],
            'set-cookie': [
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('TOKEN', idToken, {
                        path: '/',
                        expires: new Date(tokenExpiry * 1000),
                    }),
                },
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('NONCE', '', {
                        path: '/',
                        expires: new Date(1970, 1, 1, 0, 0, 0, 0),
                    }),
                },
                ...(refreshToken
                    ? [
                          {
                              key: 'Set-Cookie',
                              value: cookie.serialize(
                                  'REFRESH_TOKEN',
                                  refreshToken,
                                  {
                                      path: '/',
                                      expires: new Date(
                                          (tokenExpiry + 60 * 60 * 24 * 7) *
                                              1000,
                                      ),
                                      httpOnly: true,
                                  },
                              ),
                          },
                      ]
                    : []),
            ],
        },
    }
}
