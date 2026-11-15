import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Radio } from "lucide-react";
import { audius, normalizeTrack } from "@/lib/audius";
import { TrackList } from "@/components/track-row";
import { Artwork } from "@/components/artwork";
import { fmtCount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const user = await audius.userByHandle(decodeURIComponent(handle));
  if (!user) notFound();

  const rawTracks = (await audius.userTracks(user.id)) ?? [];
  const tracks = rawTracks
    .filter((t) => t.is_streamable !== false)
    .map(normalizeTrack);

  return (
    <div className="px-8 pt-8 pb-12">
      {/* header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-line">
        {user.cover_photo?.["2000x"] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.cover_photo["2000x"]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
        <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-end">
          <Artwork
            src={user.profile_picture?.["480x480"] ?? user.profile_picture?.["150x150"]}
            alt={user.name}
            size={168}
            className="h-[168px] w-[168px] rounded-full border-2 border-accent/50 object-cover shadow-[0_0_50px_rgba(0,224,101,0.3)]"
          />
          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
              Артист
            </div>
            <h1 className="font-display flex items-center gap-2 text-4xl font-black tracking-tight">
              <span className="truncate">{user.name}</span>
              {user.is_verified && (
                <BadgeCheck size={26} className="shrink-0 text-accent" />
              )}
            </h1>
            <div className="mt-1 text-sm text-mist">@{user.handle}</div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-faint">
              <span>
                <b className="text-ink">{fmtCount(user.follower_count ?? 0)}</b>{" "}
                слушателей
              </span>
              <span>
                <b className="text-ink">{user.track_count ?? tracks.length}</b>{" "}
                треков
              </span>
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {user.location}
                </span>
              )}
            </div>
            {user.bio && (
              <p className="mt-3 line-clamp-2 max-w-2xl text-[13px] text-mist">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      <h2 className="font-display mb-4 text-xl font-bold tracking-tight">
        Треки
      </h2>
      {tracks.length > 0 ? (
        <div className="rounded-2xl border border-line bg-panel/60 p-2">
          <TrackList tracks={tracks} showArtist={false} />
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line py-16 text-center">
          <Radio className="mb-3 text-faint" size={24} />
          <p className="text-sm text-mist">У этого артиста пока нет публичных треков.</p>
        </div>
      )}
    </div>
  );
}
