import queryString from 'query-string'
import { Config, Idp } from '../config'

export function logoutHandler(config: Config, idpConfig: Idp) {
    const queryParams = {
        post_logout_redirect_uri: config.postLogoutRedirectUri,
    }
    return {
        status: '302',
        statusDescription: 'Found',
        body: 'Logging out',
        headers: {
            location: [
                {
                    key: 'Location',
                    value: `${
                        idpConfig.discoveryDoc.end_session_endpoint
                    }?${queryString.stringify(queryParams)}`,
                },
            ],
        },
    }
}
