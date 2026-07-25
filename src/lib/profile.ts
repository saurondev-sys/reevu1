import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

function profileFromUser(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email ?? null,
    full_name:
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      null,
    avatar_url:
      (user.user_metadata.avatar_url as string | undefined) ??
      (user.user_metadata.picture as string | undefined) ??
      null,
    created_at: user.created_at,
  };
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const fallback = profileFromUser(user);

  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: fallback.id,
        email: fallback.email,
        full_name: fallback.full_name,
        avatar_url: fallback.avatar_url,
      },
      { onConflict: "id" },
    )
    .select("id,email,full_name,avatar_url,created_at")
    .single();

  if (error || !data) {
    console.warn("Profile sync failed; using authentication metadata:", error?.message);
    return fallback;
  }

  return data as UserProfile;
}
