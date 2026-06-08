import { useState, useEffect, useRef } from 'react';

export default function AuthImage({ src, alt, style, onLoad, className, ...props }) {
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

    fetch(src, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(res => res.ok ? res.blob() : Promise.reject(res.status))
      .then(blob => {
        if (cancelled) return;
        if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
        const url = URL.createObjectURL(blob);
        currentBlobUrl.current = url;
        setBlobUrl(url);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
    };
  }, []);

  if (!blobUrl) return <div style={style} className={className} />;
  return <img src={blobUrl} alt={alt} style={style} onLoad={onLoad} className={className} {...props} />;
}
