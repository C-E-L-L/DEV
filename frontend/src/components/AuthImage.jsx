import { useState, useEffect, useRef } from 'react';

export default function AuthImage({ src, fallbackSrc, alt, style, onLoad, className, ...props }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const currentBlobUrl = useRef(null);

  useEffect(() => {
    if (!src) {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }
      setBlobUrl(null);
      return;
    }

    let cancelled = false;
    const token = localStorage.getItem('token');
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const load = (url, allowFallback) => {
      fetch(url, authHeaders)
        .then(res => res.ok ? res.blob() : Promise.reject(res.status))
        .then(blob => {
          if (cancelled) return;
          if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
          const objectUrl = URL.createObjectURL(blob);
          currentBlobUrl.current = objectUrl;
          setBlobUrl(objectUrl);
        })
        .catch(() => {
          if (cancelled) return;
          if (allowFallback && fallbackSrc) load(fallbackSrc, false);
        });
    };

    load(src, true);

    return () => { cancelled = true; };
  }, [src, fallbackSrc]);

  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
    };
  }, []);

  if (!blobUrl) return <div style={style} className={className} />;
  return <img src={blobUrl} alt={alt} style={style} onLoad={onLoad} className={className} {...props} />;
}
