import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Activity } from '../api/activity';
import { getErrorMessage } from '../api/error';
import { userAPI } from '../api/user';

export type FavoriteErrorKind = 'load' | 'mutation' | null;

export const useFavorites = (enabled: boolean) => {
  const [favorites, setFavorites] = useState<Activity[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<FavoriteErrorKind>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const mutatingIdRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);
  const readyRef = useRef(false);
  const favoriteIdsRef = useRef<Set<string>>(new Set());
  const requestGenerationRef = useRef(0);
  const stateVersionRef = useRef(0);

  useLayoutEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      requestGenerationRef.current += 1;
      stateVersionRef.current += 1;
      mutatingIdRef.current = null;
      readyRef.current = false;
      favoriteIdsRef.current = new Set();
      setMutatingId(null);
      setFavorites([]);
      setFavoriteIds(new Set());
      setReady(false);
      setError(null);
      setErrorKind(null);
      setLoading(false);
    }
  }, [enabled]);

  const reload = useCallback(async () => {
    if (!enabled || !enabledRef.current) return;

    const requestGeneration = ++requestGenerationRef.current;
    readyRef.current = false;
    setReady(false);
    setLoading(true);
    setError(null);
    setErrorKind(null);
    try {
      const response = await userAPI.getFavorites();
      if (!response.success) throw new Error('Failed to load favorites');
      if (!enabledRef.current || requestGeneration !== requestGenerationRef.current) return;
      const nextFavoriteIds = new Set(response.data.activities.map(activity => activity._id));
      favoriteIdsRef.current = nextFavoriteIds;
      readyRef.current = true;
      setFavorites(response.data.activities);
      setFavoriteIds(nextFavoriteIds);
      setReady(true);
    } catch (requestError) {
      if (!enabledRef.current || requestGeneration !== requestGenerationRef.current) return;
      readyRef.current = false;
      setReady(false);
      setError(getErrorMessage(requestError, 'Failed to load favorites'));
      setErrorKind('load');
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
    if (!enabled || !enabledRef.current || !readyRef.current || mutatingIdRef.current) return;

    const stateVersion = stateVersionRef.current;
    const isFavorite = favoriteIdsRef.current.has(activityId);
    mutatingIdRef.current = activityId;
    setMutatingId(activityId);
    setError(null);
    setErrorKind(null);
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
      setErrorKind('mutation');
    } finally {
      if (stateVersion === stateVersionRef.current) {
        mutatingIdRef.current = null;
        setMutatingId(null);
      }
    }
  }, [enabled, reload]);

  return { favorites, favoriteIds, loading, ready, error, errorKind, mutatingId, toggleFavorite, reload };
};
