import { baseApi } from "./baseApi";
import type { Organization } from "../types/api.types";

export const organizationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrganization: builder.query<Organization, void>({
      query: () => "/organization",
      providesTags: ["Organization"],
    }),
    updateOnboardingStep1: builder.mutation<Organization, { industry: string; companySize: string; complianceFrameworks: string[] }>({
      query: (body) => ({
        url: "/organization/onboarding/step-1",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Organization"],
    }),
    updateOnboardingStep3: builder.mutation<Organization, { reportFrequency: string; minSeverity: string; notifyEmails: string[] }>({
      query: (body) => ({
        url: "/organization/onboarding/step-3",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Organization"],
    }),
    deleteOrganization: builder.mutation<{ success: boolean; message: string }, { confirmName: string }>({
      query: (body) => ({
        url: "/organization",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["User", "Organization"],
    }),
  }),
});

export const {
  useGetOrganizationQuery,
  useUpdateOnboardingStep1Mutation,
  useUpdateOnboardingStep3Mutation,
  useDeleteOrganizationMutation,
} = organizationApi;
