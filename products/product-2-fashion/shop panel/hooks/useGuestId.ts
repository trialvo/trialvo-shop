"use client"

import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/redux/hooks';
import { setGuestId } from '@/redux/slices/cartSlice';
import { useCallback, useEffect, useState } from 'react';

interface UseGuestId {
  id: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<string | null>;
}

type UseGuestIdOptions = {
  auto?: boolean;
};

const CONFIG = {
  prefix: 'go-',
  length: 7,
  ttl: 24 * 60 * 60 * 1000,
} as const;

const generateSimpleHash = (str: string): number => {
  let hash = 0;
  let i = 0;
  while (i < str.length) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
    i++;
  }
  return Math.abs(hash);
};

const getIP = async (): Promise<string> => {
  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
  ];

  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(service, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data?.ip && typeof data.ip === 'string' && data.ip.trim()) {
          return data.ip.trim();
        }
      }
    } catch {
      continue;
    }
  }

  return `unknown-${Math.random().toString(36).substring(2, 9)}`;
};

const generateId = async (): Promise<string> => {
  const timestamp = Date.now();
  const ip = await getIP();
  const userAgent = navigator.userAgent || 'unknown';

  const combinedString = `${timestamp}-${ip}-${userAgent}`;

  const hash = generateSimpleHash(combinedString);
  const numericId = (hash % 9000) + 1000;

  return `${CONFIG.prefix}${numericId}`;
};

const getStored = (): { id: string; time: number } | null => {
  try {
    const storedData = localStorage.getItem('guestIdData');
    if (!storedData) return null;

    const parsed = JSON.parse(storedData);
    if (!parsed?.id || !parsed?.timestamp) return null;

    if (!parsed.id.startsWith(CONFIG.prefix) || parsed.id.length !== CONFIG.length) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CONFIG.ttl) {
      return null;
    }

    return { id: parsed.id, time: parsed.timestamp };
  } catch {
    return null;
  }
};

export const getGuestIdFromStorage = (): {
  id: string;
  timestamp: number;
  generatedAt: string;
} | null => {
  try {
    const storedData = localStorage.getItem('guestIdData');
    if (!storedData) return null;

    const parsed = JSON.parse(storedData);
    if (!parsed?.id || !parsed?.timestamp || !parsed?.generatedAt) return null;

    if (!parsed.id.startsWith(CONFIG.prefix) || parsed.id.length !== CONFIG.length) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CONFIG.ttl) {
      return null;
    }

    return {
      id: parsed.id,
      timestamp: parsed.timestamp,
      generatedAt: parsed.generatedAt,
    };
  } catch {
    return null;
  }
};


export const useGuestId = (options?: UseGuestIdOptions): UseGuestId => {
  const auto = options?.auto ?? true;
  const { isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (isAuthenticated) {
      setLoading(false);
      setId(null);
      return null;
    }
    setLoading(true);
    setError(null);

    try {
      const newId = await generateId();

      const data = {
        id: newId,
        timestamp: Date.now(),
        generatedAt: new Date().toISOString(),
      };

      if(data) {
        dispatch(setGuestId(data))
      }

      if (!newId.startsWith(CONFIG.prefix)) {
        throw new Error('Generated ID does not start with "go-"');
      }

      if (newId.length !== CONFIG.length) {
        throw new Error(`Generated ID length is ${newId.length}, expected ${CONFIG.length}`);
      }

      setId(newId);
      return newId;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? `Failed to generate guest ID: ${err.message}`
        : 'Failed to generate guest ID';

      setError(errorMessage);
      console.error(err);

      const fallbackNum = Math.floor(Math.random() * 9000) + 1000;
      const fallbackId = `${CONFIG.prefix}${fallbackNum}`;
      setId(fallbackId);
      return fallbackId;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setId(null);
      setLoading(false);
      return;
    }

    if (!auto) {
      const stored = getStored();
      if (stored) {
        setId(stored.id);
      }
      setLoading(false);
      return;
    }

    const stored = getStored();
    if (stored) {
      setId(stored.id);
      setLoading(false);
      return;
    }

    refresh();
  }, [auto, refresh, isAuthenticated]);

  return {
    id,
    loading,
    error,
    refresh,
  };
};
