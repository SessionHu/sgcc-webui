export type WindowMessage = WindowMessageChatRecv;

export interface WindowMessageBase {
  type: string,
  data: any
}

export interface WindowMessageChatRecv extends WindowMessageBase {
  type: "chat-recv",
  data: {
    text: string,
    fp: string,
    type: 'incoming' | 'outgoing'
  }
}
