import { useCallback, useEffect, useRef, useState } from 'react';
import type { Activity } from '../api/activity';
import { getErrorMessage } from '../api/error';
import { userAPI } from '../api/user';

export const useFavorites = (enabled: boolean) => {
  const [favorites, setFavorites] = useState<Activity[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const mutatingIdRef = useRef<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.getFavorites();
      setFavorites(response.data.activities);
      setFavoriteIds(new Set(response.data.activities.map(activity => activity._id)));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to load favorites'));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleFavorite = useCallback(async (activityId: string) => {
    if (!enabled || mutatingIdRef.current) return;

    const isFavorite = favoriteIds.has(activityId);
    mutatingIdRef.current = activityId;
    setMutatingId(activityId);
    setError(null);
    try {
      if (isFavorite) {
        await userAPI.removeFavorite(activityId);
      } else {
        await userAPI.addFavorite(activityId);
      }
      await reload();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to update favorites'));
    } finally {
      mutatingIdRef.current = null;
      setMutatingId(null);
    }
  }, [enabled, favoriteIds, reload]);

  return { favorites, favoriteIds, loading, error, mutatingId, toggleFavorite, reload };
};
