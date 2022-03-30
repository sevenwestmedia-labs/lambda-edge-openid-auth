import { CloudFrontRequest } from 'aws-lambda'
import { DiscoveryDocument } from './idps/discovery-document'
import { providerMetadata, ProviderProps } from './idps'
import { JWK } from 'node-jose'

export interface RawIdp {
    clientId: string
    clientSecret: string
    name: string
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
    keystore: JWK.KeyStore
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
            postLogoutRedirectUri: `${publicUrl}${logoutCompletePath}`,
        },
        idps: await Promise.all(rawConfig.idps.map(
            async ({ clientId, clientSecret, name, props }) => {
                const { discoveryDoc, keystore } = await providerMetadata(props)
                return {
                    discoveryDoc,
                    keystore,
                    name,
                    clientId,
                    clientSecret,
                }
            },
        )),
    }
}
