import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from "react-toastify";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./i18n";

import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import './index.css'
import "./styles/common/variables.css";
import "./styles/common/style.css";
import App from "./App.jsx";



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
    />
    <App />
  </StrictMode>,
)
