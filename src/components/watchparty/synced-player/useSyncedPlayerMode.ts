import { useEffect, useMemo, useState } from "react";
import { detectProvider } from "@/lib/iframeSync";

export function useSyncedPlayerMode(src: string, embed?: string) {
  const [hlsFailed, setHlsFailed] = useState(false);
  useEffect(() => {
    setHlsFailed(false);
  }, [src]);
  const useIframe = (!src && !!embed) || (hlsFailed && !!embed);
  const iframeInfo = useMemo(
    () => (useIframe && embed ? detectProvider(embed) : null),
    [useIframe, embed],
  );
  return { hlsFailed, setHlsFailed, useIframe, iframeInfo };
}
