import { baseApi } from "./baseApi";
import type { User, Organization } from "../types/api.types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<any, any>({
      query: (credentials) => ({
        url: "/auth/signup",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Organization"],
    }),
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Organization"],
    }),
    googleLogin: builder.mutation<any, { idToken: string; organizationName?: string }>({
      query: (payload) => ({
        url: "/auth/google",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["User", "Organization"],
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Organization", "TechnologyInventory", "Subscription", "Run", "Report", "Team"],
    }),
    forgotPassword: builder.mutation<any, { email: string }>({
      query: (payload) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: payload,
      }),
    }),
    resetPassword: builder.mutation<any, { token: string; body: any }>({
      query: ({ token, body }) => ({
        url: `/auth/reset-password/${token}`,
        method: "POST",
        body,
      }),
    }),
    verifyEmail: builder.query<any, string>({
      query: (token) => `/auth/verify-email/${token}`,
    }),
    getCurrentSession: builder.query<any, void>({
      query: () => "/organization", // Org endpoint serves as session verification
      providesTags: ["User", "Organization"],
    }),
    getVerificationStatus: builder.query<{ emailVerified: boolean; email: string }, string>({
      query: (pendingToken) => ({
        url: "/auth/verification-status",
        params: { pendingToken },
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery,
  useGetCurrentSessionQuery,
  useLazyGetVerificationStatusQuery,
} = authApi;
