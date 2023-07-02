import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { WebsocketContext } from "../contexts/WebsocketContext";
import "../css/lobby.css";
import axios from "axios";
type MessagePayload = {
  status: number;
  message: string;
  data: {
    roomId: string;
  };
};
function Lobby() {
  const navigate = useNavigate();
  const socket = useContext(WebsocketContext);
  const [roomId, setRoomId] = useState<string>("");
  const [isGameStarted, setIsGameStarted] = useState<
    "search" | "waiting" | "start"
  >("search");
  const joinRoom = async () => {
    setIsGameStarted("search");
    if (roomId === "") {
      toast.error("Please enter room code");
      return;
    }
    await findGameStatus();
  };

  const findGameStatus = async () => {
    const clientId = socket.id;
    const payload = {
      roomId: roomId,
      clientId: clientId,
    };
    const resp = await axios.post(
      `http://localhost:3000/gameHost/gameStatus`,
      payload
    );
    if (resp.data.resData.gameStatus === 1) {
      toast.error("Game is already started!");
      setIsGameStarted("start");
    } else {
      setIsGameStarted("waiting");
      socket.emit("join", { roomId });
      socket.on("onJoin", (newMessage: MessagePayload) => {
        console.log("onMessage event received!");
        if (newMessage.status === 200) {
          navigate(`/g/${roomId}`);
          return;
        } else {
          toast.error(newMessage.message);
          return;
        }
      });
    }
  };

  const createRoom = () => {
    socket.emit("createRoom");
    socket.on("onCreateRoom", (newMessage: MessagePayload) => {
      console.log("onCreate event received!");
      if (newMessage.status === 200) {
        toast.success(newMessage.message);
        navigate(`/g/${newMessage.data.roomId}`);
        return;
      }
    });
  };
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected!");
    });

    return () => {
      console.log("Unregistering Events...");
      socket.off("connect");
      socket.off("onJoin");
      socket.off("onCreateRoom");
    };
  }, []);

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 flex gap-5 flex-col justify-center items-center">
      <span className="text-3xl font-bold text-white tracking-wider">
        Welcome to game lobby
      </span>
      <div className="flex flex-col gap-2 items-center">
        <input
          type="text"
          onChange={(e) => setRoomId(e.target.value)}
          className="px-4 py-3 rounded-full focus:outline-none"
          placeholder="CODE"
        />
        <button
          className="btn bg-white px-4 py-3 w-[8rem] rounded-full hover:bg-gray-200 shake"
          onClick={joinRoom}
        >
          เข้าร่วมเกม
        </button>
        <button
          className="btn bg-white px-4 py-3 w-[8rem] rounded-full hover:bg-gray-200 shake"
          onClick={createRoom}
        >
          สร้างห้อง
        </button>
      </div>
    </div>
  );
}

export default Lobby;
