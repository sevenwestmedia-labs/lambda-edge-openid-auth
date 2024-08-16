export interface DiscoveryDocument {
    token_endpoint: string
    jwks_uri: string
    authorization_endpoint: string

    // Below is just added to fit
    token_endpoint_auth_methods_supported: string[]
    response_modes_supported: string[]
    subject_types_supported: string[]
    id_token_signing_alg_values_supported: string[]
    response_types_supported: string[]
    scopes_supported: string[]
    issuer: string
    request_uri_parameter_supported: boolean

    userinfo_endpoint: string
    device_authorization_endpoint: string
    http_logout_supported: boolean
    frontchannel_logout_supported: boolean
    end_session_endpoint: string
    claims_supported: string[]
    kerberos_endpoint: string
    tenant_region_scope: string
    cloud_instance_name: string
    cloud_graph_host_name: string
    msgraph_host?: string
    rbac_url: string
}
