"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Browser-side Better Auth client. Talks to /api/auth on the current origin. */
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        company: { type: "string", required: false },
      },
    }),
  ],
});
