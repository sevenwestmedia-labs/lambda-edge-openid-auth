export class BadRequest extends Error {
    __proto__: BadRequest

    constructor(message: string) {
        super(message)

        this.constructor = BadRequest
        this.__proto__ = BadRequest.prototype
    }
}

export class Unauthorized extends Error {
    __proto__: Unauthorized

    constructor(message: string) {
        super(message)

        this.constructor = Unauthorized
        this.__proto__ = Unauthorized.prototype
    }
}
