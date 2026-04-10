import React from "react";
import ReactDOM from "react-dom/client";
import "../../../src/styles/index.css";
import { PartSkeletonApp } from "../../../packages/ui-kit/src";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PartSkeletonApp partId="P3" />
  </React.StrictMode>
);
