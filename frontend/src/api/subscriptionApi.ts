import { baseApi } from "./baseApi";
import type { PlanTier } from "../types/api.types";

export interface Subscription {
  _id: string;
  organizationId: string;
  planTier: PlanTier;
  status: "active" | "past_due" | "canceled" | string;
  runsIncluded: number;
  runsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  tier: PlanTier;
  runs: number;
  price: number;
  durationInMonths: number;
}

interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export const subscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubscription: builder.query<Subscription, void>({
      query: () => "/subscription",
      transformResponse: (response: ApiEnvelope<Subscription>) => response.data,
      providesTags: ["Subscription"],
    }),
    createCheckout: builder.mutation<{ checkoutUrl: string }, { planTier: PlanTier }>({
      query: (body) => ({
        url: "/subscription/checkout",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<{ checkoutUrl: string }>) => response.data,
      invalidatesTags: ["Subscription"],
    }),
    createPortal: builder.mutation<{ portalUrl: string }, void>({
      query: () => ({
        url: "/subscription/portal",
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<{ portalUrl: string }>) => response.data,
    }),
    getPlans: builder.query<Plan[], void>({
      query: () => "/subscription/plans",
      transformResponse: (response: ApiEnvelope<Plan[]>) => response.data,
      providesTags: ["Plans"],
    }),
  }),
});

export const {
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useCreatePortalMutation,
  useGetPlansQuery,
} = subscriptionApi;
