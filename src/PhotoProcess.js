const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const archiver = require('archiver')
const { defaultWaterMarkConfig } = require('./utils/config')

const directoryPath = process.argv[2]
const outputZipPath = path.join(directoryPath, 'images.zip')

const output = fs.createWriteStream(outputZipPath)
const archive = archiver('zip', { zlib: { level: 9 } })

var config
if (fs.existsSync(path.join(directoryPath, 'config.json'))) {
    config = JSON.parse(fs.readFileSync(path.join(directoryPath, 'config.json')))
} else {
    config = defaultWaterMarkConfig
}

config.x = parseInt(config.x, 10);
config.y = parseInt(config.y, 10);
config.maxWidth = parseInt(config.maxWidth, 10)
config.maxHeight = parseInt(config.maxHeight, 10);

output.on('close', () => {
    console.log(`Zip file created: ${outputZipPath}`)
})

archive.on('error', err => {
    throw err
})

archive.pipe(output)

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Failed to read directory:', err)
        process.exit(1)
    }

    const images = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))

    const processImagePromises = images.map(imageFile => {
        const imagePath = path.join(directoryPath, imageFile)

        return jimp.read(imagePath)
            .then(image => {
                return jimp.loadFont(jimp.FONT_SANS_64_BLACK).then(font => ({ image, font }))
            })
            .then(({ image, font }) => {
                image.print(
                    font,
                    config.x,
                    config.y,
                    {
                        text: config.textOptions.text,
                        alignmentX: jimp[config.textOptions.alignmentX],
                        alignmentY: jimp[config.textOptions.alignmentY]
                    },
                    config.maxWidth,
                    config.maxHeight,
                )
                const watermarkedPath = path.join(directoryPath, `watermarked_${imageFile}`)
                return image.writeAsync(watermarkedPath).then(() => watermarkedPath)
            })
            .catch(err => {
                console.error('Failed to process images:', err)
            })
    })

    Promise.all(processImagePromises)
        .then(watermarkedPaths => {
            watermarkedPaths.forEach(filePath => {
                archive.file(filePath, { name: path.basename(filePath) })
            })
            archive.finalize()
            archive.on('end', () => {
                watermarkedPaths.forEach(filePath => {
                    fs.unlinkSync(filePath, (err) => {
                        if (err) {
                            console.error(`Failed to delete file ${filePath}:`, err);
                        } else {
                            console.log(`Deleted file ${filePath}`);
                        }
                    });
                });
            });
        })
        .catch(err => {
            console.error('Failed to process images:', err)
        })
})
