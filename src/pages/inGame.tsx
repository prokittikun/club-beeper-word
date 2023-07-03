import axios from "axios";
import React, { useContext, useEffect } from "react";
import { toast } from "react-hot-toast";
import { AiOutlinePaperClip } from "react-icons/ai";
import { useNavigate, useParams } from "react-router-dom";
import { WebsocketContext } from "../contexts/WebsocketContext";
type BasicRespPayload = {
  status: number;
  message: string;
  data: {
    roomId: string;
  };
};

type onMessagePayLoad = {
  role: "spy" | "player" | "";
  message: string;
};
function InGame() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const socket = useContext(WebsocketContext);
  const [showModal, setShowModal] = React.useState(false);
  const [gameStatus, setGameStatus] = React.useState<
    "waiting" | "playing" | "finished"
  >("waiting"); // waiting, playing, finished
  const [isHost, setIsHost] = React.useState<boolean>(false);
  const [wordData, setWordData] = React.useState<{
    isSent: boolean;
    word: string;
  }>({ isSent: false, word: "" });
  const [gameData, setGameData] = React.useState<onMessagePayLoad>({
    role: "",
    message: "",
  });
  useEffect(() => {
    setWordData({ isSent: false, word: "" });
    findGameStatus();
    socket.on("onGameStart", (newMessage: BasicRespPayload) => {
      if (newMessage.status === 200) {
        setGameStatus("playing");
      }
    });
    socket.on("onMessage", (newMessage: onMessagePayLoad) => {
      setGameData(newMessage);
    });
    socket.on("onBackToWaitingRoom", (newMessage: BasicRespPayload) => {
      if (newMessage.status === 200) {
        onBackToWaitingRoom();
      }
    });
    if (gameStatus === "playing") {
      toast.error("Game is already started!");
      navigate("/lobby");
    } else {
      socket.emit("join", { roomId: gameId });
      checkHost();
      const keyInterval = setInterval(() => {
        socket.emit("ping", { roomId: gameId });
        socket.emit("checkRoom", { roomId: gameId });
      }, 2500);
      socket.on("onCheckRoom", (newMessage: BasicRespPayload) => {
        if (newMessage.status === 404) {
          toast.error(newMessage.message);
          navigate("/lobby");
          return;
        }
      });

      return () => {
        socket.off("ping");
        socket.off("onCheckRoom");
        socket.off("onGameStart");
        socket.off("onMessage");
        socket.off("onBackToWaitingRoom");
        clearInterval(keyInterval);
      };
    }
  }, [gameId]);
  const checkHost = async () => {
    const clientId = socket.id;
    const payload = {
      roomId: gameId,
      clientId: clientId,
    };
    const resp = await axios.post(
      `${process.env.REACT_APP_API_URL}/gameHost/checkMyRoom`,
      payload
    );
    if (resp.data.resData.isHost) {
      setIsHost(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave", { roomId: gameId });
    navigate("/lobby");
  };

  const findGameStatus = async () => {
    const clientId = socket.id;
    const payload = {
      roomId: gameId,
      clientId: clientId,
    };
    const resp = await axios.post(
      `${process.env.REACT_APP_API_URL}/gameHost/gameStatus`,
      payload
    );
    if (resp.data.resData.gameStatus === 1) {
      toast.error("Game is already started!");
      setGameStatus("playing");
      navigate("/lobby");
    } else {
      setGameStatus("waiting");
    }
  };
  const startGame = () => {
    socket.emit("startGame", { roomId: gameId });
  };

  const sendWord = () => {
    if (!wordData.word) {
      toast.error("Please enter a word");
      return;
    }
    toast.success("Word sent!");
    socket.emit("sendMessage", { roomId: gameId, message: wordData.word });
    setWordData({ ...wordData, isSent: true });
  };

  const backToWaitingRoom = () => {
    socket.emit("backToWaitingRoom", { roomId: gameId });
  };
  const onBackToWaitingRoom = () => {
    setGameData({ role: "", message: "" });
    setWordData({ isSent: false, word: "" });
    setGameStatus("waiting");
  };

  const goToLobby = () => {
    navigate("/lobby");
  };
  return (
    <>
      <div className="absolute top-0 bottom-0 left-0 right-0 flex gap-2 flex-col justify-center items-center z-0">
        {isHost && gameId && gameStatus === "waiting" ? (
          <>
            <span className="text-center text-3xl font-bold text-white tracking-wider">
              Hi host if players is ready, click start!
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(gameId);
                toast.success("Copied to clipboard!");
              }}
              className=" flex justify-center btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
            >
              <AiOutlinePaperClip size={"20px"} />
            </button>
            <button
              className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
              onClick={startGame}
            >
              Start!
            </button>
            <button
              className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
              onClick={goToLobby}
            >
              Left the game
            </button>
          </>
        ) : isHost && gameStatus === "playing" ? (
          <>
            {!wordData.isSent ? (
              <>
                <span className="text-center text-3xl font-bold text-white tracking-wider">
                  Enter your word and click Send!
                </span>
                <input
                  type="text"
                  onChange={(e) =>
                    setWordData({ isSent: false, word: e.target.value })
                  }
                  className="px-4 py-3 rounded-full focus:outline-none"
                  placeholder="WORD"
                />
                <button
                  className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
                  onClick={sendWord}
                >
                  Send!
                </button>
              </>
            ) : null}
            <button
              className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
              onClick={backToWaitingRoom}
            >
              Back
            </button>
          </>
        ) : gameStatus === "waiting" || gameStatus === "finished" ? (
          <>
            <span className="text-center text-3xl font-bold text-white tracking-wider">
              Wait for the host to start the game.
            </span>
            {gameId ? (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gameId);
                  toast.success("Copied to clipboard!");
                }}
                className="flex justify-center btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
              >
                <AiOutlinePaperClip size={"20px"} />
              </button>
            ) : null}
            <button
              className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
              onClick={leaveRoom}
            >
              Left the game
            </button>
          </>
        ) : gameStatus === "playing" ? (
          gameData.role ? (
            <>
              <button
                onClick={() => setShowModal(true)}
                className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
              >
                Show the word
              </button>
              <button
                className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
                onClick={goToLobby}
              >
                Left the game
              </button>
            </>
          ) : (
            <span className="text-center text-3xl font-bold text-white tracking-wider">
              Wait for the host send word!.
            </span>
          )
        ) : null}
        {showModal ? (
          <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
              <div className="relative w-auto my-6 mx-auto lg:max-w-3xl md:max-w-xl sm:max-md">
                {/*content*/}
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  {/*header*/}
                  <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                    <h3 className="text-3xl font-semibold">Your messagse</h3>
                    <button
                      className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                      onClick={() => setShowModal(false)}
                    >
                      <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                        ×
                      </span>
                    </button>
                  </div>
                  {/*body*/}
                  <div className="relative p-6 flex-auto">
                    <p className="my-4 w-[30rem] text-black text-lg leading-relaxed">
                      {gameData.role === "player" ? (
                        <>{gameData.message}</>
                      ) : gameData.role === "spy" ? (
                        <span className="text-red-700">SPY!</span>
                      ) : null}
                    </p>
                  </div>
                  {/*footer*/}
                  <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>
        ) : null}
      </div>
    </>
  );
}

export default InGame;
