import { CloudFrontRequest } from 'aws-lambda'
import { DiscoveryDocument } from './idps/discovery-document'
import { createKeyIdToPemsLookup } from './utils/jwks'
import { providerMetadata, ProviderName, ProviderProps } from './idps'

export interface RawIdp {
    clientId: string
    clientSecret: string
    name: string
    type: ProviderName
    props: ProviderProps
}

export interface RawConfig {
    unauthenticatedPaths: string[]
    idps: RawIdp[]
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
    refreshPath: string
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
            refreshPath: '/refresh',
            publicUrl,
            redirectUri: `${publicUrl}${callbackPath}`,
            postLogoutRedirectUri: `${publicUrl}${logoutCompletePath}`,
        },
        idps: rawConfig.idps.map(
            ({ clientId, clientSecret, name, type, props }) => {
                const { discoveryDoc, jwks } = providerMetadata[type](props)
                return {
                    discoveryDoc,
                    keyIdLookup: createKeyIdToPemsLookup(jwks),
                    name,
                    clientId,
                    clientSecret,
                }
            },
        ),
    }
}
