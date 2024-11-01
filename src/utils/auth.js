const crypto = require('crypto')

const secret = crypto.randomBytes(16).toString('hex')
const hash = (data) => crypto.createHash('sha256').update(data).digest('hex')


const encodeToken = (data) => {
    return (data + "." + hash(`${data}${secret}`))
}


const decodeToken = (token) => {
    const [data, signature] = token.split(".")
    if (signature === hash(`${data}${secret}`)) {
        return [null, data]
    } else {
        return ["Invalid Signature", null]
    }
}


module.exports = {
    encodeToken,
    decodeToken,
}