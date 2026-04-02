# online版本

这套代码已经改成 `Cloudflare Pages + Pages Functions + R2` 版本。

## 功能流程

1. 用户打开首页 `index.html`
2. 填写商品标题、文案、时间
3. 上传 1 张商品图和 1 张商品详情长图
4. 点击“生成分享链接”
5. 页面调用 `functions/api/create-share.js`
6. 图片和分享 JSON 保存到 `R2`
7. 返回分享链接 `/share/<shareId>`
8. 别人打开链接后进入订单页
9. 点“未使用”中的商品，进入详情长图页

## 目录说明

- `index.html`
  生成分享链接页
- `order.html`
  订单页
- `detail.html`
  商品详情页
- `_redirects`
  把 `/share/:id` 和 `/detail/:id` 重写到静态页面
- `functions/api/create-share.js`
  接收表单并写入 R2
- `functions/api/share.js`
  读取分享 JSON
- `functions/api/image/[shareId]/[type].js`
  从 R2 读取商品图或详情图
- `functions/api/cleanup.js`
  手动执行清理
- `wrangler.toml`
  本地开发和 R2 绑定配置

## Cloudflare 官方依据

我这次是按 Cloudflare 当前官方文档设计的：

- Pages: https://developers.cloudflare.com/pages/
- Pages Functions: https://developers.cloudflare.com/pages/functions/
- Pages Functions Get Started: https://developers.cloudflare.com/pages/functions/get-started/
- Pages Bindings: https://developers.cloudflare.com/pages/functions/bindings/
- R2 Workers API: https://developers.cloudflare.com/r2/get-started/workers-api/
- R2 Upload Objects: https://developers.cloudflare.com/r2/objects/upload-objects/
- R2 Multipart Objects: https://developers.cloudflare.com/r2/objects/multipart-objects/
- Pages Redirects: https://developers.cloudflare.com/pages/configuration/redirects/
- Workers Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/

## 大截图上传

Cloudflare 官方文档当前说明里：

- 单次上传 `PUT` 适合小到中等文件，约 `100 MB` 以下
- 更大的文件更适合 multipart/S3 API 方案

所以这版对常见手机截图、长图、海报类图片通常够用。  
如果你后面发现详情长图经常特别大，我可以继续帮你升级成 `R2 multipart/S3 API` 上传版本。

## 图片不会无限增长

现在已经有清理接口：

- `/api/cleanup`

清理规则支持两种：

1. `CLEANUP_MODE=shanghai-daily`
按中国自然日清理。执行清理时，昨天及更早的内容会被删。

2. `CLEANUP_MODE=age`
配合 `RETENTION_HOURS=24` 之类的值，按小时保留。

## 关于定时 housekeeping

Cloudflare 官方文档里，`Cron Triggers` 是绑定到 `Worker` 的 `scheduled()` 处理器上的。  
这次我先把清理逻辑落成了可直接调用的 `Pages Function` 接口，原因是这条路线最稳定、最容易先跑通线上分享流程。

如果你想做“完全自动、每天定时清理”，推荐两种方式：

1. 额外部署一个很小的 Cloudflare Worker，用 Cron Trigger 定时调用 `/api/cleanup`
2. 用你自己的定时任务服务请求 `/api/cleanup`

如果你愿意，我下一步可以直接继续把“专门用于自动清理的 Cloudflare Worker”也一并写出来。

## 本地开发

本地开发推荐用：

```bash
npx wrangler pages dev .
```

如果你已经在 `wrangler.toml` 里配置好 `R2` 绑定，本地会按 Cloudflare 官方文档的方式把 R2 绑定到 Pages Functions。

## 上线前要改的地方

打开 `wrangler.toml`，把：

```toml
bucket_name = "replace-with-your-r2-bucket"
```

改成你真实的 R2 bucket 名称。
