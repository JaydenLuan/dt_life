# online版本

这套代码面向 `Vercel` 部署，流程如下：

1. 用户打开首页 `index.html`
2. 填写商品文字，上传商品图片和商品详情长图
3. 点击“生成分享链接”
4. 系统上传图片并生成分享链接
5. 别人打开链接后进入订单展示页
6. 在“未使用”里点击商品后进入详情长图页

## 页面结构

- `index.html`
  首页，负责生成分享链接
- `order.html`
  订单展示页
- `detail.html`
  商品详情长图页
- `api/blob-upload.js`
  为浏览器直传 Blob 生成上传令牌
- `api/create-share.js`
  保存分享元数据并返回分享链接
- `api/share.js`
  根据分享 id 读取分享内容
- `api/cleanup.js`
  删除过期分享和对应图片

## Vercel 依赖

项目使用官方 `Vercel Blob` 保存图片和分享数据。

参考文档：

- https://vercel.com/docs/vercel-blob
- https://vercel.com/docs/functions/

我这里根据官方文档做了这些实现：

- 使用 Vercel Functions 处理 `Request`
- 使用 `@vercel/blob/client` 做浏览器直传
- 使用 `@vercel/blob` 的 `put()` 保存分享 JSON
- 使用 `@vercel/blob` 的 `list()` 和 `del()` 做清理

## 部署前准备

1. 在 Vercel 中创建一个项目，并把部署根目录指向这个 `online版本` 文件夹
2. 在项目里创建一个 `Blob Store`
3. 确认项目环境变量里已经有 `BLOB_READ_WRITE_TOKEN`
4. 建议新增环境变量 `CRON_SECRET`
5. 可选新增环境变量 `CLEANUP_MODE`
6. 可选新增环境变量 `RETENTION_HOURS`
7. 运行依赖安装

```bash
npm install
```

## 分享链接格式

生成后的分享链接格式是：

```text
https://你的域名/share/<shareId>
```

详情页链接格式是：

```text
https://你的域名/detail/<shareId>
```

这些链接由 `vercel.json` 里的 rewrite 规则映射到静态页面。

## 移动端上传

支持。首页使用标准文件选择控件：

- iPhone Safari 可从照片或文件中选图
- Android Chrome 可从相册或文件中选图
- 微信内置浏览器通常也可以，但建议优先用系统浏览器测试

## 大图上传

当前版本已经改成了 `Vercel Blob client uploads`：

- 浏览器会直接把商品图和详情长图传到 Blob
- 服务端只负责生成上传令牌和保存分享元数据
- 相比“先传到函数再转存”，更适合大截图上传
- 前端上传已开启 `multipart: true`，更适合较大的截图文件

## 自动清理

已增加 `housekeeping` 机制：

- 清理接口：`/api/cleanup`
- 定时任务配置在 `vercel.json`
- 当前 cron 表达式是 `30 16 * * *`

这个时间是 `UTC 16:30`，对应中国时间 `次日 00:30`

默认清理模式是：

```text
CLEANUP_MODE=shanghai-daily
```

这表示定时任务在中国时间每天 `00:30` 左右运行时，会删除“不是今天创建”的分享内容。换句话说，昨天及更早上传的内容会被清掉，更贴近你说的“当天清空”。

如果你更想按时长保留，可以改成：

```text
CLEANUP_MODE=age
RETENTION_HOURS=24
```

这时会删除超过 24 小时的分享内容：

- 分享 JSON
- 商品图片
- 商品详情长图

如果你想保护清理接口，建议设置：

```text
CRON_SECRET=你的随机字符串
```

然后手动调用时加请求头：

```text
Authorization: Bearer 你的随机字符串
```
