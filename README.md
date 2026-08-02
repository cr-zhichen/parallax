# Parallax

> 在能力与成本之间，找到更有证据的模型选择。

Parallax 是一个以散点图为入口的 AI 模型选型工具：把 Artificial Analysis 的模型能力、任务成本、速度与延迟放到同一张决策图上。

<p align="center">
  <img src="https://img-cdn.ccrui.cn/2026/08/02/6a6ef520040de.png" alt="Parallax AI model landscape" width="100%" />
</p>

[![CI](https://github.com/cr-zhichen/parallax/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/cr-zhichen/parallax/actions/workflows/docker-publish.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.16-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

## 核心体验

| 视图 | 作用 |
| --- | --- |
| **能力 × 成本** | 横轴为单项任务成本（对数刻度），纵轴为 Artificial Analysis Intelligence Index。 |
| **前沿与替代** | 标出帕累托前沿、严格替代和相近候选，快速找到更划算的落点。 |
| **深入探索** | 按模型名、厂商或 ID 搜索；按厂商筛选；查看推理等级与完整标签。 |
| **舒适使用** | 支持中文、繁體中文、English、日本語、한국어，以及浅色、深色和跟随系统主题。 |

## 快速开始

项目通过 [mise](https://mise.jdx.dev/) 固定 Node.js 与 pnpm 版本（Node.js `24.16.0`、pnpm `11.5.2`）：

```bash
mise install
mise run install
cp .env.example .env.local
mise run dev
```

打开 <http://localhost:3000>。

> 没有配置 API Key 也可以启动。应用会自动使用明确标记的演示数据；配置后会切换到实时目录。

## 配置

在 `.env.local`（Docker 使用 `.env`）中设置：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ARTIFICIAL_ANALYSIS_API_KEY` | 空 | Artificial Analysis API Key，只在 Next.js 服务端使用。 |
| `ARTIFICIAL_ANALYSIS_API_TIER` | `free` | `free` 使用免费模型目录；`pro` 或 `commercial` 使用订阅接口。 |
| `PARALLAX_CATALOG_CACHE_PATH` | `data/model-catalog.json` | 模型目录持久化快照路径；Docker 默认写入 `/app/data/model-catalog.json`。 |

服务端会读取全部分页（最多 20 页），按稳定的模型 ID 去重，并在以下时间自动同步：

- 每 8 小时执行一次；
- 前端不轮询，也不提供手动刷新；
- 成功拉取的目录会写入持久化快照；服务重启后优先恢复快照；
- 实时请求失败时优先保留上一次有效目录，首次失败则回退到演示数据。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `mise run dev` | 启动开发服务器 |
| `mise run lint` | 运行 ESLint |
| `mise run test` | 运行 Vitest 单元测试 |
| `mise run build` | 构建生产版本 |
| `mise run check` | 依次执行 lint、test、build |
| `mise run start` | 启动生产服务器（包含 8 小时同步调度器） |

## Docker 部署

默认使用 GitHub Container Registry 中的镜像 `ghcr.io/cr-zhichen/parallax:latest`：

```bash
cp .env.example .env
# 可选：编辑 .env，填入 ARTIFICIAL_ANALYSIS_API_KEY
mkdir -p data
docker compose pull
docker compose up -d
```

模型目录快照保存在宿主机的 `./data/model-catalog.json`，通过目录映射挂载到容器；不要使用 `docker compose down -v`，否则会删除其他 Docker 卷（快照目录本身不会被该命令删除）。

打开 <http://localhost:3000>，健康检查地址为 <http://localhost:3000/api/health>。停止服务：

```bash
docker compose down
```

可通过环境变量覆盖端口或镜像：

```bash
PARALLAX_PORT=3100 docker compose up -d
PARALLAX_IMAGE=ghcr.io/cr-zhichen/parallax:TAG docker compose pull
```

如果 GHCR 镜像为私有仓库，先登录：

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
```

本地构建使用 [docker-compose.ci.yml](docker-compose.ci.yml)：

```bash
docker compose -f docker-compose.ci.yml build parallax
```

发布流水线见 [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)，仅在 GitHub Release 发布时执行检查并发布镜像。Release 的标签会作为版本镜像标签；稳定版本（如 `v1.0.0`）额外更新 `latest`，`-rc`、`-beta` 和 `-alpha` 版本分别更新对应的浮动标签。

## API

| Endpoint | 用途 |
| --- | --- |
| `GET /api/models` | 返回当前模型目录及数据源、同步时间等元信息。 |
| `GET /api/health` | 返回服务健康状态，供 Docker healthcheck 使用。 |

## 数据说明

数据来源：[Artificial Analysis](https://artificialanalysis.ai/)。能力指数与价格仅用于辅助选型，请结合实际业务负载进行验证。
