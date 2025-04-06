import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Simple data fetcher
export async function fetchData<T>(url: string, options?: RequestInit): Promise<T | null> {
  console.log(`fetchData: Fetching ${url}`);
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...options,
    });

    console.log(`fetchData: Response status for ${url}:`, res.status, res.statusText);

    if (res.status === 401) {
      console.log(`fetchData: Unauthorized (401) for ${url}`);
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`fetchData: Successfully fetched data from ${url}`);
    return data;
  } catch (error) {
    console.error(`fetchData: Error fetching ${url}:`, error);
    throw error;
  }
}

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`getQueryFn: Fetching ${url}`);
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });
      
      console.log(`getQueryFn: Response status for ${url}:`, res.status, res.statusText);

      if (options.on401 === "returnNull" && res.status === 401) {
        console.log(`getQueryFn: Unauthorized (401) for ${url}, returning null`);
        return null as any;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`getQueryFn: Successfully fetched data from ${url}`);
      return data;
    } catch (error) {
      console.error(`getQueryFn: Error fetching ${url}:`, error);
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
