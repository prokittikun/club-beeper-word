import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import InGame from "./pages/inGame";
import Lobby from "./pages/lobby";
import reportWebVitals from "./reportWebVitals";
import { WebsocketProvider, socket } from "./contexts/WebsocketContext";
import { Toaster } from "react-hot-toast";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
const router = createBrowserRouter([
  {
    path: "/",
    element: <Lobby />,
  },
  {
    path: "/lobby",
    element: <Lobby />,
  },
  {
    path: "/g/:gameId",
    element: <InGame />,
  },
]);
root.render(
  <React.StrictMode>
    <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: "",
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#363636",
          },
        }}
      />
    <WebsocketProvider value={socket}>
      <RouterProvider router={router} />
    </WebsocketProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
