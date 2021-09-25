import { CloudFrontRequest } from 'aws-lambda'

export function cloudfrontRequest(
    href: string,
    cookies?: string[],
): CloudFrontRequest {
    // Adding in any base url as we only have a relative url and URL needs to be a full url
    const uri = new URL(href, 'http://localhost')
    return {
        uri: uri.pathname,
        querystring: uri.search,
        clientIp: '127.0.0.1',
        method: 'GET',
        headers: {
            host: [{ key: 'Host', value: uri.host }],
            cookie: cookies?.map((value) => ({ key: 'Cookie', value })) || [],
        },
    }
}
