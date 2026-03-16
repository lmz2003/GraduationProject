import { useEffect, useRef, useCallback } from 'react';

interface UseAbortControllerOptions {
  onAbort?: () => void;
}

export function useAbortController(options?: UseAbortControllerOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        options?.onAbort?.();
      }
    };
  }, [options]);

  const getSignal = useCallback(() => {
    if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      options?.onAbort?.();
    }
  }, [options]);

  const reset = useCallback(() => {
    abortControllerRef.current = new AbortController();
  }, []);

  return {
    getSignal,
    abort,
    reset,
    isAborted: () => abortControllerRef.current?.signal.aborted ?? false,
  };
}

export function createCancelableFetch<T>(
  url: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  return fetch(url, { ...options, signal }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}
