import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL}/api/v1`,
  credentials: "include",
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Attempt silent token refresh
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Retry original request
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Redirect to login or dispatch log out
      if (typeof window !== "undefined") {
        window.location.hash = "/login";
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Organization",
    "TechnologyInventory",
    "Subscription",
    "Run",
    "Report",
    "Team",
    "Plans"
  ],
  endpoints: () => ({}),
});
