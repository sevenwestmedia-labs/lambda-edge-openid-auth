import crypto from 'crypto'

export function generateNonce() {
    const nonce = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHmac('sha256', nonce).digest('hex')
    return [nonce, hash]
}

export function validateNonce(nonce: string, hash: string) {
    const other = crypto.createHmac('sha256', nonce).digest('hex')
    return other == hash
}
