import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const enabledRef = useRef(enabled);
  const requestGenerationRef = useRef(0);
  const stateVersionRef = useRef(0);

  useLayoutEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      requestGenerationRef.current += 1;
      stateVersionRef.current += 1;
      mutatingIdRef.current = null;
      setMutatingId(null);
      setFavorites([]);
      setFavoriteIds(new Set());
      setError(null);
      setLoading(false);
    }
  }, [enabled]);

  const reload = useCallback(async () => {
    if (!enabled || !enabledRef.current) return;

    const requestGeneration = ++requestGenerationRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.getFavorites();
      if (!response.success) throw new Error('Failed to load favorites');
      if (!enabledRef.current || requestGeneration !== requestGenerationRef.current) return;
      setFavorites(response.data.activities);
      setFavoriteIds(new Set(response.data.activities.map(activity => activity._id)));
    } catch (requestError) {
      if (!enabledRef.current || requestGeneration !== requestGenerationRef.current) return;
      setError(getErrorMessage(requestError, 'Failed to load favorites'));
    } finally {
      if (enabledRef.current && requestGeneration === requestGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleFavorite = useCallback(async (activityId: string) => {
    if (!enabled || mutatingIdRef.current) return;

    const stateVersion = stateVersionRef.current;
    const isFavorite = favoriteIds.has(activityId);
    mutatingIdRef.current = activityId;
    setMutatingId(activityId);
    setError(null);
    try {
      const response = isFavorite
        ? await userAPI.removeFavorite(activityId)
        : await userAPI.addFavorite(activityId);
      if (!response.success) {
        throw new Error('Failed to update favorites');
      }
      if (!enabledRef.current || stateVersion !== stateVersionRef.current) {
        return;
      }
      await reload();
    } catch (requestError) {
      if (!enabledRef.current || stateVersion !== stateVersionRef.current) return;
      setError(getErrorMessage(requestError, 'Failed to update favorites'));
    } finally {
      if (stateVersion === stateVersionRef.current) {
        mutatingIdRef.current = null;
        setMutatingId(null);
      }
    }
  }, [enabled, favoriteIds, reload]);

  return { favorites, favoriteIds, loading, error, mutatingId, toggleFavorite, reload };
};
