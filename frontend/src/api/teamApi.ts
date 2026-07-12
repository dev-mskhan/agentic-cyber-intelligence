import { baseApi } from "./baseApi";
import type { User, UserRole } from "../types/api.types";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeam: builder.query<any, void>({
      query: () => "/team",
      providesTags: ["Team"]
    }),
    inviteMember: builder.mutation<User, { email: string; role: UserRole }>({
      query: (body) => ({
        url: "/team/invite",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Team"],
    }),
    updateMemberRole: builder.mutation<User, { userId: string; role: UserRole; emailNotify: boolean }>({
      query: ({ userId, role, emailNotify }) => ({
        url: `/team/${userId}/update`,
        method: "PATCH",
        body: { role, emailNotify },
      }),
      invalidatesTags: ["Team", "Organization"],
    }),
    acceptInvite: builder.mutation<User, { token: string; name: string; password: string; confirmPassword: string }>({
      query: ({ token, name, password, confirmPassword }) => ({
        url: `/team/accept-invite/${token}`,
        method: "POST",
        body: { name, password, confirmPassword },
      }),
      invalidatesTags: ["User", "Organization", "Team"],
    }),
    removeMember: builder.mutation<{ success: boolean }, string>({
      query: (userId) => ({
        url: `/team/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Team"],
    }),
  }),
});

export const {
  useGetTeamQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useAcceptInviteMutation,
  useRemoveMemberMutation,
} = teamApi;
