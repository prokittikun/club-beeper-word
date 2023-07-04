import axios from "axios";
import React, { useContext, useEffect } from "react";
import { toast } from "react-hot-toast";
import { AiOutlinePaperClip } from "react-icons/ai";
import { useNavigate, useParams } from "react-router-dom";
import { WebsocketContext } from "../contexts/WebsocketContext";
import { BiBody } from "react-icons/bi";
import { GiSpy } from "react-icons/gi";
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
    socket.on("onHostLeave", (newMessage: BasicRespPayload) => {
      if (newMessage.status === 200) {
        console.log("Host leave");
        toast.error(newMessage.message);
        navigate("/lobby");
      }
    });
    socket.on("onBackToWaitingRoom", (newMessage: BasicRespPayload) => {
      if (newMessage.status === 200) {
        toast.success(newMessage.message);
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
        socket.off("onHostLeave");
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

  const sendWord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    setShowModal(false);
  };

  return (
    <>
      {gameId ? (
        <div className="absolute top-0 bottom-0 left-0 right-0 flex gap-2 flex-col justify-center items-center z-0">
          <>
            {isHost && gameStatus === "waiting" ? (
              <>
                <span className="text-center text-3xl font-bold text-white tracking-wider">
                  Hi host if players is ready, click start!
                </span>
                <button
                  className="btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
                  onClick={startGame}
                >
                  Start!
                </button>
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
                  onClick={leaveRoom}
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
                    <form onSubmit={(e) => sendWord(e)} className="flex flex-col justify-center items-center gap-2">
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
                        type="submit"
                      >
                        Send!
                      </button>
                    </form>
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
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(gameId);
                    toast.success("Copied to clipboard!");
                  }}
                  className="flex justify-center btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
                >
                  <AiOutlinePaperClip size={"20px"} />
                </button>
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
                    onClick={leaveRoom}
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
          </>
        </div>
      ) : null}
      {showModal ? (
        <>
          <div
            className="min-w-screen h-screen animated fadeIn faster  fixed  left-0 top-0 flex justify-center items-center inset-0 z-50 outline-none focus:outline-none bg-no-repeat bg-center bg-cover"
            id="modal-id"
          >
            <div className="absolute bg-black/25 opacity-80 inset-0 z-0" />
            <div className="w-full  max-w-lg p-5 relative mx-auto my-auto rounded-xl shadow-lg  bg-white ">
              {/*content*/}
              <div>
                {/*body*/}
                <div className="text-center p-5 flex-auto justify-center">
                  <p className=" text-black px-8 py-2 text-xl">
                    {gameData.role === "player" ? (
                      <span className="flex justify-center">
                        <BiBody size={"3rem"} />
                      </span>
                    ) : gameData.role === "spy" ? (
                      <span className="flex justify-center">
                        <GiSpy size={"3rem"} color="red" />
                      </span>
                    ) : (
                      <span className="flex justify-center">
                        <GiSpy
                          size={"3rem"}
                          style={{ color: "rgb(174, 15, 39)" }}
                        />
                      </span>
                    )}
                  </p>
                  {/* <h2 className="text-xl font-bold py-4 ">Are you sure?</h2> */}
                  <p className=" text-black px-8 py-2 text-xl">
                    {gameData.role === "player" ? (
                      <span className="text-black ">{gameData.message}</span>
                    ) : gameData.role === "spy" ? null : (
                      "loading..."
                    )}
                  </p>
                </div>
                {/*footer*/}
                <div className="p-3  mt-1 text-center space-x-4 md:block">
                  <button
                    onClick={() => setShowModal(false)}
                    className="mb-2 md:mb-0 bg-white px-5 py-2 text-sm shadow-sm font-medium tracking-wider border text-gray-600 rounded-full hover:shadow-lg hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="absolute top-0 left-0 bottom-0 right-0  z-50 flex justify-center items-center">
            <div className="flex flex-col justify-center items-center h-full w-full p-3">
              <div className="bg-white max-w-md w-full py-16 rounded-md">
              x
                <div className="flex items-center justify-center leading-relaxed text-lg">
                 
                  {gameData.role === "player" ? (
                    <span className="text-black ">{gameData.message}</span>
                  ) : gameData.role === "spy" ? (
                    <span className="text-red-700 ">SPY!</span>
                  ) : (
                    "loading..."
                  )}
 
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div> */}
        </>
      ) : null}
    </>
  );
}

export default InGame;
