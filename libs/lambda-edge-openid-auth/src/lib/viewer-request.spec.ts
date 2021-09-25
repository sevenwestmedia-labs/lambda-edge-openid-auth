import { authenticateViewerRequest } from './viewer-request'
import pino from 'pino'
import { oidcInteraction, oidcServer } from '../tests/oidc-server'
import { cloudfrontRequest } from '../tests/cloudfront-request'
import { CloudFrontResultResponse } from 'aws-lambda'
import { RawConfig } from './config'

it('can authenticate with OIDC server', async () => {
    const log = pino({})

    const {
        app,
        clientId,
        clientSecret,
        jwks,
        discoveryDoc,
    } = await oidcServer(['https://localhost/callback'])

    const rawConfig: RawConfig = {
        unauthenticatedPaths: [],
        idps: [
            {
                clientId,
                clientSecret,
                name: 'wanews',
                type: 'custom' as const,
                props: {
                    discoveryDoc,
                    jwks,
                },
            },
        ],
    }

    const selectIdpResponse = (await authenticateViewerRequest(
        rawConfig,
        log,
        cloudfrontRequest('/contact'),
    )) as CloudFrontResultResponse
    expect(selectIdpResponse.status).toEqual('200')
    expect(selectIdpResponse.body).toContain('Select login provider')
    expect(selectIdpResponse.body).toContain(
        '/login?idp=wanews&next=%2Fcontact',
    )

    const redirectResponse = (await authenticateViewerRequest(
        rawConfig,
        log,
        cloudfrontRequest('/login?idp=wanews&next=%2Fcontact'),
    )) as CloudFrontResultResponse
    expect(redirectResponse.status).toEqual('302')
    expect(redirectResponse.headers!.location[0].value).toContain(
        'http://localhost:3000/connect/auth?',
    )

    const callbackUrl = await oidcInteraction(
        app,
        redirectResponse.headers!.location[0].value,
    )

    // start oidc server since the callback handler hits the /connect/token endpoint
    await app.listen('3000').unref()
    const callbackResponse = (await authenticateViewerRequest(
        rawConfig,
        log,
        cloudfrontRequest(
            callbackUrl,
            redirectResponse.headers!['set-cookie'].map(
                ({ value }) => value.split(';')[0],
            ),
        ),
    )) as CloudFrontResultResponse
    expect(callbackResponse.status).toEqual('302')
    expect(callbackResponse.headers!['set-cookie'][0].value).toMatch(
        /TOKEN=[a-zA-Z0-9]+.*/,
    )
    expect(callbackResponse.headers!['set-cookie'][1].value).toContain(
        'NONCE=;',
    )
})
