import { baseApi } from "./baseApi";
import type { ReportSummary, ReportDetail, Mitigation } from "../types/api.types";

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<any, void>({
      query: () => "/report",
      providesTags: ["Report"],
    }),
    getReport: builder.query<any, string>({
      query: (id) => `/report/${id}`,
      providesTags: (result, error, id) => [{ type: "Report", id }],
    }),
    deleteReport: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/report/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Report"],
    }),
    toggleMitigation: builder.mutation<any, { id: string; reportId: string; isCompleted: boolean }>({
      query: ({ id, isCompleted }) => ({
        url: `/mitigation/${id}/toggle`,
        method: "PATCH",
        body: { isCompleted },
      }),
      async onQueryStarted({ id, reportId, isCompleted }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reportApi.util.updateQueryData("getReport", reportId, (draft) => {
            const mit = draft.mitigations?.find((m) => m.id === id);
            if (mit) {
              mit.isCompleted = isCompleted;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportQuery,
  useDeleteReportMutation,
  useToggleMitigationMutation,
} = reportApi;
