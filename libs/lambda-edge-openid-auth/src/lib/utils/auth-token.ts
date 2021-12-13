import { Logger } from 'typescript-log'
import { Idp } from '../config'
import { http, HttpError } from './http'
import queryString from 'query-string'
import { BadRequest, Unauthorized } from './errors'
import jwt from 'jsonwebtoken'
import { validateNonce } from './nonce'

export interface AccessTokenResponse {
    access_token: string
    expires_in: number
    refresh_token?: string
    token_type: string
    scope: string
    id_token: string
}

export async function fetchToken(
    log: Logger,
    idpConfig: Idp,
    redirectUri: string,
    code: string,
) {
    log.info('Requesting access token.')
    try {
        const tokenResponse = await http<AccessTokenResponse>(
            idpConfig.discoveryDoc.token_endpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(
                    queryString.stringify({
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code',
                        code,
                        client_id: idpConfig.clientId,
                        client_secret: idpConfig.clientSecret,
                    }),
                ).toString(),
            },
        )
        if (!tokenResponse.parsedBody) {
            throw new Error('Empty response')
        }
        return tokenResponse.parsedBody
    } catch (err) {
        if (err instanceof HttpError) {
            log.error(err.response, 'Token exchange failed')
        } else if (err instanceof Error) {
            log.error(err, 'Unknown error occurred during token exchange')
        }
        throw new BadRequest('Token exchange failed')
    }
}

export async function tokenRefresh(
    log: Logger,
    idpConfig: Idp,
    redirectUri: string,
    refreshToken: string,
) {
    log.info('Requesting refresh token.')
    try {
        const tokenResponse = await http<Required<AccessTokenResponse>>(
            idpConfig.discoveryDoc.token_endpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(
                    queryString.stringify({
                        client_id: idpConfig.clientId,
                        client_secret: idpConfig.clientSecret,
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken,
                        scope: 'openid offline_access',
                    }),
                ).toString(),
            },
        )
        return tokenResponse.parsedBody
    } catch (err) {
        if (err instanceof HttpError) {
            log.warn(err.response, 'Token refresh failed')
        } else if (err instanceof Error) {
            log.warn(err, 'Unknown error occurred during token refresh')
        }
    }
    return null
}

export function decodeIdToken(log: Logger, idToken: string) {
    log.info('Decoding JWT')
    const decodedData = jwt.decode(idToken, {
        complete: true,
    })

    if (!decodedData) {
        log.warn({ idToken }, 'Missing data')
        throw new BadRequest('Missing data')
    }

    return decodedData
}

export function verifyIdToken(
    log: Logger,
    idpConfig: Idp,
    idToken: string,
    nonce?: string,
) {
    const {
        header: { kid },
    } = decodeIdToken(log, idToken)

    log.info('Searching for JWK from discovery document')
    const pem = idpConfig.keyIdLookup[kid || '']
    if (!pem) {
        log.warn({ kid }, 'Missing pem')
        throw new Unauthorized('Unknown kid')
    }

    try {
        log.info('Verifying JWT')
        const payload = jwt.verify(idToken, pem, {
            algorithms: ['RS256'],
            audience: idpConfig.clientId,
            issuer: idpConfig.discoveryDoc.issuer,
        })

        if (typeof payload === 'string') {
            log.warn(
                { payload },
                'Failed to verify JWT, returned value is string',
            )
            throw new BadRequest('Invalid payload')
        }

        if (nonce && !validateNonce(payload.nonce, nonce)) {
            throw new Unauthorized('Nonce Verification Failed')
        }

        return payload
    } catch (err: any) {
        switch (err.name) {
            case 'TokenExpiredError':
                throw err
            case 'JsonWebTokenError':
                log.info('JWT error, unauthorized.')
                throw new Unauthorized(`Json Web Token Error ${err.message}`)
            default:
                log.info('Unknown JWT error, unauthorized.')
                throw new Unauthorized(`Unknown JWT error ${err}`)
        }
    }
}
