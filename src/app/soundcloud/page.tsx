import { redirect } from "next/navigation";

export default async function LegacySoundcloudPage({
  searchParams,
}: {
  searchParams: Promise<{ play?: string }>;
}) {
  const params = await searchParams;
  const play = params.play;
  redirect(play ? `/wave?play=${encodeURIComponent(play)}` : "/wave");
}
