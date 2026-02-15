import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('WebSocket bağlantısı kuruldu');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket bağlantısı kesildi');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket bağlantı hatası:', error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const subscribeToStockUpdates = (callback) => {
  if (socket) {
    socket.on('stock:updated', callback);
  }
};

export const subscribeToStockCritical = (callback) => {
  if (socket) {
    socket.on('stock:critical', callback);
  }
};

export const subscribeToOrderCreated = (callback) => {
  if (socket) {
    socket.on('order:created', callback);
  }
};

export const subscribeToOrderStatusUpdated = (callback) => {
  if (socket) {
    socket.on('order:statusUpdated', callback);
  }
};

export const subscribeToProductUpdates = (callback) => {
  if (socket) {
    socket.on('product:created', callback);
    socket.on('product:updated', callback);
    socket.on('product:deleted', callback);
  }
};

export const unsubscribeFromAll = () => {
  if (socket) {
    socket.off('stock:updated');
    socket.off('stock:critical');
    socket.off('order:created');
    socket.off('order:statusUpdated');
    socket.off('product:created');
    socket.off('product:updated');
    socket.off('product:deleted');
  }
};
