// hooks/use-realtime-chat.ts
"use client";

import { createClient } from "@/lib/client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

/**
 * Mini STOMP client (no external deps)
 * Supports: CONNECT, SUBSCRIBE, SEND, MESSAGE, ERROR, basic reconnect on close.
 */
class MiniStomp {
  private url: string;
  private ws: WebSocket | null = null;
  private connectResolve?: () => void;
  private connectReject?: (e: any) => void;
  private buffer = "";
  private connected = false;
  private subscriptionSeq = 1;
  private subscriptions = new Map<
    string,
    { destination: string; cb: (headers: Record<string, string>, body: string) => void }
  >();
  private subsByDestination = new Map<string, Set<string>>();
  public onClose?: (ev: CloseEvent) => void;
  public onError?: (ev: Event) => void;

  constructor(url: string) {
    this.url = url;
  }

  isConnected() {
    return this.connected;
  }

  async connect(headers: Record<string, string> = {}): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.connected) return;
      return new Promise((resolve, reject) => {
        this.connectResolve = resolve;
        this.connectReject = reject;
      });
    }

    return new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;

      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        const frame = this.buildFrame("CONNECT", {
          "accept-version": "1.2",
          "heart-beat": "0,0",
          ...headers,
        });
        this.ws?.send(frame);
      };

      this.ws.onmessage = async (ev: MessageEvent) => {
        const data = await this.readAsText(ev.data);
        this.buffer += data;

        while (true) {
          const idx = this.buffer.indexOf("\0");
          if (idx === -1) break;

          const rawFrame = this.buffer.slice(0, idx);
          this.buffer = this.buffer.slice(idx + 1);

          const trimmed = rawFrame.replace(/^\s+|\s+$/g, "");
          if (!trimmed) continue; // heartbeat or empty

          const parsed = this.parseFrame(rawFrame);
          if (!parsed) continue;

          const { command, headers: h, body } = parsed;

          if (command === "CONNECTED") {
            this.connected = true;
            this.connectResolve?.();
            this.connectResolve = undefined;
            this.connectReject = undefined;
          } else if (command === "MESSAGE") {
            const subId = h["subscription"];
            const dest = h["destination"];
            if (subId && this.subscriptions.has(subId)) {
              this.subscriptions.get(subId)!.cb(h, body);
            } else if (dest) {
              for (const id of this.subsByDestination.get(dest) ?? new Set<string>()) {
                this.subscriptions.get(id)?.cb(h, body);
              }
            }
          } else if (command === "ERROR") {
            const err = new Error(`STOMP ERROR: ${h["message"] || ""} ${body || ""}`);
            if (!this.connected) {
              this.connectReject?.(err);
              this.connectReject = undefined;
              this.connectResolve = undefined;
            }
            this.onError?.(new Event("error"));
          }
        }
      };

      this.ws.onclose = (ev) => {
        this.connected = false;
        this.connectReject?.(new Error("WebSocket closed before CONNECTED"));
        this.connectReject = undefined;
        this.connectResolve = undefined;
        this.onClose?.(ev);
      };

      this.ws.onerror = (ev) => {
        if (!this.connected) {
          this.connectReject?.(new Error("WebSocket error during connect"));
          this.connectReject = undefined;
          this.connectResolve = undefined;
        }
        this.onError?.(ev);
      };
    });
  }

  disconnect() {
    try {
      this.ws?.close();
    } catch {}
    this.ws = null;
    this.connected = false;
    this.buffer = "";
    this.subscriptions.clear();
    this.subsByDestination.clear();
  }

  subscribe(
    destination: string,
    cb: (headers: Record<string, string>, body: string) => void,
    headers: Record<string, string> = {}
  ): string {
    if (!this.ws || !this.connected) {
      throw new Error("STOMP not connected");
    }
    const id = `sub-${this.subscriptionSeq++}`;
    this.subscriptions.set(id, { destination, cb });
    if (!this.subsByDestination.has(destination)) {
      this.subsByDestination.set(destination, new Set());
    }
    this.subsByDestination.get(destination)!.add(id);

    const frame = this.buildFrame("SUBSCRIBE", {
      id,
      destination,
      ack: headers.ack || "auto",
      ...headers,
    });
    this.ws.send(frame);
    return id;
  }

  unsubscribe(id: string) {
    if (!this.ws || !this.connected) return;
    const info = this.subscriptions.get(id);
    if (info) {
      const set = this.subsByDestination.get(info.destination);
      if (set) set.delete(id);
      if (set && set.size === 0) this.subsByDestination.delete(info.destination);
      this.subscriptions.delete(id);
    }
    const frame = this.buildFrame("UNSUBSCRIBE", { id });
    try {
      this.ws.send(frame);
    } catch {}
  }

  send(destination: string, body: string, headers: Record<string, string> = {}) {
    if (!this.ws || !this.connected) {
      throw new Error("STOMP not connected");
    }
    const h = { destination, "content-type": headers["content-type"] || "application/json", ...headers };
    const frame = this.buildFrame("SEND", h, body);
    this.ws.send(frame);
  }

  private buildFrame(command: string, headers: Record<string, string> = {}, body = "") {
    let lines = [command];
    for (const [k, v] of Object.entries(headers)) {
      lines.push(`${k}:${this.escapeHeader(String(v))}`);
    }
    lines.push("");
    return lines.join("\n") + body + "\0";
  }

  private parseFrame(raw: string):
    | { command: string; headers: Record<string, string>; body: string }
    | null {
    const headerEndIdx = raw.indexOf("\n\n");
    const firstPart = headerEndIdx >= 0 ? raw.slice(0, headerEndIdx) : raw;
    const body = headerEndIdx >= 0 ? raw.slice(headerEndIdx + 2) : "";

    const lines = firstPart.split("\n").filter(Boolean);
    if (lines.length === 0) return null;

    const command = lines[0].trim();
    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const sep = line.indexOf(":");
      if (sep >= 0) {
        const key = line.slice(0, sep).trim();
        const val = this.unescapeHeader(line.slice(sep + 1).trim());
        headers[key] = val;
      }
    }
    return { command, headers, body };
  }

  private escapeHeader(v: string) {
    return v.replace(/\n/g, "\\n").replace(/:/g, "\\c");
  }
  private unescapeHeader(v: string) {
    return v.replace(/\\n/g, "\n").replace(/\\c/g, ":");
  }

  private async readAsText(data: any): Promise<string> {
    if (typeof data === "string") return data;
    if (data instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(data));
    if (data && typeof Blob !== "undefined" && data instanceof Blob) return await data.text();
    return String(data ?? "");
  }
}

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  clinicId?: number;
}

