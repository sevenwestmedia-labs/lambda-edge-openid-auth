import { CloudFrontResultResponse } from 'aws-lambda'
import { Config, Idp } from '../config'
import { Logger } from 'typescript-log'
import cookie from 'cookie'
import {
    decodeToken,
    fetchRefreshedToken,
    refreshTokenExpireEpoch,
    tokenExpireEpoch,
    verifyToken,
} from '../utils/auth-token'

export async function refreshTokenHandler(
    config: Config,
    idpConfig: Idp,
    log: Logger,
    token: string,
    refreshToken?: string,
): Promise<CloudFrontResultResponse> {
    // decode the token to get the expiry
    const {
        payload: { exp: currentTokenExp },
    } = decodeToken(log, token)

    // refresh the token 10mins before the expiry
    if (currentTokenExp && Date.now() / 1000 > currentTokenExp - 60 * 10) {
        if (!refreshToken) {
            return {
                status: '400',
                statusDescription: 'Bad Request',
                body: 'No refresh token available',
            }
        }

        const tokenResponse = await fetchRefreshedToken(
            log,
            idpConfig,
            config.redirectUri,
            refreshToken,
        )

        if (tokenResponse) {
            const {
                id_token: newToken,
                refresh_token: newRefreshToken,
                expires_in: newTokenExpiresIn,
            } = tokenResponse

            const payload = verifyToken(log, idpConfig, newToken)

            const tokenExpiry = tokenExpireEpoch(payload.exp, newTokenExpiresIn)
            const refreshTokenExpiry = refreshTokenExpireEpoch(tokenExpiry)

            return {
                status: '201',
                statusDescription: 'Ok',
                body: 'Token refreshed successfully',
                headers: {
                    'set-cookie': [
                        {
                            key: 'Set-Cookie',
                            value: cookie.serialize('TOKEN', newToken, {
                                path: '/',
                                secure: true,
                                sameSite: 'lax',
                                domain: config.domain,
                                expires: new Date(tokenExpiry * 1000),
                            }),
                        },
                        {
                            key: 'Set-Cookie',
                            value: cookie.serialize(
                                'REFRESH_TOKEN',
                                newRefreshToken,
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
                    ],
                },
            }
        } else {
            return {
                status: '400',
                statusDescription: 'Bad Request',
                body: 'Failed to refresh token',
            }
        }
    }

    return {
        status: '200',
        statusDescription: 'Ok',
        body: 'No token refresh required at the moment',
    }
}
