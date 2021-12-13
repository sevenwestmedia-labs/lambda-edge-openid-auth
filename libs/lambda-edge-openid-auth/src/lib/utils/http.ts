import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch'

interface HttpResponse<T> extends Response {
    parsedBody?: T
}

export interface SimpleResponse {
    status: number
    statusText: string
    url?: string
    errorBody?: string
}

export class HttpError extends Error {
    __proto__: HttpError
    response: SimpleResponse

    constructor(response: Response, errorBody?: string) {
        super(response.status.toString())

        // This is required to make `err instanceof StartupError` work
        this.constructor = HttpError
        this.__proto__ = HttpError.prototype

        this.response = {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            errorBody,
        }
    }
}

export async function http<T>(
    url: RequestInfo,
    init?: RequestInit,
): Promise<HttpResponse<T>> {
    const response: HttpResponse<T> = await fetch(url, init)

    try {
        response.parsedBody = await response.json()
        // eslint-disable-next-line no-empty
    } catch (err) {}

    if (!response.ok) {
        const errorBody = await response.text()
        throw new HttpError(response, errorBody)
    }

    return response
}
