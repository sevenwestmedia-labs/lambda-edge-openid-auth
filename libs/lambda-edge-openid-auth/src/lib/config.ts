import { CloudFrontRequest } from 'aws-lambda'
import fs from 'fs'
import { DiscoveryDocument } from './idps/DiscoveryDocument'
import { azureadDiscoveryDoc, azureadJwks } from './idps/azuread'
import { createKeyIdToPemsLookup } from './utils/jwks'

interface RawConfig {
    publicUrl?: string
    idps?: {
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
    callbackPath: string
    logoutCompletePath: string
    logoutPath: string
    loginPath: string
    publicUrl: string
    redirectUri: string
    postLogoutRedirectUri: string
}

export function getConfig(
    request: CloudFrontRequest,
): {
    config: Config
    idps: Idp[]
} {
    const publicUrl = `https://${request.headers.host[0].value}`

    const config: RawConfig = JSON.parse(
        fs.readFileSync('config.json', 'utf-8'),
    )

    if (!config.idps || config.idps.length == 0) {
        throw new Error('idps is not set in the config')
    }

    if (
        config.idps.filter(
            (idp) =>
                !idp.name ||
                !idp.clientId ||
                !idp.clientSecret ||
                !idp.tenantId,
        ).length > 0
    ) {
        throw new Error('invalid idp config')
    }

    const callbackPath = '/callback'
    const logoutCompletePath = '/logout-complete'

    return {
        config: {
            callbackPath,
            logoutCompletePath,
            logoutPath: '/logout',
            loginPath: '/login',
            publicUrl,
            redirectUri: `${publicUrl}${callbackPath}`,
            postLogoutRedirectUri: `${publicUrl}${logoutCompletePath}`,
        },
        idps: config.idps.map(({ clientId, clientSecret, name, tenantId }) => ({
            discoveryDoc: azureadDiscoveryDoc(tenantId),
            keyIdLookup: createKeyIdToPemsLookup(azureadJwks(tenantId)),
            name,
            clientId,
            clientSecret,
        })),
    }
}
