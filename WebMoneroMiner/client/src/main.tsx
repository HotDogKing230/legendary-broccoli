import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add meta tags for mobile optimization
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1';
document.getElementsByTagName('head')[0].appendChild(meta);

// Set page title
document.title = "MinerDash - Browser Mining Dashboard";

// Add Google Fonts
const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
fontLink.rel = "stylesheet";
document.getElementsByTagName('head')[0].appendChild(fontLink);

createRoot(document.getElementById("root")!).render(<App />);
