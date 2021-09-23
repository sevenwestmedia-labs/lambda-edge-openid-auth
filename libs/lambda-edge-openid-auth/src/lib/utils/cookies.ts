import { CloudFrontRequest } from 'aws-lambda'
import cookie from 'cookie'

export interface Cookies {
    IDP?: string
    TOKEN?: string
    NONCE?: string
}

export function getCookies(
    request: CloudFrontRequest,
): { [key: string]: string } {
    const cookiesHeader = request.headers.cookie || []
    return cookiesHeader.reduce(
        (cookieMap, { value }) => ({
            ...cookieMap,
            ...cookie.parse(value),
        }),
        {},
    )
}
