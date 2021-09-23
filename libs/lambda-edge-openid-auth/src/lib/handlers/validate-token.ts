import { CloudFrontRequest } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { Config, Idp } from '../config'
import { redirect } from './redirect'
import { unauthorized } from '../views/unauthorized'
import { badRequest } from '../views/bad-request'
import { Logger } from 'typescript-log'

export async function validateTokenHandler(
    config: Config,
    idpConfig: Idp,
    log: Logger,
    request: CloudFrontRequest,
    token: string,
) {
    console.log('Searching for JWK from discovery document')
    const decodedData = jwt.decode(token, {
        complete: true,
    })

    if (!decodedData || !decodedData.header.kid) {
        log.warn({ token: token }, 'Missing data')
        return badRequest()
    }

    const pem = idpConfig.keyIdLookup[decodedData.header.kid]
    if (!pem) {
        log.warn({ kid: decodedData.header.kid }, 'Missing pem')
        return unauthorized('Unknown kid', '', '')
    }

    try {
        // Verify the JWT, the payload email, and that the email ends with configured hosted domain
        jwt.verify(token, pem, {
            algorithms: ['RS256'],
        })

        return request
    } catch (err) {
        switch (err.name) {
            case 'TokenExpiredError':
                log.info('Token expired, redirecting to OIDC provider.')
                return redirect(config, idpConfig, request)
            case 'JsonWebTokenError':
                log.info('JWT error, unauthorized.')
                return unauthorized('Json Web Token Error', err.message, '')
            default:
                log.info('Unknown JWT error, unauthorized.')
                return unauthorized(
                    'Unknown JWT',
                    'User ' + decodedData.payload.email + ' is not permitted.',
                    '',
                )
        }
    }
}
