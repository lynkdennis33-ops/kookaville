/**
 * Socket.IO singleton.
 *
 * Holds the single io instance created in server.js so that
 * services can emit events without circular imports or prop-drilling.
 *
 * Usage:
 *   import { setIo, getIo } from '../sockets/io.js';
 *   setIo(ioInstance);   // called once at startup in server.js
 *   getIo()?.to(room).emit('event', payload);
 */

let io = null;

export const setIo = (instance) => {
  io = instance;
};

export const getIo = () => io;
