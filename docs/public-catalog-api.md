# FreeMusic 公开曲库 API

当前接口用于让 FreeMusic 前台读取后台中状态为“已发布”的歌曲。所有接口只读，不提供上传、编辑、状态变更或删除能力。

## 歌曲列表

```http
GET /api/tracks
```

返回 JSON 数组，并按后台更新时间倒序排列。主要字段：

- `id`、`title`、`artist`、`mood`、`genre`、`bpm`
- `durationSeconds`
- `coverUrl`
- `preview.url`、`preview.mimeType`、`preview.bitrateKbps`
- `licenseLabel`
- `download`

当前曲库尚未管理使用场景，因此 `useCases` 暂时返回空数组。高清下载接口尚未开放，因此 `download.state` 暂时为 `unavailable`。

## 封面

```http
GET /api/tracks/{trackId}/cover
HEAD /api/tracks/{trackId}/cover
```

返回歌曲上传时的 PNG 或 JPEG 封面。

## 低清试听

```http
GET /api/tracks/{trackId}/preview
HEAD /api/tracks/{trackId}/preview
Range: bytes=0-65535
```

试听内容固定为上传的低清 OGG 文件。合法 Range 请求返回 `206 Partial Content`；无效范围返回 `416 Range Not Satisfiable`。

## 公开边界

- 只有 `published` 状态的歌曲可以访问。
- 草稿、已下架或不存在的歌曲统一返回 `404`。
- 媒体响应包含 `Accept-Ranges`、`ETag`、`Content-Length` 和正确的 `Content-Type`。
- 当前公开只读接口使用 `Access-Control-Allow-Origin: *`；未来加入带身份凭据的下载接口时需要采用独立的受限 CORS 规则。
- 列表不缓存；媒体允许短时间公共缓存，并通过 ETag 重新验证。
