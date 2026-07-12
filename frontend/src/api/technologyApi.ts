import { baseApi } from "./baseApi";
import type { TechItem } from "../types/api.types";

export const technologyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTechnology: builder.query<any, void>({
      query: () => "/technology",
      providesTags: ["TechnologyInventory"]
    }),
    searchCatalog: builder.query<any, string>({
      query: (q) => `/technology/catalog/search?q=${encodeURIComponent(q)}`,
    }),
    addTechnology: builder.mutation<any, Omit<TechItem, "id" | "createdAt">>({
      query: (body) => ({
        url: "/technology",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TechnologyInventory"],
    }),
    bulkAddTechnology: builder.mutation<any[], { rows: Array<{ product: string; version: string; purpose?: string; environment?: string; criticality?: string }> }>({
      query: (body) => ({
        url: "/technology/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TechnologyInventory"],
    }),
    deleteTechnology: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/technology/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TechnologyInventory"],
    }),
  }),
});

export const {
  useGetTechnologyQuery,
  useLazySearchCatalogQuery,
  useAddTechnologyMutation,
  useBulkAddTechnologyMutation,
  useDeleteTechnologyMutation,
} = technologyApi;
