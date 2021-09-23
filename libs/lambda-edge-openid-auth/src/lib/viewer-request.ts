import { CloudFrontRequestHandler } from 'aws-lambda'
import queryString from 'query-string'
import { callbackHandler } from './handlers/callback'
import { getConfig } from './config'
import { Cookies, getCookies } from './utils/cookies'
import { internalServerError } from './views/internal-server-error'
import { redirect } from './handlers/redirect'
import { selectIdp } from './views/select-idp'
import { validateTokenHandler } from './handlers/validate-token'
import { badRequest } from './views/bad-request'
import { logoutHandler } from './handlers/logout'
import { logoutCompleteHandler } from './handlers/logout-complete'

const unauthenticatedPaths = ['/assets']

export const handler: CloudFrontRequestHandler = async (event, context) => {
    const record = event.Records[0]
    const request = record.cf.request

    try {
        const { config, idps } = getConfig(request)

        // require no authentication for unauthenticated paths
        if (
            unauthenticatedPaths.some((unAuthenticatedPath) =>
                request.uri.startsWith(unAuthenticatedPath),
            )
        ) {
            return request
        }

        const cookies: Cookies = getCookies(request)

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
            console.warn(`Unknown idp: ${idp}`)
            return badRequest('Unsupported IDP')
        }

        if (isLoginPath) {
            return redirect(config, idpConfig, request)
        }

        if (request.uri.startsWith(config.callbackPath)) {
            console.log('Callback from OIDC provider received')
            return callbackHandler(config, idpConfig, request, cookies.NONCE)
        }

        if (request.uri.startsWith(config.logoutCompletePath)) {
            return logoutCompleteHandler(config)
        }

        if (request.uri.startsWith(config.logoutPath)) {
            return logoutHandler(config, idpConfig)
        }

        if (cookies && cookies.TOKEN) {
            console.log('Request received with TOKEN cookie. Validating.')
            return validateTokenHandler(
                config,
                idpConfig,
                cookies.TOKEN,
                request,
            )
        }

        return redirect(config, idpConfig, request)
    } catch (err) {
        console.log('Internal server error', err)
        return internalServerError()
    }
}
