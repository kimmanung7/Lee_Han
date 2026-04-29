"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import DMModal from "./DMModal";

interface UserSnippet {
  id: string;
  nickname: string | null;
  username: string;
  avatarUrl: string;
}

interface IncomingRequest {
  id: string;
  sender: UserSnippet;
}

interface FriendData {
  friends: UserSnippet[];
  incoming: IncomingRequest[];
}

export default function FriendPanel({ myId, myNickname }: { myId: string; myNickname: string | null }) {
  const [data, setData] = useState<FriendData>({ friends: [], incoming: [] });
  const [search, setSearch] = useState("");
  const [addError, setAddError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dmTarget, setDmTarget] = useState<UserSnippet | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchFriends = async () => {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const json = await res.json();
      setData({ friends: json.friends, incoming: json.incoming });
    }
  };

  useEffect(() => {
    fetchFriends();

    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
    const s = io(url, { autoConnect: true });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("user:register", { userId: myId });
    });

    s.on("friend:request", ({ from }: { from: UserSnippet }) => {
      setNotification(`${from.nickname ?? from.username}님이 친구 요청을 보냈어요!`);
      fetchFriends();
      setTimeout(() => setNotification(null), 4000);
    });

    s.on("friend:accepted", ({ by }: { by: { nickname: string | null; username: string } }) => {
      setNotification(`${by.nickname ?? by.username}님이 친구 요청을 수락했어요!`);
      fetchFriends();
      setTimeout(() => setNotification(null), 4000);
    });

    return () => { s.disconnect(); };
  }, [myId]);

  const sendRequest = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUsername: search.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.error ?? "오류 발생"); return; }
      setSearch("");
      socketRef.current?.emit("friend:notify", { toUserId: json.target.id, from: { id: myId, nickname: myNickname, username: "", avatarUrl: "" } });
    } finally {
      setLoading(false);
    }
  };

  const respond = async (friendshipId: string, action: "accept" | "reject", senderId: string) => {
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    if (res.ok) {
      fetchFriends();
      if (action === "accept") {
        socketRef.current?.emit("friend:accepted:notify", { toUserId: senderId, by: { id: myId, nickname: myNickname, username: "" } });
      }
    }
  };

  return (
    <>
      <div className="flex flex-col h-full gap-3">
        {/* 알림 */}
        {notification && (
          <div className="text-xs bg-indigo-800 border border-indigo-600 rounded px-2 py-1.5 text-indigo-100">
            {notification}
          </div>
        )}

        {/* 친구 추가 */}
        <div className="flex gap-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendRequest(); }}
            placeholder="GitHub 유저네임"
            className="flex-1 text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500"
          />
          <button
            onClick={sendRequest}
            disabled={loading}
            className="text-xs bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white px-2 py-1 rounded"
          >
            추가
          </button>
        </div>
        {addError && <p className="text-xs text-red-400">{addError}</p>}

        {/* 친구 요청 */}
        {data.incoming.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              요청 ({data.incoming.length})
            </p>
            <div className="flex flex-col gap-1">
              {data.incoming.map((req) => (
                <div key={req.id} className="flex items-center gap-1 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={req.sender.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  <span className="flex-1 text-gray-300 truncate">
                    {req.sender.nickname ?? req.sender.username}
                  </span>
                  <button
                    onClick={() => respond(req.id, "accept", req.sender.id)}
                    className="text-green-400 hover:text-green-300 px-1"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => respond(req.id, "reject", req.sender.id)}
                    className="text-red-400 hover:text-red-300 px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 친구 목록 */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            친구 ({data.friends.length})
          </p>
          {data.friends.length === 0 ? (
            <p className="text-xs text-gray-700">아직 친구가 없어요</p>
          ) : (
            <div className="flex flex-col gap-1">
              {data.friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDmTarget(f)}
                  className="flex items-center gap-2 text-xs text-left hover:bg-gray-800 rounded px-1 py-0.5 w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                  <span className="text-gray-300 truncate">{f.nickname ?? f.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DM Modal */}
      {dmTarget && (
        <DMModal
          myId={myId}
          target={dmTarget}
          socket={socketRef.current}
          onClose={() => setDmTarget(null)}
        />
      )}
    </>
  );
}
