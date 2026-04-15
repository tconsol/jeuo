import { useState, useEffect, useRef } from 'react';
import Avatar from '../common/Avatar';
import { formatRelativeTime } from '../../utils';

export default function ChatWidget({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    socket.emit('chat:join', roomId);

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.emit('chat:leave', roomId);
    };
  }, [socket, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', { roomId, text: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-80 bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
          const isMine = msg.userId === currentUser?._id;
          return (
            <div key={i} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
              <Avatar src={msg.avatar} name={msg.name} size="sm" />
              <div className={`max-w-[70%] ${isMine ? 'text-right' : ''}`}>
                <p className="text-xs text-gray-400">{msg.name}</p>
                <p className={`text-sm p-2.5 rounded-xl ${isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {msg.text}
                </p>
                <p className="text-[10px] text-gray-300 mt-0.5">{formatRelativeTime(msg.timestamp)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-gray-100">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Send</button>
      </form>
    </div>
  );
}
