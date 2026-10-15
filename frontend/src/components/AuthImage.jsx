import { useState, useEffect, useRef } from 'react';
import { fetchAuthImage } from '../utils/fetchAuthImage';

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
    const load = (url, allowFallback) => {
      fetchAuthImage(url)
        .then(objectUrl => {
          if (cancelled) { URL.revokeObjectURL(objectUrl); return; }
          if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
          currentBlobUrl.current = objectUrl;
          setBlobUrl(objectUrl);
        })
        .catch(error => {
          if (cancelled || error.name === 'AbortError') return;
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
      <div style={{ ...style, filter: 'none', ...placeholderStyle }} className={className}>
        {message && <span>{message}</span>}
      </div>
    );
  }
  return <img src={blobUrl} alt={alt} style={style} onLoad={onLoad} className={className} {...props} />;
}
