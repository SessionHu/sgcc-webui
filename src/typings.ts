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

export type WindowMessage = WindowMessageChatRecv | WindowMessageIdbMsgUpdate;

export interface WindowMessageBase {
  type: string,
  data: unknown
}

export interface WindowMessageChatRecv extends WindowMessageBase {
  type: "chat-recv",
  data: RawChatMessageRecord
}

export interface WindowMessageIdbMsgUpdate extends WindowMessageBase {
  type: 'idb-msg-update',
  data: void
}
