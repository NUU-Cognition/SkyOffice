import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'
import { PortalSession } from '../schema/OfficeState'

type PortalPayload = {
  client: Client
  portalId: string
}

type CreateSessionPayload = {
  client: Client
  portalId: string
  title: string
  url: string
}

type SessionPayload = {
  client: Client
  portalId: string
  sessionId: string
}

export class PortalAddUserCommand extends Command<IOfficeState, PortalPayload> {
  execute(data: PortalPayload) {
    const { client, portalId } = data
    const portal = this.room.state.portals.get(portalId)
    const clientId = client.sessionId

    if (!portal || portal.connectedUser.has(clientId)) return
    portal.connectedUser.add(clientId)
  }
}

export class PortalRemoveUserCommand extends Command<IOfficeState, PortalPayload> {
  execute(data: PortalPayload) {
    const { client, portalId } = data
    const portal = this.state.portals.get(portalId)
    if (!portal) return

    portal.connectedUser.delete(client.sessionId)
    portal.sessions.forEach((session) => {
      session.connectedUser.delete(client.sessionId)
    })
  }
}

const idChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function generateId(): string {
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += idChars.charAt(Math.floor(Math.random() * idChars.length))
  }
  return result
}

export class CreatePortalSessionCommand extends Command<IOfficeState, CreateSessionPayload> {
  execute(data: CreateSessionPayload) {
    const { client, portalId, title, url } = data
    const portal = this.room.state.portals.get(portalId)
    if (!portal) return

    const session = new PortalSession()
    session.sessionId = generateId()
    session.title = title
    session.url = url
    session.createdBy = this.state.players.get(client.sessionId)?.name || 'Unknown'
    session.createdAt = Date.now()
    session.connectedUser.add(client.sessionId)
    portal.sessions.push(session)
  }
}

export class JoinPortalSessionCommand extends Command<IOfficeState, SessionPayload> {
  execute(data: SessionPayload) {
    const { client, portalId, sessionId } = data
    const portal = this.room.state.portals.get(portalId)
    if (!portal) return

    const session = portal.sessions.find((s) => s.sessionId === sessionId)
    if (!session || session.connectedUser.has(client.sessionId)) return
    session.connectedUser.add(client.sessionId)
  }
}

export class LeavePortalSessionCommand extends Command<IOfficeState, SessionPayload> {
  execute(data: SessionPayload) {
    const { client, portalId, sessionId } = data
    const portal = this.state.portals.get(portalId)
    if (!portal) return

    const session = portal.sessions.find((s) => s.sessionId === sessionId)
    if (session) {
      session.connectedUser.delete(client.sessionId)
    }
  }
}
