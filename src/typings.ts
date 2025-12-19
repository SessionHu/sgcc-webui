export interface ChatMessageRecord {
  msgid: bigint;
  keyfp: string;
  message: Uint8Array;
  type: 'incoming' | 'outgoing';
}

export type WindowMessage = WindowMessageChatRecv;

export interface WindowMessageBase {
  type: string,
  data: any
}

export interface WindowMessageChatRecv extends WindowMessageBase {
  type: "chat-recv",
  data: ChatMessageRecord
}
