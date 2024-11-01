const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { fork } = require('child_process')

const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const static = require('koa-static')

const { clone, merge } = require('./utils/merge')
const { upload, defaultWaterMarkConfig } = require('./utils/config')
const { encodeToken, decodeToken } = require('./utils/auth')

const app = new Koa()
const router = new Router()


router.get("/", async (ctx) => {
    ctx.body = fs.readFileSync('./index.html', 'utf8')
})


router.post('/upload', upload.array('images'), async (ctx) => {
    const userID = uuidv4()
    const userDir = path.join(__dirname, 'uploads', userID)

    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true })
    }

    ctx.files.forEach((file) => {
        const newFilePath = path.join(userDir, file.filename)
        fs.renameSync(file.path, newFilePath)
    })
    token = encodeToken(userID)
    ctx.cookies.set('token', token)
    ctx.body = {
        code: 1,
    }
})


router.post('/config', async (ctx) => {
    jsonData = ctx.request.rawBody || "{}"
    token = ctx.cookies.get('token')
    if (!token) {
        return ctx.body = {
            code: 0,
            msg: 'Upload Photo First',
        }
    }
    const [err, userID] = decodeToken(token)
    if (err) {
        return ctx.body = {
            code: 0,
            msg: 'Invalid Token',
        }
    }
    userConfig = JSON.parse(jsonData)
    try {
        finalConfig = clone(defaultWaterMarkConfig)
        merge(finalConfig, userConfig)
        fs.writeFileSync(path.join(__dirname, 'uploads', userID, 'config.json'), JSON.stringify(finalConfig))
        ctx.body = {
            code: 1,
            msg: 'Config updated successfully',
        }
    } catch (e) {
        ctx.body = {
            code: 0,
            msg: 'Some error occurred',
        }
    }
})


const PhotoProcessScript = path.join(__dirname, 'PhotoProcess.js')
router.post('/process', async (ctx) => {
    const token = ctx.cookies.get('token')

    const [err, userID] = decodeToken(token)
    if (err) {
        return ctx.body = {
            code: 0,
            msg: 'Invalid Token',
        }
    }

    const userDir = path.join(__dirname, 'uploads', userID)

    if (!fs.existsSync(userDir)) {
        return ctx.body = {
            code: 0,
            msg: 'User directory not found',
        }
    }

    try {
        await new Promise((resolve, reject) => {

            const proc = fork(PhotoProcessScript, [userDir], { silent: true })

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve('success')
                } else {
                    reject(new Error('An error occurred during execution'))
                }
            })

            proc.on('error', (err) => {
                reject(new Error(`Failed to start subprocess: ${err.message}`))
            })
        })
        ctx.body = {
            code: 1,
            msg: 'Photos processed successfully',
        }
    } catch (error) {
        ctx.body = {
            code: 0,
            msg: 'some error occurred',
        }
    }
})


router.post('/download', async (ctx) => {
    const token = ctx.cookies.get('token')
    const [err, userID] = decodeToken(token)
    if (err) {
        return ctx.body = {
            code: 0,
            msg: 'Invalid Token',
        }
    }

    const userDir = path.join(__dirname, 'uploads', userID, 'images.zip');
    if (fs.existsSync(userDir)) {
        ctx.attachment('images.zip');
        ctx.body = fs.createReadStream(userDir);
    } else {
        ctx.body = {
            code: 0,
            msg: 'File not found',
        }
    }
})


app
  .use(bodyParser())
  .use(static(path.join(__dirname, 'static')))
  .use(router.routes())
  .use(router.allowedMethods())


app.listen(3000, () => {
    console.log('http://127.0.0.1:3000')
})