export class BadRequest extends Error {
    __proto__: BadRequest

    constructor(message: string) {
        super(message)

        this.constructor = BadRequest
        this.name = 'BadRequest'
        this.__proto__ = BadRequest.prototype
    }
}

export class Unauthorized extends Error {
    __proto__: Unauthorized
    public readonly description?: string
    public readonly uri?: string

    constructor(message: string, description?: string, uri?: string) {
        super(message)

        this.constructor = Unauthorized
        this.name = 'Unauthorized'
        this.description = description ?? ''
        this.uri = uri ?? ''
        this.__proto__ = Unauthorized.prototype
    }
}
