import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { reportApi } from "../../../api/reportApi";
import { baseApi } from "../../../api/baseApi";
import type { Run } from "../../../types/api.types";

export const useRunStream = (runId: string | undefined) => {
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`/api/runs/${runId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Run;
        setActiveRun(data);

        if (data.status === "completed") {
          // Manual invalidate of Reports and Runs list tags upon SSE completion signal
          dispatch(reportApi.util.invalidateTags(["Report"]));
          dispatch(baseApi.util.invalidateTags(["Run"]));
          eventSource.close();
        } else if (data.status === "failed" || data.status === "cancelled") {
          dispatch(baseApi.util.invalidateTags(["Run"]));
          eventSource.close();
        }
      } catch (err) {
        setError("Error parsing agent pipeline data stream");
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError("Lost connection to cybersecurity intelligence agent pipeline");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [runId, dispatch]);

  return { activeRun, error };
};
