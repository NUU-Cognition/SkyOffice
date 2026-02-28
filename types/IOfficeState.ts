import { Schema, ArraySchema, SetSchema, MapSchema } from '@colyseus/schema'

export interface IPlayer extends Schema {
  name: string
  x: number
  y: number
  anim: string
  readyToConnect: boolean
  videoConnected: boolean
}

export interface IComputer extends Schema {
  connectedUser: SetSchema<string>
}

export interface IWhiteboard extends Schema {
  roomId: string
  connectedUser: SetSchema<string>
}

export interface IChatMessage extends Schema {
  author: string
  createdAt: number
  content: string
}

export interface IPortalSession extends Schema {
  sessionId: string
  title: string
  url: string
  createdBy: string
  createdAt: number
  connectedUser: SetSchema<string>
}

export interface IPortal extends Schema {
  portalType: string
  sessions: ArraySchema<IPortalSession>
  connectedUser: SetSchema<string>
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>
  computers: MapSchema<IComputer>
  whiteboards: MapSchema<IWhiteboard>
  chatMessages: ArraySchema<IChatMessage>
  portals: MapSchema<IPortal>
}
