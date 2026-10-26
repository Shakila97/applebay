type CsrfResponse = {
  token: string;
  headerName: string;
};

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfResponse = await fetch("/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!csrfResponse.ok) {
      throw new Error("Could not prepare the request. Try logging in again.");
    }

    const csrf: CsrfResponse = await csrfResponse.json();
    headers.set(csrf.headerName, csrf.token);
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
  });
}
