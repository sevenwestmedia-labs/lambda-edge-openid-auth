import { authenticateViewerRequest } from './viewer-request'
import pino from 'pino'
import { oidcInteraction, oidcServer } from '../tests/oidc-server'
import { cloudfrontRequest } from '../tests/cloudfront-request'

jest.mock('./idps/azuread', () => {
    const originalModule = jest.requireActual('./idps/azuread')
    const jwks = jest.requireActual('../tests/oidc-server').jwks
    return {
        ...originalModule,
        azureadDiscoveryDoc: (id: string) => ({
            ...originalModule.azureadDiscoveryDoc(id),
            authorization_endpoint: 'http://localhost:3000/connect/auth',
            token_endpoint: 'http://localhost:3000/connect/token',
        }),
        azureadJwks: (id: string) => jwks,
    }
})

it('can authenticate with OIDC server', async () => {
    const { app, clientId, clientSecret } = oidcServer([
        'https://localhost/callback',
    ])

    const rawConfig = {
        unauthenticatedPaths: [],
        idps: [
            {
                clientId,
                clientSecret,
                tenantId: 'FAKE',
                name: 'wanews',
            },
        ],
    }

    const selectIdpResponse: any = await authenticateViewerRequest(
        rawConfig,
        pino({}),
        cloudfrontRequest('/contact'),
    )
    expect(selectIdpResponse.status).toEqual('200')
    expect(selectIdpResponse.body).toContain('Select login provider')
    expect(selectIdpResponse.body).toContain(
        '/login?idp=wanews&next=%2Fcontact',
    )

    const redirectResponse: any = await authenticateViewerRequest(
        rawConfig,
        pino({}),
        cloudfrontRequest('/login?idp=wanews&next=%2Fcontact'),
    )
    expect(redirectResponse.status).toEqual('302')
    expect(redirectResponse.headers.location[0].value).toContain(
        'http://localhost:3000/connect/auth?',
    )

    const callbackUrl = await oidcInteraction(
        app,
        redirectResponse.headers.location[0].value,
    )

    // start oidc server since the callback handler hits the /connect/token endpoint
    await app.listen('3000').unref()
    const callbackResponse: any = await authenticateViewerRequest(
        rawConfig,
        pino({}),
        cloudfrontRequest(
            callbackUrl,
            redirectResponse.headers['set-cookie'].map(
                ({ value }) => value.split(';')[0],
            ),
        ),
    )
    expect(callbackResponse.status).toEqual('302')
    expect(callbackResponse.headers['set-cookie'][0].value).toMatch(
        /TOKEN=[a-zA-Z0-9]+.*/,
    )
    expect(callbackResponse.headers['set-cookie'][1].value).toContain('NONCE=;')
})
