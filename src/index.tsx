import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Link,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import "./index.css";
import InGame from "./pages/inGame";
import Lobby from "./pages/lobby";
import reportWebVitals from "./reportWebVitals";
import { WebsocketProvider, socket } from "./contexts/WebsocketContext";
import { Toaster } from "react-hot-toast";
import { AiOutlineGithub, AiFillCode } from "react-icons/ai";
import { BiSolidServer } from "react-icons/bi";
import NotFound from "./pages/notFound";
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
  {
    path: "*",
    element: <NotFound/>,
  }
]);
root.render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
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
      <div className="fixed flex gap-3 bottom-3 left-0 right-0 justify-center items-end">
        <a
          target="_blank"
          href={"https://github.com/prokittikun/club-beeper-word"}
          rel="noreferrer"
        >
          <AiOutlineGithub size="25px" color="white" />
        </a>
        <a
          target="_blank"
          href={"https://web.facebook.com/profile.php?id=100008049784667"}
          rel="noreferrer"
        >
          <AiFillCode size="25px" color="white" />
        </a>
        <a
          target="_blank"
          href={"https://web.facebook.com/jgogo01"}
          rel="noreferrer"
        >
          <BiSolidServer size="25px" color="white" />
        </a>
        {/* <p className="text-white">Powered by <u> <a href="https://web.facebook.com/jgogo01">Natdanai</a></u></p> */}
        
      </div>
    </WebsocketProvider>
    {/* </BrowserRouter> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
