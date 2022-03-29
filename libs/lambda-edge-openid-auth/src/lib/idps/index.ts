import { JWK } from 'node-jose'
import { JWKS } from '../utils/jwks'
import { azureadDiscoveryDoc } from './azuread'
import { DiscoveryDocument } from './discovery-document'

interface AzureAdProps {
    provider: 'azuread'
    tenantId: string
    jwks: JWKS
}

interface CustomIdpProps extends Metadata {
    provider: 'custom'
}

interface Metadata {
    discoveryDoc: DiscoveryDocument
    keystore: JWK.KeyStore
}

export type ProviderName = 'azuread' | 'custom'

export type ProviderProps = AzureAdProps | CustomIdpProps


export async function providerMetadata(props: ProviderProps): Promise<Metadata> {
    switch (props.provider) {
        case 'azuread': {
            return {
                discoveryDoc: azureadDiscoveryDoc(props.tenantId),
                keystore: await JWK.asKeyStore(props.jwks),
            }
        }

        case 'custom': {
            return {
                discoveryDoc: props.discoveryDoc,
                keystore: props.keystore,
            }
        }
    }
}
