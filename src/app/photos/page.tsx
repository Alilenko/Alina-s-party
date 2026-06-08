"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import PhotoLightbox from "@/components/PhotoLightbox";
import ResponsivePhoto from "@/components/ResponsivePhoto";
import { createClient } from "@/lib/supabase";

interface GalleryPhoto {
  id: string;
  photo_url: string;
  created_at: string;
  participant?: { name: string; photo_url: string | null };
  task?: { title: string };
}

function normalizeGallery(
  rows: {
    id: string;
    photo_url: string;
    created_at?: string;
    completed_at?: string | null;
    participant?: { name: string; photo_url: string | null } | { name: string; photo_url: string | null }[];
    task?: { title: string } | { title: string }[];
  }[]
): GalleryPhoto[] {
  return rows.map((row) => ({
    id: row.id,
    photo_url: row.photo_url,
    created_at: row.created_at || row.completed_at || "",
    participant: Array.isArray(row.participant) ? row.participant[0] : row.participant,
    task: Array.isArray(row.task) ? row.task[0] : row.task,
  }));
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    const supabase = createClient();

    const { data: fromCompletions } = await supabase
      .from("task_completions")
      .select("id, photo_url, created_at, participant:participants(name, photo_url), task:tasks(title)")
      .not("photo_url", "is", null)
      .order("created_at", { ascending: false });

    if (fromCompletions?.length) {
      setPhotos(normalizeGallery(fromCompletions));
      return;
    }

    const { data: fromUserTasks } = await supabase
      .from("user_tasks")
      .select("id, photo_url, completed_at, participant:participants(name, photo_url), task:tasks(title)")
      .not("photo_url", "is", null)
      .order("completed_at", { ascending: false });

    setPhotos(normalizeGallery(fromUserTasks || []));
  }

  return (
    <div className="pb-24">
      <PageHeader title="ФОТО" />

      {photos.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-party-cream/40">
          Поки немає фото. Завантаж перше у завданні «Зроби спільне фото»!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4">
          {photos.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setLightbox({
                  src: item.photo_url,
                  caption: `${item.participant?.name} — ${item.task?.title || "Фото"}`,
                })
              }
              className="party-card overflow-hidden p-0 text-left transition-all hover:border-party-gold/50"
            >
              <div className="flex justify-center p-2">
                <ResponsivePhoto
                  src={item.photo_url}
                  alt={item.task?.title || "Фото"}
                  thumbnail
                />
              </div>
              <div className="flex items-center gap-2 border-t border-party-gold/10 p-2">
                <Avatar
                  src={item.participant?.photo_url}
                  name={item.participant?.name || "?"}
                  size="sm"
                  shape="square"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-party-cream">
                    {item.participant?.name}
                  </p>
                  <p className="truncate text-[10px] text-party-cream/50">
                    {item.task?.title}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          src={lightbox.src}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
