# End to end encrypted pastebin

使用 cloudflare workers 的端到端加密剪切板

# 功能

- 纯前端加密解密，明文永远不会发到服务器
- AES-256-CGM 加密算法
- 定时删除

# 截图

![创建](https://github.com/sduoduo233/secure-pastebin/raw/master/screenshots/1.webp)

![分享](https://github.com/sduoduo233/secure-pastebin/raw/master/screenshots/2.webp)

![浏览](https://github.com/sduoduo233/secure-pastebin/raw/master/screenshots/3.webp)

# 部署

0. `npm install`

1. 登录 cloudflare `npx wrangler login`

2. 创建 KV 存储和生成 `wrangler.toml`

```
python3 deploy.py
```

3. `npx wrangler deploy`