import type { DecryptMessageResult } from "openpgp";

export interface ChatMessageRecord {
  msgid: bigint;
  keyfp: string;
  message: Uint8Array;
  type: 'incoming' | 'outgoing';
}

export interface RawChatMessageRecord extends Omit<ChatMessageRecord, 'keyfp'> {}

export interface DecryptedChatMessageRecord extends Omit<ChatMessageRecord, 'message'> {
  message: DecryptMessageResult | { data: string };
}

export type WindowMessage = WindowMessageChatRecv;

export interface WindowMessageBase {
  type: string,
  data: any
}

export interface WindowMessageChatRecv extends WindowMessageBase {
  type: "chat-recv",
  data: RawChatMessageRecord
}
