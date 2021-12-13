import { CloudFrontResultResponse } from 'aws-lambda'
import { Config, Idp } from '../config'
import { Logger } from 'typescript-log'
import cookie from 'cookie'
import { decodeIdToken, tokenRefresh, verifyIdToken } from '../utils/auth-token'

export async function refreshTokenHandler(
    config: Config,
    idpConfig: Idp,
    log: Logger,
    token: string,
    refreshToken?: string,
): Promise<CloudFrontResultResponse> {
    // decode the token to get the expiry
    const decodedData = await decodeIdToken(log, token)

    // refresh the token 10mins before the expiry
    if (
        decodedData.payload.exp &&
        Date.now() / 1000 > decodedData.payload.exp - 60 * 10
    ) {
        if (!refreshToken) {
            return {
                status: '400',
                statusDescription: 'Bad Request',
                body: 'No refresh token available',
            }
        }

        const tokenResponse = await tokenRefresh(
            log,
            idpConfig,
            config.redirectUri,
            refreshToken,
        )

        if (tokenResponse) {
            const {
                id_token: newIdToken,
                refresh_token: newRefreshToken,
                expires_in: newTokenExpiresIn,
            } = tokenResponse

            const payload = verifyIdToken(log, idpConfig, newIdToken)

            const tokenExpiry =
                payload.exp ?? new Date().getTime() / 1000 + newTokenExpiresIn

            return {
                status: '201',
                statusDescription: 'Ok',
                body: 'Token refreshed successfully',
                headers: {
                    'set-cookie': [
                        {
                            key: 'Set-Cookie',
                            value: cookie.serialize('TOKEN', newIdToken, {
                                path: '/',
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
                                    expires: new Date(
                                        (tokenExpiry + 60 * 60 * 24 * 7) * 1000,
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