export interface ChatMessage {
  text: ReactNode;
  id: string;
  content: string;
  user: { name: string };
  createdAt: string;
  fromMe?: boolean;
}

const SUPABASE_EVENT_MESSAGE_TYPE = "message";
const STOMP_URL = process.env.NEXT_PUBLIC_STOMP_URL || "wss://be.blinkdentalmarketing.com.br/wpp-socket";
const STOMP_SUBSCRIBE_DEST = "/wpp-socket/subscribe";
const STOMP_NOTIFY_DEST = "/wpp-socket/notify/message-received";

export function useRealtimeChat({ roomName, username, clinicId = 1 }: UseRealtimeChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");

  const stompRef = useRef<MiniStomp | null>(null);
  const notifySubIdRef = useRef<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 20;

  useEffect(() => {
    if (!roomName) return;
    const newChannel = supabase.channel(roomName);

    newChannel.on("broadcast", { event: SUPABASE_EVENT_MESSAGE_TYPE }, (payload) => {
      const msg = payload.payload as ChatMessage;
      setMessages((current) => (current.some((m) => m.id === msg.id) ? current : [...current, msg]));
    }).subscribe();

    supabaseChannelRef.current = newChannel;

    return () => {
      supabase.removeChannel(newChannel);
      supabaseChannelRef.current = null;
    };
  }, [roomName, supabase]);

  const cleanupReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const scheduleReconnect = useCallback(() => {
    cleanupReconnectTimer();
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionStatus("error");
      return;
    }
    reconnectAttemptsRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
    reconnectTimerRef.current = setTimeout(() => void connectStomp(), delay);
  }, []);

  const connectStomp = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      cleanupReconnectTimer();
      if (!stompRef.current) {
        stompRef.current = new MiniStomp(STOMP_URL);
        stompRef.current.onClose = () => {
          setConnectionStatus("disconnected");
          scheduleReconnect();
        };
        stompRef.current.onError = () => setConnectionStatus("error");
      }
      const stomp = stompRef.current;
      await stomp.connect();
      reconnectAttemptsRef.current = 0;
      setConnectionStatus("connected");

      if (notifySubIdRef.current) {
        try { stomp.unsubscribe(notifySubIdRef.current); } catch {}
        notifySubIdRef.current = null;
      }

      notifySubIdRef.current = stomp.subscribe(STOMP_NOTIFY_DEST, (_headers, body) => {
        try {
          const data = JSON.parse(body) as { sender?: string; message?: string; clinic_id?: number };
          if (data?.message && data.sender && (!data.clinic_id || data.clinic_id === clinicId) && (!roomName || data.sender === roomName)) {
            const incoming: ChatMessage = {
              id: `stomp-${Date.now()}-${Math.random()}`,
              text: data.message,
              content: data.message,
              user: { name: data.sender },
              createdAt: new Date().toISOString(),
              fromMe: false,
            };
            setMessages((current) => (current.some((m) => m.id === incoming.id) ? current : [...current, incoming]));
            if (supabaseChannelRef.current) supabaseChannelRef.current.send({ type: "broadcast", event: SUPABASE_EVENT_MESSAGE_TYPE, payload: incoming });
          }
        } catch (err) { console.error("Erro ao processar mensagem STOMP:", err); }
      }, { ack: "auto" });

      try {
        stomp.send(STOMP_SUBSCRIBE_DEST, JSON.stringify({ clinic_id: clinicId }), { "content-type": "application/json" });
      } catch (err) { console.error("Erro ao enviar subscribe da clínica:", err); }
    } catch (err) {
      console.error("Falha ao conectar STOMP:", err);
      setConnectionStatus("error");
      scheduleReconnect();
    }
  }, [clinicId, roomName, scheduleReconnect]);

  useEffect(() => {
    void connectStomp();
    return () => {
      cleanupReconnectTimer();
      try { if (notifySubIdRef.current && stompRef.current?.isConnected()) stompRef.current.unsubscribe(notifySubIdRef.current); } catch {}
      notifySubIdRef.current = null;
      if (stompRef.current) { stompRef.current.disconnect(); stompRef.current = null; }
    };
  }, [connectStomp]);

  const sendMessage = useCallback(async (content: string) => {
    const stomp = stompRef.current;
    if (!stomp || !stomp.isConnected()) {
      console.error("STOMP não está conectado.");
      return false;
    }

    try {
      const localMessage: ChatMessage = {
        id: `local-${Date.now()}-${Math.random()}`,
        text: content,
        content,
        user: { name: username },
        createdAt: new Date().toISOString(),
        fromMe: true,
      };

      setMessages((current) => [...current, localMessage]);
      if (supabaseChannelRef.current && roomName) {
        await supabaseChannelRef.current.send({ type: "broadcast", event: SUPABASE_EVENT_MESSAGE_TYPE, payload: localMessage });
      }

      stomp.send(STOMP_SUBSCRIBE_DEST, JSON.stringify({ sender: roomName, message: content, clinic_id: clinicId }), { "content-type": "application/json" });
      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem via STOMP:", error);
      return false;
    }
  }, [username, clinicId, roomName]);

  return { messages, sendMessage, isConnected: connectionStatus === "connected", connectionStatus };
}
