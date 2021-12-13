import { CloudFrontRequest } from 'aws-lambda'
import { Config, Idp } from '../config'
import { Logger } from 'typescript-log'
import { verifyToken } from '../utils/auth-token'

export async function validateTokenHandler(
    config: Config,
    idpConfig: Idp,
    log: Logger,
    request: CloudFrontRequest,
    token: string,
) {
    verifyToken(log, idpConfig, token)
    return request
}
