import { API } from '../config';

async function fetchJSON(path) {
  const r = await fetch(API(path));
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}

export const ytApi = {
  home: () => fetchJSON('/api/home'),
  charts: () => fetchJSON('/api/charts'),
  moods: () => fetchJSON('/api/moods'),
  search: (q, filter) => {
    const p = new URLSearchParams({ q });
    if (filter) p.set('filter', filter);
    return fetchJSON(`/api/search?${p.toString()}`);
  },
  suggest: (q) => fetchJSON(`/api/suggest?q=${encodeURIComponent(q)}`),
  next: (videoId, playlistId) => {
    const p = new URLSearchParams({ videoId });
    if (playlistId) p.set('playlistId', playlistId);
    return fetchJSON(`/api/next?${p.toString()}`);
  },
  related: (browseId) => fetchJSON(`/api/related?browseId=${encodeURIComponent(browseId)}`),
  browse: (id, params) => {
    const p = new URLSearchParams({ id });
    if (params) p.set('params', params);
    return fetchJSON(`/api/browse?${p.toString()}`);
  },
  lyrics: (title, artist, duration, browseId) => {
    const p = new URLSearchParams({ title, artist, duration: String(duration || 0) });
    if (browseId) p.set('browseId', browseId);
    return fetchJSON(`/api/lyrics?${p.toString()}`);
  },
  audio: (videoId) => fetchJSON(`/api/audio?videoId=${encodeURIComponent(videoId)}`),
  sponsorblock: (videoId) => fetchJSON(`/api/sponsorblock?videoId=${encodeURIComponent(videoId)}`),
  downloadStart: (videoId) => fetchJSON(`/api/download-start?videoId=${encodeURIComponent(videoId)}`),
  downloadProgress: (progressUrl) => fetchJSON(`/api/download-progress?progressUrl=${encodeURIComponent(progressUrl)}`),
  resolve: (url) => fetchJSON(`/api/resolve?url=${encodeURIComponent(url)}`),
};
