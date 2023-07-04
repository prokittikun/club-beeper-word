import React from "react";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 flex gap-4 flex-col justify-center items-center">
      <span className="text-center text-4xl font-bold text-white tracking-wider">
        404 Not Found
      </span>
      <button
        className="text-center btn bg-white px-4 py-3 w-[10rem] rounded-full hover:bg-gray-200 shake"
        onClick={() => {navigate("/lobby" )}}
      >
        GO TO LOBBY
      </button>
    </div>
  );
}

export default NotFound;
