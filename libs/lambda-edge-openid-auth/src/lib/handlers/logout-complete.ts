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
            'set-cookie': [
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('IDP', '', {
                        path: '/',
                        secure: true,
                        domain: config.domain,
                        httpOnly: true,
                    }),
                },
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('TOKEN', '', {
                        path: '/',
                        secure: true,
                        domain: config.domain,
                        expires: new Date(1970, 1, 1, 0, 0, 0, 0),
                    }),
                },
                {
                    key: 'Set-Cookie',
                    value: cookie.serialize('NONCE', '', {
                        path: '/',
                        secure: true,
                        domain: config.domain,
                        httpOnly: true,
                    }),
                },
            ],
        },
    }
}
