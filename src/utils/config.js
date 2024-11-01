const multer = require("@koa/multer")
const path = require('path')
const mime = require('mime-types')
const { v4: uuidv4 } = require("uuid")

const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
        return cb(null, true)
    } else {
        return cb(new Error('只允许上传图片文件'))
    }
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
    },
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb)
    },
})


// 默认水印参数
const defaultWaterMarkConfig = {
    font: "jimp.FONT_SANS_64_BLACK",
    x: "0",
    y: "0",
    textOptions: {
        "text": "WaterMark",
        "alignmentX": "jimp.HORIZONTAL_ALIGN_CENTER",
        "alignmentY": "jimp.VERTICAL_ALIGN_MIDDLE",
    },
    maxWidth: 50,
    maxHeight: 50,
}

module.exports = {
    defaultWaterMarkConfig,
    upload,
}