import { CloudFrontRequest } from 'aws-lambda'
import queryString from 'query-string'
import { callbackHandler } from './handlers/callback'
import { getConfig, RawConfig } from './config'
import { getCookies } from './utils/cookies'
import { internalServerError } from './views/internal-server-error'
import { redirect } from './handlers/redirect'
import { selectIdp } from './views/select-idp'
import { validateTokenHandler } from './handlers/validate-token'
import { badRequest } from './views/bad-request'
import { logoutHandler } from './handlers/logout'
import { logoutCompleteHandler } from './handlers/logout-complete'
import { CloudFrontRequestResult } from 'aws-lambda/trigger/cloudfront-request'
import { Logger } from 'typescript-log'
import { refreshTokenHandler } from './handlers/refresh-token'
import { TokenExpiredError } from 'jsonwebtoken'
import { BadRequest, Unauthorized } from './utils/errors'
import { unauthorized } from './views/unauthorized'

export const authenticateViewerRequest = async (
    rawConfig: RawConfig,
    log: Logger,
    request: CloudFrontRequest,
): Promise<CloudFrontRequestResult> => {
    try {
        const { config, idps } = getConfig(rawConfig, request)

        // require no authentication for unauthenticated paths
        if (
            config.unauthenticatedPaths.some((unAuthenticatedPath) =>
                request.uri.startsWith(unAuthenticatedPath),
            )
        ) {
            return request
        }

        const cookies = getCookies(request)

        const isLoginPath = request.uri.startsWith(config.loginPath)

        // IDP is set as a cookie or if it's the login path as a query param
        const idp =
            cookies.IDP ||
            (isLoginPath && queryString.parse(request.querystring).idp)

        // If an IDP is not set, show the selection screen
        if (!idp) {
            return selectIdp(config, idps, request)
        }

        // Validate if it's a configured IDP
        const idpConfig = idps.find(({ name }) => idp === name)
        if (!idpConfig) {
            log.warn(`Unknown idp: ${idp}`)
            return badRequest()
        }

        try {
            if (isLoginPath) {
                return redirect(config, idpConfig, request)
            }

            if (request.uri.startsWith(config.callbackPath)) {
                log.info('Callback from OIDC provider received')
                return callbackHandler(
                    config,
                    idpConfig,
                    log,
                    request,
                    cookies.NONCE,
                )
            }

            if (request.uri.startsWith(config.logoutCompletePath)) {
                return logoutCompleteHandler(config)
            }

            if (request.uri.startsWith(config.logoutPath)) {
                return logoutHandler(config, idpConfig)
            }

            if (cookies && cookies.TOKEN) {
                if (request.uri.startsWith(config.refreshPath)) {
                    return refreshTokenHandler(
                        config,
                        idpConfig,
                        log,
                        cookies.TOKEN,
                        cookies.REFRESH_TOKEN,
                    )
                }

                log.info('Request received with TOKEN cookie. Validating.')
                return validateTokenHandler(
                    config,
                    idpConfig,
                    log,
                    request,
                    cookies.TOKEN,
                )
            }

            return redirect(config, idpConfig, request)
        } catch (err: any) {
            if (err instanceof TokenExpiredError) {
                return redirect(config, idpConfig, request)
            } else if (err instanceof BadRequest) {
                return badRequest()
            } else if (err instanceof Unauthorized) {
                return unauthorized(err.message, '', '')
            }
            throw err
        }
    } catch (err: any) {
        log.error(err, 'Error encountered when authenticating request')
        return internalServerError()
    }
}
