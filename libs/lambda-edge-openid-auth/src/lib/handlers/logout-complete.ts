import cookie from 'cookie'
import { Config } from '../config'

export function logoutCompleteHandler(config: Config) {
    return {
        status: '302',
        statusDescription: 'Found',
        body: 'Completing logout',
        headers: {
            location: [
                {
                    key: 'Location',
                    value: config.publicUrl,
                },
            ],
            'set-cookie': ['TOKEN', 'NONCE', 'IDP'].map((name) => ({
                key: 'Set-Cookie',
                value: cookie.serialize(name, '', {
                    path: '/',
                    domain: config.domain,
                    expires: new Date(1970, 1, 1, 0, 0, 0, 0),
                }),
            })),
        },
    }
}
