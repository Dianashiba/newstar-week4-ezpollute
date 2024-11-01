const uploadButton = document.getElementById('uploadButton');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const fileInput = document.getElementById('fileInput');

let allowDownload = false;

const showMessage = (message) => {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
}


uploadButton.addEventListener('click', () => {
    fileInput.click();
});


fileInput.addEventListener('change', async () => {
    const files = fileInput.files;

    if (files.length === 0) {
        showMessage('请选择文件上传');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    await fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.code) {
            showMessage('图片上传成功');
            document.cookie = `token=${result.token}; path=/`;
        } else {
            console.error(result.error);
            showMessage('图片上传失败');
        }
    })
    .catch(error => {
        console.error('Error uploading files:', error);
        showMessage('图片上传失败');
    });
});

processButton.addEventListener('click', async () => {
    showMessage('图片处理中，请稍等');
    await fetch('/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            x: document.getElementById('watermarkX').value,
            y: document.getElementById('watermarkY').value,
            textOptions: {
                text: document.getElementById('watermarkText').value,
            }
        })
    })
    .catch(error => {
        console.error('Error uploading config:', error);
        showMessage('配置上传失败');
    });

    await fetch('/process', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(result => {
        if (result.code) {
            showMessage('图片处理成功');
            allowDownload = true;
        } else {
            showMessage('图片处理失败');
        }
    })
    .catch(error => {
        console.error('Error processing files:', error);
        showMessage('图片处理失败');
    });
});

downloadButton.addEventListener('click', async () => {
    if (!allowDownload) {
        alert('请等待图片处理完成')
        return;
    }
    await fetch('/download', {
        method: 'POST',
    })
   .then(response => {
        if (!response.ok) {
            throw new Error('图片下载失败');
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'images.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    })
    .catch(() => {
        showMessage('图片下载失败');
    });
});
