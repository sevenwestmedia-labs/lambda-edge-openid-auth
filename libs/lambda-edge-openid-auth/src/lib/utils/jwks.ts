import fetch from 'node-fetch'
import { JWK } from 'node-jose'

export interface JWKS {
    keys: Array<{
        kty: 'RSA'
        use?: 'sig'
        kid?: string
        x5t?: string
        n: string
        e: string
        x5c?: string[]
        issuer?: string
        d?: string
        p?: string
        q?: string
        dp?: string
        dq?: string
        qi?: string
    }>
}

/**
 * Checks if Azure login JWKS keys have been rotated (contains a keyid not in the supplied list).
 * @param tenantId Azure tenant id
 * @param keyIds Currently deployed key ids
 */
export async function azureLoginKeyRotationCheck(
    tenantId: string,
    keyIds: string[]
): Promise<{ rotated: true, newKeyIds: string[], jwks: string } | { rotated: false }> {

    const jwks = await fetchAzureLoginJwks(tenantId)
    const keystore = await JWK.asKeyStore(jwks)

    const currentKeys = keystore.all().map(jwk => jwk.kid)

    if (currentKeys.some(key => !keyIds.includes(key))) {
        return {
            rotated: true,
            newKeyIds: currentKeys,
            jwks: jwks
        }
    }
    return {
        rotated: false
    }

}

export async function fetchAzureLoginJwks(
    tenantId: string,
) {
    const response = await fetch(
        `https://login.microsoftonline.com/${tenantId}discovery/keys`
    )
    if (!response.ok) {
        const error = 'Error fetching latest azure login keys'
        throw new Error(error)
    }

    return await response.text()
}
