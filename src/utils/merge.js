const isObject = (obj) => {
    return typeof obj === 'function' || typeof obj === 'object'
}

const merge = (target, source) => {
    if (!isObject(target) || !isObject(source)) {
        return target
    }
    for (let key in source) {
        if (key === "__proto__") continue
        if (source[key] === "") continue
        if (isObject(source[key]) && key in target) {
            target[key] = merge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target
}


const clone = (target) => {
    return merge({}, target)
}


module.exports = {
    clone,
    merge,
}