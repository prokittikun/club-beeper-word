import axios from "axios";
import React, { useContext, useEffect } from "react";
import { toast } from "react-hot-toast";
import { AiOutlinePaperClip } from "react-icons/ai";
import { useNavigate, useParams } from "react-router-dom";
import { WebsocketContext } from "../contexts/WebsocketContext";
type MessagePayload = {
  status: number;
  message: string;
  data: {
    roomId: string;
  };
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
  useEffect(() => {
    findGameStatus();
    socket.on("onGameStart", (newMessage: MessagePayload) => {
      if (newMessage.status === 200) {
        setGameStatus("playing");
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
      socket.on("onCheckRoom", (newMessage: MessagePayload) => {
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
      `http://localhost:3000/gameHost/checkMyRoom`,
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
      `http://localhost:3000/gameHost/gameStatus`,payload
    );
    if (resp.data.resData.gameStatus === 1) {
      toast.error("Game is already started!");
      setGameStatus("playing");
      navigate('/lobby')
    }else{
      setGameStatus("waiting");
    }
  }
  const startGame = () => {
    socket.emit("startGame", { roomId: gameId });
  };
  return (
    <>
      <div className="absolute top-0 bottom-0 left-0 right-0 flex gap-5 flex-col justify-center items-center z-0">
        {isHost && gameId ? (
          <>
            <span className="text-3xl font-bold text-white tracking-wider">
              Hi host if players is ready, click start!
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(gameId);
                toast.success("Copied to clipboard!");
              }}
              className="btn bg-white p-4 w-[10rem] flex justify-center rounded-full hover:bg-gray-200 transition transform hover:-translate-y-1"
            >
              <AiOutlinePaperClip size={"20px"} />
            </button>
            <button
              className="btn bg-white p-4 w-[10rem] rounded-full hover:bg-gray-200 transition transform hover:-translate-y-1"
              onClick={startGame}
            >
              Start!
            </button>
          </>
        ) : gameStatus === "waiting" || gameStatus === "finished" ? (
          <>
            <span className="text-3xl font-bold text-white tracking-wider">
              Wait for the host to start the game.
            </span>
            {gameId ? (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gameId);
                  toast.success("Copied to clipboard!");
                }}
                className="btn bg-white p-4 w-[10rem] flex justify-center rounded-full hover:bg-gray-200 transition transform hover:-translate-y-1"
              >
                <AiOutlinePaperClip size={"20px"} />
              </button>
            ) : null}
            <button
              className="btn bg-white p-4 w-[10rem] rounded-full hover:bg-gray-200 transition transform hover:-translate-y-1"
              onClick={leaveRoom}
            >
              Left the game
            </button>
          </>
        ) : gameStatus === "playing" ? (
          <button
            onClick={() => setShowModal(true)}
            className="btn bg-white p-4 w-[10rem] rounded-full hover:bg-gray-200 transition transform hover:-translate-y-1"
          >
            ดูคำของคุณ
          </button>
        ) : null}
      </div>
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                  <h3 className="text-3xl font-semibold">คำศัพท์ที่ได้คือ</h3>
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
                    หมา Lorem ipsum, dolor sit amet consectetur adipisicing
                    elit. Vitae tempora ullam, enim minus beatae voluptas
                    perspiciatis autem impedit? Eos voluptatum tenetur explicabo
                    dolor placeat beatae a enim expedita doloribus dolorum
                    molestiae harum sint porro quidem iure, dignissimos est
                    laborum ipsa, ratione consequatur aliquam cum esse!
                    Recusandae ipsa quisquam possimus! Ipsum.
                  </p>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
}

export default InGame;
