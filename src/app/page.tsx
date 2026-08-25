import {
  CircleUserRound,
  Clock3,
  FileMusic,
  LayoutDashboard,
  Menu,
  Music2,
  Settings,
  Tags,
  Upload,
} from "lucide-react";

import { MusicEditDialog } from "@/components/music-edit-dialog";
import { MusicDeleteDialog } from "@/components/music-delete-dialog";
import { MusicStatusDialog } from "@/components/music-status-dialog";
import { MusicUploadDialog } from "@/components/music-upload-dialog";
import { trackStatusLabels } from "@/lib/music-catalog/publication-status";
import {
  listManagerTracks,
  type ManagerTrack,
  type TrackPublicationStatus,
} from "@/lib/music-catalog/music-catalog-service";

export const dynamic = "force-dynamic";

const statusClassNames: Record<TrackPublicationStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  offline: "bg-zinc-200 text-zinc-600",
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-lime-300 text-zinc-950">
        <Music2 className="size-5" aria-hidden="true" />
      </span>
      <span>
        <strong className="block text-sm tracking-wide">Tingever</strong>
        <span className="block text-xs text-zinc-500">Manager</span>
      </span>
    </div>
  );
}

function PrimaryNavigation({ mobile = false }: { mobile?: boolean }) {
  const linkClassName = mobile
    ? "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
    : "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white";

  return (
    <nav aria-label="后台主导航" className="grid gap-1">
      <a className={linkClassName} href="#overview">
        <LayoutDashboard className="size-4" aria-hidden="true" />
        概览
      </a>
      <a
        aria-current="page"
        className={`${linkClassName} ${
          mobile
            ? "bg-zinc-100 font-medium text-zinc-950"
            : "bg-lime-300 font-medium text-zinc-950 hover:bg-lime-300 hover:text-zinc-950"
        }`}
        href="#tracks"
      >
        <FileMusic className="size-4" aria-hidden="true" />
        歌曲管理
      </a>
      {!mobile && (
        <span
          aria-disabled="true"
          className={`${linkClassName} cursor-not-allowed opacity-45`}
        >
          <Upload className="size-4" aria-hidden="true" />
          导入歌曲
          <span className="ml-auto text-[10px]">页面右上</span>
        </span>
      )}
      <span
        aria-disabled="true"
        className={`${linkClassName} cursor-not-allowed opacity-45`}
      >
        <Tags className="size-4" aria-hidden="true" />
        Tag 规范
      </span>
      <span
        aria-disabled="true"
        className={`${linkClassName} cursor-not-allowed opacity-45`}
      >
        <Settings className="size-4" aria-hidden="true" />
        系统设置
      </span>
    </nav>
  );
}

