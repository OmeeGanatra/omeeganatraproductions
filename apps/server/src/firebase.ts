// Firebase Cloud Functions v2 entry point
// Workers are disabled — Cloud Functions don't support persistent background processes.
process.env.DISABLE_INPROCESS_WORKERS = "1";

import { onRequest } from "firebase-functions/v2/https";
import app from "./app.js";

export const api = onRequest(
  {
    region: "asia-south1",
    memory: "1GiB",
    timeoutSeconds: 540,
    concurrency: 80,
    minInstances: 0,
  },
  app
);
