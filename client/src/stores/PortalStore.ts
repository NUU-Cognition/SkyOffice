import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

export interface PortalSessionInfo {
  sessionId: string
  title: string
  url: string
  createdBy: string
  createdAt: number
  userCount: number
}

interface PortalState {
  portalDialogOpen: boolean
  portalId: null | string
  portalType: null | string
  activeSessionId: null | string
  activeSessionUrl: null | string
  sessions: PortalSessionInfo[]
  portalTypes: Record<string, string>
}

const initialState: PortalState = {
  portalDialogOpen: false,
  portalId: null,
  portalType: null,
  activeSessionId: null,
  activeSessionUrl: null,
  sessions: [],
  portalTypes: {},
}

export const portalSlice = createSlice({
  name: 'portal',
  initialState,
  reducers: {
    openPortalDialog: (state, action: PayloadAction<string>) => {
      state.portalDialogOpen = true
      state.portalId = action.payload
      state.portalType = state.portalTypes[action.payload] || null
      state.activeSessionId = null
      state.activeSessionUrl = null
      const game = phaserGame.scene.keys.game as Game
      game.disableKeys()
    },
    closePortalDialog: (state) => {
      const game = phaserGame.scene.keys.game as Game
      game.enableKeys()
      if (state.activeSessionId && state.portalId) {
        game.network.leavePortalSession(state.portalId, state.activeSessionId)
      }
      if (state.portalId) {
        game.network.disconnectFromPortal(state.portalId)
      }
      state.portalDialogOpen = false
      state.portalId = null
      state.portalType = null
      state.activeSessionId = null
      state.activeSessionUrl = null
      state.sessions = []
    },
    setPortalType: (state, action: PayloadAction<{ portalId: string; portalType: string }>) => {
      state.portalTypes[action.payload.portalId] = action.payload.portalType
      if (state.portalId === action.payload.portalId) {
        state.portalType = action.payload.portalType
      }
    },
    setSessions: (state, action: PayloadAction<PortalSessionInfo[]>) => {
      state.sessions = action.payload
    },
    joinSession: (state, action: PayloadAction<{ sessionId: string; url: string }>) => {
      state.activeSessionId = action.payload.sessionId
      state.activeSessionUrl = action.payload.url
    },
    leaveSession: (state) => {
      if (state.activeSessionId && state.portalId) {
        const game = phaserGame.scene.keys.game as Game
        game.network.leavePortalSession(state.portalId, state.activeSessionId)
      }
      state.activeSessionId = null
      state.activeSessionUrl = null
    },
  },
})

export const {
  openPortalDialog,
  closePortalDialog,
  setPortalType,
  setSessions,
  joinSession,
  leaveSession,
} = portalSlice.actions

export default portalSlice.reducer