function StatusBadge({ status }: { status: TrackPublicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassNames[status]}`}
    >
      {trackStatusLabels[status]}
    </span>
  );
}

function TrackTags({ track }: { track: ManagerTrack }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={`歌曲标签：${track.tags.join("、")}`}>
      {track.tags.map((tag) => (
        <span
          className="rounded-md border bg-white px-2 py-1 text-xs text-zinc-600"
          key={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function DesktopTrackTable({ tracks }: { tracks: ManagerTrack[] }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">歌曲管理列表</caption>
        <thead className="border-b bg-zinc-50 text-xs font-medium text-zinc-500">
          <tr>
            <th className="w-[28%] px-5 py-3.5" scope="col">
              歌曲
            </th>
            <th className="w-[29%] px-5 py-3.5" scope="col">
              Tag
            </th>
            <th className="w-[14%] px-5 py-3.5" scope="col">
              状态
            </th>
            <th className="w-[17%] px-5 py-3.5" scope="col">
              更新时间
            </th>
            <th className="w-[12%] px-5 py-3.5 text-right" scope="col">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tracks.map((track) => (
            <tr className="transition-colors hover:bg-zinc-50/80" key={track.id}>
              <td className="px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-lime-300">
                    <Music2 className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate font-medium text-zinc-950">
                      {track.title}
                    </strong>
                    <span className="mt-1 block truncate text-xs text-zinc-500">
                      {track.artist || "未知作者"}
                    </span>
                  </span>
                </div>
              </td>
              <td className="px-5 py-4">
                <TrackTags track={track} />
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={track.status} />
              </td>
              <td className="px-5 py-4 text-xs text-zinc-500">
                {track.updatedAtLabel}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  <MusicEditDialog track={track} />
                  <MusicStatusDialog track={track} />
                  <MusicDeleteDialog track={track} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileTrackList({ tracks }: { tracks: ManagerTrack[] }) {
  return (
    <div className="grid gap-3 md:hidden">
      {tracks.map((track) => (
        <article className="rounded-xl border bg-white p-4" key={track.id}>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-lime-300">
              <Music2 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium">{track.title}</h3>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {track.artist || "未知作者"}
                  </p>
                </div>
                <StatusBadge status={track.status} />
              </div>
              <div className="mt-3">
                <TrackTags track={track} />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                <Clock3 className="size-3.5" aria-hidden="true" />
                更新于 {track.updatedAtLabel}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MusicEditDialog mobile track={track} />
                <MusicStatusDialog mobile track={track} />
                <div className="col-span-2">
                  <MusicDeleteDialog mobile track={track} />
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function Home() {
  const tracks = await listManagerTracks();
  const publishedCount = tracks.filter(
    (track) => track.status === "published",
  ).length;
  const draftCount = tracks.filter((track) => track.status === "draft").length;
  const offlineCount = tracks.filter(
    (track) => track.status === "offline",
  ).length;

  const overviewItems = [
    { label: "歌曲总数", value: tracks.length, detail: "本地曲库" },
    { label: "已发布", value: publishedCount, detail: "前台 API 可读取" },
    { label: "草稿", value: draftCount, detail: "等待补全" },
    { label: "已下架", value: offlineCount, detail: "停止展示" },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-zinc-950 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col border-r border-white/10 bg-[#111512] px-4 py-5 text-white lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-9">
          <PrimaryNavigation />
        </div>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium text-zinc-300">当前阶段</p>
          <p className="mt-2 text-sm font-medium">本地曲库管理闭环</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            支持歌曲导入、信息编辑和发布状态管理。
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <details className="group relative">
              <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg border bg-white [&::-webkit-details-marker]:hidden">
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">打开后台导航</span>
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-white p-2 shadow-xl">
                <PrimaryNavigation mobile />
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section
            className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            id="overview"
          >
            <div>
              <p className="text-sm font-medium text-zinc-500">曲库管理</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                歌曲概览
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                查看本地曲库中的歌曲状态与 Tag 完整度。
              </p>
            </div>
            <MusicUploadDialog />
          </section>

          <section
            aria-label="曲库数据概览"
            className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            {overviewItems.map((item) => (
              <article className="rounded-xl border bg-white p-4 sm:p-5" key={item.label}>
                <p className="text-xs font-medium text-zinc-500">{item.label}</p>
                <strong className="mt-3 block text-2xl font-semibold tabular-nums sm:text-3xl">
                  {item.value}
                </strong>
                <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-8" id="tracks">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">歌曲管理</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  共 {tracks.length} 首歌曲
                </p>
              </div>
              <div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex">
                <CircleUserRound className="size-5" aria-hidden="true" />
                本地管理员
              </div>
            </div>
            {tracks.length > 0 ? (
              <>
                <DesktopTrackTable tracks={tracks} />
                <MobileTrackList tracks={tracks} />
              </>
            ) : (
              <div className="rounded-xl border border-dashed bg-white px-6 py-14 text-center">
                <Music2 className="mx-auto size-8 text-zinc-400" aria-hidden="true" />
                <h3 className="mt-4 font-medium">本地曲库还是空的</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  请在桌面端使用右上角“导入歌曲”保存第一首音乐。
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
