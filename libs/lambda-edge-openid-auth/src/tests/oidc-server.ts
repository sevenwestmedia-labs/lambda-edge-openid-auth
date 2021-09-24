import cuid from 'cuid'
import { JWKS } from '../lib/utils/jwks'
import express, { Express } from 'express'
import { KoaContextWithOIDC, Provider } from 'oidc-provider'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import session from 'supertest-session'

export const jwks: JWKS = {
    keys: [
        {
            kty: 'RSA',
            n:
                '3xNRuH5v4bx7cuqiTfuu6uP9H1yWUtmYNf6QoEw3SfYSb4_mV3vmZWsept-1ebHKNAqiw8hqr3u_DpiKq9Y2ye2FEJl8gDXIecTuh3q7GXld4BINs748zo33bqm6bSfnp7XKLU12tfU9WqMfkKOyXAMg6owxu2Lh2e_we5-p7K1BtFGHFx2e_YkRsjzVXNRl6r1g2fveAytYl_gOqc8N2SvVDjFvGxeV5W5qz2cczRVXwovoh2HyhNwRc2txkYnx1N0KJ0-aRuBfvJX_1vzSb9_z9Itk9_EHnIMsUfAp6GM3fq7W1u4oHVhHP4ixKSSikmI1T1p7ApThTdWeI0zv1BqCna9VBvJMYVxUUTBXGmzA-HkYTHCwm7-oTWljPq2VZuUZBTDMyhFxKWpNSlhd7nKeHF6MP5R0fH8ZfJa0Csbhh-Vgu755cBU206kYCdOzMOUCRc7QrYhcqZq_AEh_DYS2iqn9bdA1jrqkNrSzfkI1u5J1_bSNTaaytLlpAznk4l9iAByNK8xNVBVJJ0bxxcEHslQIK8RZLLxrLsNdyLTrN1ULu1Ou62jGLkvC9-rqlbCdQC4LRYmC5Jdgceji3rfbYvCEZecKXtkEZZW43gOciOPau-f-pc5p9F2riu1BSGoTpDnq4miWvjwJ392QximLvnJ0neXYplOIINs6jyM',
            e: 'AQAB',
            d:
                'XRSgms0XPif5kt_YzZVhTV3IdteZWgS1gIIyMtDamR_2XVq8EHEAl_z0k0jxXlATQVfWxr7P1V1bQWnhIwaFYgib52tECfNnLXhA14McouqDg0XFNeUBVmbigeiMg5ONE-vE6tZR3GbyLOm3-BB2EfK0P2o0Li56cwetXsgmjT1WFzmVls2jU8NoAOllVhDCXgqbaRmxb70cgHzfEXf2HVIu2ndCFxnmUA-cveIWoHRxZBog8qyqF0oEdha1ErdukxWQcQrEIyLoj7Y_RKPF4yydjMLFZLfMJ0CMs7v0oKUVuOSXfKNvVZ9KS3ZsBfDlbRNRj0T_4vngcSvbintF7oGISkU2AUKEht3CEfUX3xFvxDrZuW04iFgpk4-vK3wlJUQ--Mo9DarJPaOaQeZ_zkCC4eEgfPVF1YywfwoA9yDchO91YybezCic5eaLGBihgSJQ9u66p4jiK1rHzt9cfvVnVcHTrcOBoQjOTsLpOCHrTx9bPhCaVzKU1Y3Y8VnLUX8JUiHaqpGYS213D8GJeOVR7brT2NDKav9W94U4mPqUilw5v9vREE3XqlOgHZ664NUjuo_5HwS6k_pF8Fey0y8lLALFCoYd-qJTqCW0Wx9BII8eT175M9POn71QSHFUdAfE89Rwec7XHnddF8oCB34bdc7q6LF3ROupkyIPl2E',
            p:
                '9ZZkjKLLQGUk05CpocRfe45NgkCFKGOlfM3RJ7BWLO4FyME8WyVwWusMi_yNWcSo_mfxpF-Xu-stpQssFnQ6nEEviAcDNzKiFe_-JEXC5JvIVViZJi6RPYg7Hiwsbgv7A1AvAcp6eO7t0mtIpzozmvZJ6dQ4W_MFuRa_RHTh4iTmLziMgpYtnCeNa2rrR9_QAExNRbAS4nag12Zq0omrd-kR3qKdOT2rpayJZtNbLeNaYZW1o0GRVckleObxfXbyFb8jjWU9CFT1xI-Wb-2GvJAlN3Yg2jsTNM3OTKm-uL7nt37iAnpIwLotuKKJwd2GLwITaFco_DDSvpm4hdOf-Q',
            q:
                '6IiUwIKUIzxbbLCPR-7KNTrHLI9HwEJsykcjQRfG5rA9p61uw_ZAC5L4tNN8X8-6xP2oOkYjC64lsZOIB1-TVkXlZ8t-tZRAkaS5qgiRYRmGvpAkrRymePwfR4BoR0-lM4v2NGvMKUdygeNx0FysTU6_6i2GZpXAeiTcP9AiJBY642PM4WxTgajYrWb1DJhsuvUlPalDzuz6KCQZhZ6QgUbtCvoSDLp-EFoH8hzkQKC1XS3GwhlEe66UvaiaX4WCrg1jsRMXBBzPjFZODu3DzMQVLyWBJdYeo4wzb21Tie8giBupbtajb38f1WVcEg89p93dy0rmsGahGIMZMdvm-w',
            dp:
                'J42INipF5-IiUzyaRWZ2JlUd4Jt5lq6tyXLwe57n0ianodSVXuyhstLmW2labpnAyfB9t4Z5zpcq68jn2dnwUpghCpxuhSZPeo8DdF4T7HO2iSBS0hZv5-QX-V0N7s9ZJwhz-ardnLqGbPxAYEZ8ZznBX7qBNTXntw6V0XWtp5lfxT0rTCDZyauJGELJD_NY8aNYUp_v-q82alqhW7U2e4J7EUtJXR20lmM6YegqaDKUrODKtzdpK9LQiS9Qt28_wAbft_cVJFFin7yscuxjZd0lUVBiLCOVjUyULD6ua9y7Pw9dYR7GttuFX5Y175Y49Ts1WvmmrS9D0dS6JjuWKQ',
            dq:
                'Lf2lfhXVesqbQnoBPLbr429GqXeFN29r2O4M-Pjc7A97gkh5GeUAccmVyx3xAXoydHe-6BerIspExkRpqRusJmoYn1jOLNevlZ7A4fJj3pKP5ezYdCyweElVXmz1MvV7tSA_h8qyTI_HBA2aGx3ZLkkfCBAM_wkrUn0r2qsttXl4GDVK9mLYeVKN2G3-lYkoKCoIPZPWx3xzVbEeIyFjb0453-vp2f6gpFdKLwar1mRyuoUtRIJ-2v-Ch6hrL-1WFVqslv8xlCymmBkRwz4fdcZqcjK2wmcBFFPMcINs_GEBTCo8bqGhHZJFF42-kgvVo_frwCOGUOlbf1-egg_-NQ',
            qi:
                '5J6Q8v6lf5ZAUN7XbxA5LhGk6KgH6VuLvsTv8F_X5BcJ2fuFPzYIzLM6c87fquMEh7TfhPGLpUORMcmVvk3jB2ypC-DApoCN-hcNFj2Or61rYX8F8vsu7qGjwz_ThKl8caaQxrT0nRKYPLbTgDJOggxY0OxeBK9jL52fzMaUqX8jgwaB5gYTQOnLRs1X14by8ax4YZ7KhRX6cL8BEdW0hoJiMRtAgNGpgkIrFk-jw2Ud85GesQIdj0Xjk71y7zYzmFyeQskSAaYM4ymOHpzXM8-APZ-Q-q4ucA2pQWxYeshJT3EHiK4HprSgi_QiziWqLfLDUDYidR7StUNTmaEy6w',
            kid: 'aaabbb',
        },
    ],
}

