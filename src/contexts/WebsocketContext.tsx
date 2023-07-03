import { createContext } from 'react';
import { io, Socket } from 'socket.io-client';

export const socket = io(`${process.env.REACT_APP_API_URL}/socket`);
export const WebsocketContext = createContext<Socket>(socket);
export const WebsocketProvider = WebsocketContext.Provider;