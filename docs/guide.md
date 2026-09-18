---
title: 使用介绍
---

## Step1. 使用该模板创建一个新的仓库, 设置密匙及权限

- 点击右上角 `use this template` -> `create a new reposity` 按钮，创建一个新的仓库。
  - ![template](../public/images/ims-template.png)
- `git clone xxx` 仓库到本地 并安装依赖 `pnpm i`
- 更换默认分支为 `master`
  - ![template](../public/images/default-branch.png)
- 设置密匙及权限
  - `仓库/settings/Actions/General` 勾选读写权限
    - ![template](../public/images/action-general.png)
  - 设置仓库密匙
    - ![template](../public/images/repository-secrets-1.png)
      - 分别设置 key 为 `GH_TOKEN` 及 `NPM_TOKEN`的密匙

:::info{title='密匙需要选择 Tokens(classic 类型),否则无法自动发包'}
GITHUB: 点击右上角头像
/settings/Developer settings/Personal assess tokens/Tokens(classic)/Generate new token(classic)
NPM: 点击右上角头像
/Access Tokens/Generate New Token/Classic Token
:::

## Step2. 配置自己本地环境配置(可以跳过 用流水线发)

```shell
npm install -g pnpm semantic-release-cli conventional-changelog
# macos编辑环境变量 (windows请自行设置)
vim .zprofile
# 添加
export GH_TOKEN=xxx
export NPM_TOKEN=xxx
# 更新文件
source ~/.zprofile
# 初始化semantic配置
semantic-release-cli setup --gh-token=xxx --npm-token=xxx --npm-username=xxx
```

:::info{title='本地 node 版本需要 v18.18.0 及以上(semantic-release)'}
nvm install v18.18.0
nvm use v18.18.0
:::

## Step3. 更换一些信息

- 更换步骤

  - 全局搜索 `ims-template` 替换为 自己的包名
  - 全局搜索 `eternallycyf` 替换为 自己的 github 名称
  - 在 config/features.ts 及 config/footer.tsx 设置自己的首页信息及页脚信息
  - 全局搜索 `a online docs and npm package template` 替换为自己 npm 包的描述
  - package.json 更新 `keywords`
  - package.json 更换 `version` 更新为 `0.0.1`
  - 删除 `CHANGELOG.md` 内容(会自动生成)

- [一个修改的 commit 差异记录](https://github.com/eternallycyf/ims-indexed-db/commit/ae780193edbfb996f3ab6e2239cdb6765a6855db)

## Step4. 搭建 Vercel

- 登录 [Vercel](https://vercel.com)
- 新建项目

  - ![template](../public/images/vercel1.png)
  - ![template](../public/images/vercel2.png)
  - ![template](../public/images/vercel3.png)

- 点击 `deploy`

:::info{title='Vercel 发布的网站 默认已被墙 需要梯子'}
如果需要国内访问 Vercel

1. `Vercel` 需要在 项目配置中 定制自己域名 `Domains` => `xxx.com`
2. 在域名提供商 阿里云 腾讯云等配置 域名 解析

- www CNAME cname-china.vercel-dns.com.
- @ A 76.223.126.88

3. 在域名提供商 阿里云 腾讯云等配置 dns 解析(设置为 cloudflare 的)

- lila.ns.cloudflare.com
- drake.ns.cloudflare.com

4. 在 [cloudflare](https://dash.cloudflare.com/login) 配置免费 cdn

- A xxx.com 76.223.126.88 已代理 自动
- CNAME www cname-china.vercel-dns.com 已代理 自动
  :::

## Step5. 发一个 npm 包试试

- `git commit --allow-empty -m "✨ feat: npm publish test"`

:::info{title='以这些 git commit message 开头的会自动发包 构建生产 具体可参考./.changelogrc.js'}
✨ feat: xxx
🐛 fix: xxx
:::