const accountStore = new Map()
class Account {
    private readonly accountId: string

    constructor(id: string) {
        this.accountId = id || cuid()
        accountStore.set(this.accountId, this)
    }

    async claims(use: string, scope: string) {
        return {
            sub: this.accountId,
        }
    }

    static async findAccount(
        _ctx: KoaContextWithOIDC,
        id: string,
        token?: any,
    ) {
        if (!accountStore.get(id)) new Account(id)
        return accountStore.get(id)
    }
}

export function oidcServer(redirectUris: string[]) {
    const serverAddress = 'http://localhost:3000'
    const clientId = cuid()
    const clientSecret = cuid()

    const app = express()
    const prvder = new Provider(serverAddress, {
        findAccount: Account.findAccount,
        pkce: { required: () => false, methods: ['S256', 'plain'] },
        clients: [
            {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uris: redirectUris,
                Grants: ['authorization_code', 'refresh_token'],
            },
        ],
        jwks,
    })
    app.use('/connect', prvder.callback())

    return {
        app: app,
        serverAddress,
        clientId,
        clientSecret,
    }
}

export async function oidcInteraction(app: Express, initialOidcUrl: string) {
    const oidcSession = session(app)

    const authUrl = new URL(initialOidcUrl)
    const initialInteractionResponse: any = await oidcSession
        .get(`${authUrl.pathname}${authUrl.search}`)
        .expect(303)

    const loginResponse: any = await oidcSession
        .post(initialInteractionResponse.headers.location)
        .type('form')
        .send({ prompt: 'login', password: 'password', login: 'foobar' })
        .expect(303)

    const authResumeResponse: any = await oidcSession
        .get(new URL(loginResponse.headers.location).pathname)
        .expect(303)

    const consentResponse: any = await oidcSession
        .post(authResumeResponse.headers.location)
        .type('form')
        .send({ prompt: 'consent' })
        .expect(303)

    const authFinalResponse: any = await oidcSession
        .get(new URL(consentResponse.headers.location).pathname)
        .expect(303)

    const clientRedirectUrl = new URL(authFinalResponse.headers.location)
    return `${clientRedirectUrl.pathname}${clientRedirectUrl.search}`
}
