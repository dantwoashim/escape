import { createRoot } from "react-dom/client";
import "@fontsource-variable/fraunces";
import "@fontsource/geist";
import "@fontsource/geist-mono";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
