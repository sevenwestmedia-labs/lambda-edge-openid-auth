import { CloudFrontRequest } from 'aws-lambda'
import { DiscoveryDocument } from './idps/discovery-document'
import { providerMetadata, ProviderProps } from './idps'
import { JWKS } from './utils/jwks'

export interface RawIdp {
    clientId: string
    clientSecret: string
    name: string
    props: ProviderProps
}

export interface RawConfig {
    unauthenticatedPaths: string[]
    idps: RawIdp[]
    scope?: string
}

export interface Idp {
    clientId: string
    clientSecret: string
    discoveryDoc: DiscoveryDocument
    jwks: JWKS
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
    domain: string
    redirectUri: string
    scope: string | undefined
    postLogoutRedirectUri: string
}

export async function getConfig(
    rawConfig: RawConfig,
    request: CloudFrontRequest,
) {
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
            refreshPath: '/refresh-token',
            publicUrl,
            domain: request.headers.host[0].value,
            redirectUri: `${publicUrl}${callbackPath}`,
            scope: rawConfig.scope,
            postLogoutRedirectUri: `${publicUrl}${logoutCompletePath}`,
        },
        idps: await Promise.all(
            rawConfig.idps.map(
                async ({ clientId, clientSecret, name, props }) => {
                    const { discoveryDoc, jwks } = await providerMetadata(props)
                    return {
                        discoveryDoc,
                        jwks,
                        name,
                        clientId,
                        clientSecret,
                    }
                },
            ),
        ),
    }
}
