const PREFIX = "";

const req = (url, options = {}) => {
  const { body } = options;
  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    credentials: "include",
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body ? { "Content-Type": "application/json" } : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        }),
  );
};

const qs = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

export const getNotes = ({ age, search, page } = {}) => req(`/api/notes?${qs({ age, search, page })}`);

export const createNote = (title, text) => req(`/api/notes`, { method: "POST", body: { title, text } });

export const getNote = (id) => req(`/api/notes/${id}`);

export const archiveNote = (id) => req(`/api/notes/${id}/archive`, { method: "PATCH" });

export const unarchiveNote = (id) => req(`/api/notes/${id}/unarchive`, { method: "PATCH" });

export const editNote = (id, title, text) => req(`/api/notes/${id}`, { method: "PUT", body: { title, text } });

export const deleteNote = (id) => req(`/api/notes/${id}`, { method: "DELETE" });

export const deleteAllArchived = () => req(`/api/notes`, { method: "DELETE" });

export const notePdfUrl = (id) => `/api/notes/${id}/pdf`;
