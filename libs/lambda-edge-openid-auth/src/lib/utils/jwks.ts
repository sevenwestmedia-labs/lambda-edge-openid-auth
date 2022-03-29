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
