import { azureadJwks, azureadDiscoveryDoc } from './azuread'
import { DiscoveryDocument } from './discovery-document'
import { JWKS } from '../utils/jwks'

interface AzureAdProps {
    tenantId: string
}

interface CustomIdpProps {
    discoveryDoc: DiscoveryDocument
    jwks: JWKS
}

interface Metadata {
    discoveryDoc: DiscoveryDocument
    jwks: JWKS
}

export type ProviderName = 'azuread' | 'custom'

export type ProviderProps = AzureAdProps | CustomIdpProps

type ProviderMetadata = {
    [key in ProviderName]: (props: ProviderProps) => Metadata
}

export const providerMetadata: ProviderMetadata = {
    azuread: (props) => {
        if (!('tenantId' in props)) {
            throw Error('tenantId is not set in props')
        }
        return {
            discoveryDoc: azureadDiscoveryDoc(props.tenantId),
            jwks: azureadJwks(props.tenantId),
        }
    },
    custom: (props) => {
        if (!('discoveryDoc' in props) || !('jwks' in props)) {
            throw Error('discoveryDoc or jwks not set in props')
        }
        return {
            discoveryDoc: props.discoveryDoc,
            jwks: props.jwks,
        }
    },
}
