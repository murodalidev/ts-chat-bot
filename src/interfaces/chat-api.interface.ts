export interface IChatUser {
  userPhone: string
  userName: string
  lang: string
  requestId: string
  isTestRequest: boolean
}

export type ChatEventTypes = 'start' | 'StatusEvent' | 'MessageEvent' | 'PresenceEvent' | 'chat_end'
export type ChatEventStatuses =
  | 'chat_ok'
  | 'chat_request_rejected_by_agent'
  | 'chat_timedout_waiting_for_agent'
  | 'joined'
  | 'left'
  | 'chat_finished_error'

export interface IChatEventData {
  type: ChatEventTypes
  id: string
  status: ChatEventStatuses
  from: string
  body: string
  detail: string
}

export interface IChatResponse {
  requestId: string
  eventData: IChatEventData
}

export type IChatListener = (chatResponse: IChatResponse) => Promise<void>

export interface IChatNewMessage {
  requestId: string
  message: string
}
