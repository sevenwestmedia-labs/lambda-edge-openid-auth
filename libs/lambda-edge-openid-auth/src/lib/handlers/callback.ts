import { CloudFrontRequest, CloudFrontResultResponse } from 'aws-lambda'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import queryString from 'query-string'
import { Config, Idp } from '../config'
import { redirect } from './redirect'
import { unauthorized } from '../views/unauthorized'
import { validateNonce } from '../utils/nonce'
import { badRequest } from '../views/bad-request'
import { Logger } from 'typescript-log'

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
    if (!queryDict.code) {
        return unauthorized('No Code Found', '', '')
    }

    // Verify state in querystring is a string
    if (!queryDict.state || typeof queryDict.state !== 'string') {
        log.warn({ state: queryDict.state }, 'invalid state')
        return badRequest()
    }

    // Exchange code for authorization token
    const tokenRequest = {
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
        code: queryDict.code,
        client_id: idpConfig.clientId,
        client_secret: idpConfig.clientSecret,
    }
    const postData = queryString.stringify(tokenRequest)
    log.info('Requesting access token.')
    const tokenResponse = await fetch(idpConfig.discoveryDoc.token_endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(postData).toString(),
    })
    if (tokenResponse.status !== 200) {
        log.error(
            {
                errorBody: await tokenResponse.text(),
                statusCode: tokenResponse.status,
            },
            'Token exchange failed',
        )
        return badRequest()
    }
    const parsedTokenResponse: any = await tokenResponse.json()

    log.info('Decoding JWT')
    const decodedData = jwt.decode(parsedTokenResponse.id_token, {
        complete: true,
    })

    if (!decodedData || !decodedData.header.kid) {
        log.warn({ res: parsedTokenResponse }, 'Missing data')
        return badRequest()
    }

    log.info('Searching for JWK from discovery document')
    const pem = idpConfig.keyIdLookup[decodedData.header.kid]
    if (!pem) {
        log.warn({ kid: decodedData.header.kid }, 'Missing pem')
        return unauthorized('Unknown kid', '', '')
    }

    try {
        log.info('Verifying JWT')
        const decoded = jwt.verify(parsedTokenResponse.id_token, pem, {
            algorithms: ['RS256'],
        })

        if (typeof decoded === 'string') {
            log.warn(
                { payload: decoded },
                'Failed to verify JWT, returned value is string',
            )
            return badRequest()
        }

        if (!nonce || !validateNonce(decoded.nonce, nonce)) {
            return unauthorized('Nonce Verification Failed', '', '')
        }

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
                        value: cookie.serialize(
                            'TOKEN',
                            parsedTokenResponse.id_token,
                            {
                                path: '/',
                                expires: decoded.exp
                                    ? new Date(decoded.exp * 1000)
                                    : undefined,
                            },
                        ),
                    },
                    {
                        key: 'Set-Cookie',
                        value: cookie.serialize('NONCE', '', {
                            path: '/',
                            expires: new Date(1970, 1, 1, 0, 0, 0, 0),
                        }),
                    },
                ],
            },
        }
    } catch (err) {
        switch (err.name) {
            case 'TokenExpiredError':
                log.info('Token expired, redirecting to OIDC provider.')
                return redirect(config, idpConfig, request)
            case 'JsonWebTokenError':
                log.info({ err }, 'JWT error, unauthorized.')
                return unauthorized('Json Web Token Error', err.message, '')
            default:
                log.info('Unknown JWT error, unauthorized.')
                return unauthorized(
                    'Unknown JWT',
                    `User ${decodedData.payload.email} is not permitted.`,
                    '',
                )
        }
    }
}
