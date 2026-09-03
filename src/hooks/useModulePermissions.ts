import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loads the module permissions of a given user.
 * Returns null while unknown / not loaded, and {} when the user has no saved rows
 * (which means "fall back to role-based behaviour").
 */
export const useModulePermissions = (userId: string | undefined) => {
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setPermissions(null);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("module, enabled")
        .eq("user_id", userId);

      if (error) throw error;

      const map: Record<string, boolean> = {};
      (data || []).forEach((row) => {
        map[row.module] = row.enabled;
      });
      setPermissions(map);
    } catch (error) {
      console.error("Error loading module permissions:", error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`module-permissions-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_module_permissions",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchPermissions(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchPermissions]);

  return { permissions, loading, refetch: fetchPermissions };
};
