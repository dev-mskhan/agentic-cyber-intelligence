/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ToastProvider } from "./components/ui/Toast";
import { AppRouter } from "./routes/router";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID in environment");
  }
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={clientId}>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
      </GoogleOAuthProvider>
    </Provider>
  );
}
