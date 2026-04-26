import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import { API_HOST } from "./lib/api-base";
import "./index.css";

if (API_HOST) {
  setBaseUrl(API_HOST);
}

createRoot(document.getElementById("root")!).render(<App />);
