import { CloudFrontRequest } from 'aws-lambda'
import { DiscoveryDocument } from './idps/discovery-document'
import { azureadDiscoveryDoc, azureadJwks } from './idps/azuread'
import { createKeyIdToPemsLookup } from './utils/jwks'

export interface RawConfig {
    unauthenticatedPaths: string[]
    idps: {
        clientId: string
        clientSecret: string
        name: string
        tenantId: string
    }[]
}

export interface Idp {
    clientId: string
    clientSecret: string
    discoveryDoc: DiscoveryDocument
    keyIdLookup: Record<string, string>
    name: string
}

export interface Config {
    unauthenticatedPaths: string[]
    callbackPath: string
    logoutCompletePath: string
    logoutPath: string
    loginPath: string
    publicUrl: string
    redirectUri: string
    postLogoutRedirectUri: string
}

export function getConfig(
    rawConfig: RawConfig,
    request: CloudFrontRequest,
): {
    config: Config
    idps: Idp[]
} {
    const publicUrl = `https://${request.headers.host[0].value}`
    const callbackPath = '/callback'
    const logoutCompletePath = '/logout-complete'
    return {
        config: {
            unauthenticatedPaths: rawConfig.unauthenticatedPaths,
            callbackPath,
            logoutCompletePath,
            logoutPath: '/logout',
            loginPath: '/login',
            publicUrl,
            redirectUri: `${publicUrl}${callbackPath}`,
            postLogoutRedirectUri: `${publicUrl}${logoutCompletePath}`,
        },
        idps: rawConfig.idps.map(
            ({ clientId, clientSecret, name, tenantId }) => ({
                discoveryDoc: azureadDiscoveryDoc(tenantId),
                keyIdLookup: createKeyIdToPemsLookup(azureadJwks(tenantId)),
                name,
                clientId,
                clientSecret,
            }),
        ),
    }
}
