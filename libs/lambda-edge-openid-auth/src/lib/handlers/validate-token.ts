import { CloudFrontRequest } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { Config, Idp } from '../config'
import { redirect } from './redirect'
import { unauthorized } from '../views/unauthorized'
import { badRequest } from '../views/bad-request'

export async function validateTokenHandler(
    config: Config,
    idpConfig: Idp,
    token: string,
    request: CloudFrontRequest,
) {
    console.log('Searching for JWK from discovery document')
    const decodedData = jwt.decode(token, {
        complete: true,
    })

    if (
        !decodedData ||
        typeof decodedData === 'string' ||
        !decodedData.header.kid
    ) {
        console.warn('Missing data', token)
        return badRequest('Missing kid')
    }

    const pem = idpConfig.keyIdLookup[decodedData.header.kid]
    if (!pem) {
        console.warn('Missing pem', decodedData.header.kid)
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
                console.log('Token expired, redirecting to OIDC provider.')
                return redirect(config, idpConfig, request)
            case 'JsonWebTokenError':
                console.log('JWT error, unauthorized.')
                return unauthorized('Json Web Token Error', err.message, '')
            default:
                console.log('Unknown JWT error, unauthorized.')
                return unauthorized(
                    'Unknown JWT',
                    'User ' + decodedData.payload.email + ' is not permitted.',
                    '',
                )
        }
    }
}
