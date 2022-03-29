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

export const tokenExpireEpoch = (exp: number | undefined, expiresIn: number) =>
    exp ?? new Date().getTime() / 1000 + expiresIn

export const refreshTokenExpireEpoch = (exp: number) => exp + 60 * 60 * 24 * 7

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

export async function fetchRefreshedToken(
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

export function decodeToken(log: Logger, token: string) {
    log.info('Decoding JWT')
    const decodedData = jwt.decode(token, {
        complete: true,
    })

    if (!decodedData) {
        log.warn({ idToken: token }, 'Missing data')
        throw new BadRequest('Missing data')
    }

    return decodedData
}

export function verifyToken(
    log: Logger,
    idpConfig: Idp,
    token: string,
    nonce?: string,
) {
    const {
        header: { kid },
    } = decodeToken(log, token)

    if (!kid) {
        log.warn({ kid }, 'Missing kid in token')
        throw new Unauthorized('Missing kid')
    }

    log.info('Searching for JWK from discovery document')
    const pem = idpConfig.keystore.get(kid).toPEM()
    if (!pem) {
        log.warn({ kid }, 'Missing pem')
        throw new Unauthorized('Unknown kid')
    }

    try {
        log.info('Verifying JWT')
        const payload = jwt.verify(token, pem, {
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
    } catch (err) {
        if (err instanceof Error && 'name' in err) {
            switch (err.name) {
                case 'BadRequest':
                case 'Unauthorized':
                case 'TokenExpiredError':
                    throw err
                case 'JsonWebTokenError':
                    log.info('JWT error, unauthorized.')
                    throw new Unauthorized(`Json Web Token Error ${err.message}`)
                default:
            }
        }
        log.info('Unknown JWT error, unauthorized.')
        throw new Unauthorized(`Unknown JWT error ${err}`)
    }
}
