import { CloudFrontRequest, CloudFrontResultResponse } from 'aws-lambda'
import cookie from 'cookie'
import queryString from 'query-string'
import { Config, Idp } from '../config'
import { Logger } from 'typescript-log'
import {
    fetchToken,
    refreshTokenExpireEpoch,
    tokenExpireEpoch,
    verifyToken,
} from '../utils/auth-token'
import { BadRequest, Unauthorized } from '../utils/errors'

const IDP_ERRORS: { [key: string]: string } = {
    invalid_request: 'Invalid Request',
    unauthorized_client: 'Unauthorized Client',
    access_denied: 'Access Denied',
    unsupported_response_type: 'Unsupported Response Type',
    invalid_scope: 'Invalid Scope',
    server_error: 'Server Error',
    temporarily_unavailable: 'Temporarily Unavailable',
}

function parseCallback(log: Logger, qs: string) {
    const queryDict = queryString.parse(qs)

    // Check for error response (https://tools.ietf.org/html/rfc6749#section-4.2.2.1)
    if (queryDict.error) {
        if (Array.isArray(queryDict.error)) {
            throw new BadRequest('Error querystring param is expected')
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

        throw new Unauthorized(error, error_description, error_uri)
    }

    // Verify code is in querystring
    if (!queryDict.code || typeof queryDict.code !== 'string') {
        throw new Unauthorized('No Code Found')
    }

    // Verify state in querystring is a string
    if (!queryDict.state || typeof queryDict.state !== 'string') {
        log.warn({ state: queryDict.state }, 'invalid state')
        throw new BadRequest('Invalid state')
    }

    return {
        code: queryDict.code,
        state: queryDict.state,
    }
}

export async function callbackHandler(
    config: Config,
    idpConfig: Idp,
    log: Logger,
    request: CloudFrontRequest,
    nonce?: string,
): Promise<CloudFrontResultResponse> {
    const { code, state } = parseCallback(log, request.querystring)

    const {
        id_token: token,
        refresh_token: refreshToken,
        expires_in: tokenExpiresIn,
    } = await fetchToken(log, idpConfig, config.redirectUri, code)

    const payload = verifyToken(log, idpConfig, token, nonce)

    const tokenExpiry = tokenExpireEpoch(payload.exp, tokenExpiresIn)
    const refreshTokenExpiry = refreshTokenExpireEpoch(tokenExpiry)

    // Once verified, create new JWT for this server
    return {
        status: '302',
        statusDescription: 'Found',
        body: 'ID token retrieved.',
        headers: {
            location: [
                {
                    key: 'Location',
                    value: state,
                },
            ],
            'set-cookie': [
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('TOKEN', token, {
                        path: '/',
                        secure: true,
                        sameSite: 'lax',
                        domain: config.domain,
                        expires: new Date(tokenExpiry * 1000),
                    }),
                },
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('NONCE', '', {
                        path: '/',
                        domain: config.domain,
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
                                      secure: true,
                                      sameSite: 'lax',
                                      domain: config.domain,
                                      expires: new Date(
                                          refreshTokenExpiry * 1000,
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
