import { useState, useEffect, useRef } from 'react';

export default function AuthImage({ src, fallbackSrc, alt, style, onLoad, className, loadingText, errorText, placeholderStyle, ...props }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const currentBlobUrl = useRef(null);

  useEffect(() => {
    setLoadError(false);
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }
    setBlobUrl(null);

    if (!src) {
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
          else setLoadError(true);
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

  if (!blobUrl) {
    const message = loadError ? (errorText || loadingText) : loadingText;
    return (
      <div style={{ ...style, ...placeholderStyle }} className={className}>
        {message && <span>{message}</span>}
      </div>
    );
  }
  return <img src={blobUrl} alt={alt} style={style} onLoad={onLoad} className={className} {...props} />;
}
