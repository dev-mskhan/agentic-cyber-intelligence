import { baseApi } from "./baseApi";
import type { Run } from "../types/api.types";

export const runApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRuns: builder.query<any, void>({
      query: () => "/run",
      providesTags: ["Run"],
    }),
    getRun: builder.query<any, string>({
      query: (id) => `/run/${id}`,
      providesTags: ["Run"],
    }),
    startRun: builder.mutation<any, void>({
      query: () => ({
        url: "/run",
        method: "POST",
      }),
      invalidatesTags: ["Run"],
    }),
    stopRun: builder.mutation<any, string>({
      query: (id) => ({
        url: `/run/${id}/stop`,
        method: "POST",
      }),
      invalidatesTags: ["Run"],
    }),
  }),
});

export const {
  useGetRunsQuery,
  useGetRunQuery,
  useStartRunMutation,
  useStopRunMutation,
} = runApi;
