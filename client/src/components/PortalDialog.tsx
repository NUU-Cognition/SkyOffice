import React, { useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closePortalDialog, joinSession, leaveSession } from '../stores/PortalStore'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 16px 180px 16px 16px;
  width: 100%;
  height: 100%;
`

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #222639;
  border-radius: 16px;
  padding: 16px;
  color: #eee;
  position: relative;
  display: flex;
  flex-direction: column;

  .close {
    position: absolute;
    top: 0px;
    right: 0px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-right: 40px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .portal-type {
    background: #3c3f58;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`

const SessionList = styled.div`
  flex: 1;
  overflow-y: auto;
`

const SessionRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #2d3052;
  border-radius: 8px;
  margin-bottom: 8px;

  .info {
    flex: 1;

    .title {
      font-size: 14px;
      font-weight: 500;
    }

    .meta {
      font-size: 12px;
      color: #9a9cb8;
      margin-top: 2px;
    }
  }

  .users {
    font-size: 12px;
    color: #9a9cb8;
    margin-right: 12px;
  }
`

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b6d8a;
  font-size: 14px;
`

const CreateForm = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: flex-end;

  .MuiTextField-root {
    flex: 1;

    .MuiInputBase-root {
      color: #eee;
      background: #2d3052;
      border-radius: 8px;
    }

    .MuiInputLabel-root {
      color: #9a9cb8;
    }

    .MuiOutlinedInput-notchedOutline {
      border-color: #3c3f58;
    }
  }
`

const IframeWrapper = styled.div`
  flex: 1;
  border-radius: 12px;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    background: #fff;
    border: none;
  }
`

const ExternalView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #9a9cb8;

  .link-icon {
    font-size: 48px;
  }

  p {
    font-size: 14px;
  }
`

const PORTAL_LABELS: Record<string, string> = {
  excalidraw: 'Excalidraw',
  youtube: 'YouTube',
  'google-docs': 'Google Docs',
  zoom: 'Zoom',
}

const EMBEDDED_TYPES = new Set(['excalidraw', 'youtube'])

function toEmbedUrl(url: string, portalType: string): string {
  if (portalType === 'youtube') {
    const match = url.match(/(?:watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  return url
}

export default function PortalDialog() {
  const dispatch = useAppDispatch()
  const { portalId, portalType, activeSessionId, activeSessionUrl, sessions } = useAppSelector(
    (state) => state.portal
  )

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const isEmbedded = portalType ? EMBEDDED_TYPES.has(portalType) : false
  const label = portalType ? PORTAL_LABELS[portalType] || portalType : 'Portal'

  const handleJoin = (sessionId: string, url: string) => {
    const game = phaserGame.scene.keys.game as Game
    const embedUrl = portalType ? toEmbedUrl(url, portalType) : url

    game.network.joinPortalSession(portalId!, sessionId)
    dispatch(joinSession({ sessionId, url: embedUrl }))

    if (!isEmbedded) {
      window.open(url, '_blank')
    }
  }

  const handleCreate = () => {
    if (!newTitle.trim() || !newUrl.trim() || !portalId) return
    const game = phaserGame.scene.keys.game as Game
    game.network.createPortalSession(portalId, newTitle.trim(), newUrl.trim())

    const embedUrl = portalType ? toEmbedUrl(newUrl.trim(), portalType) : newUrl.trim()

    // Auto-join the session we just created (server adds us, we get the session via sync)
    // We'll join once the session appears in the list via a short timeout
    setTimeout(() => {
      const portalState = (phaserGame.scene.keys.game as Game).network
      const updatedSessions = (
        document.querySelector('[data-portal-sessions]') as HTMLElement
      )?.dataset
      // The session list will update via Redux, find the newest session
      const latest = sessions[sessions.length - 1]
      if (latest) {
        handleJoin(latest.sessionId, latest.url)
      }
    }, 100)

    if (!isEmbedded) {
      window.open(newUrl.trim(), '_blank')
    }

    setNewTitle('')
    setNewUrl('')
    setShowCreateForm(false)
  }

  const handleBack = () => {
    dispatch(leaveSession())
  }

  // Session view (embedded or external)
  if (activeSessionId) {
    const sessionInfo = sessions.find((s) => s.sessionId === activeSessionId)
    return (
      <Backdrop>
        <Wrapper>
          <IconButton
            aria-label="close dialog"
            className="close"
            onClick={() => dispatch(closePortalDialog())}
          >
            <CloseIcon />
          </IconButton>
          <Header>
            <IconButton size="small" onClick={handleBack} sx={{ color: '#eee' }}>
              <ArrowBackIcon />
            </IconButton>
            <h2>{sessionInfo?.title || 'Session'}</h2>
            <span className="portal-type">{label}</span>
          </Header>
          {isEmbedded && activeSessionUrl ? (
            <IframeWrapper>
              <iframe
                title={`${label} session`}
                src={activeSessionUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </IframeWrapper>
          ) : (
            <ExternalView>
              <div className="link-icon">&#128279;</div>
              <p>Session is open in a new tab</p>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => activeSessionUrl && window.open(activeSessionUrl, '_blank')}
              >
                Open Link Again
              </Button>
              {sessionInfo && (
                <p>{sessionInfo.userCount} user{sessionInfo.userCount !== 1 ? 's' : ''} in this session</p>
              )}
            </ExternalView>
          )}
        </Wrapper>
      </Backdrop>
    )
  }

  // Lobby view
  return (
    <Backdrop>
      <Wrapper>
        <IconButton
          aria-label="close dialog"
          className="close"
          onClick={() => dispatch(closePortalDialog())}
        >
          <CloseIcon />
        </IconButton>
        <Header>
          <h2>{label} Portal</h2>
          <span className="portal-type">{label}</span>
        </Header>

        <SessionList>
          {sessions.length === 0 && !showCreateForm ? (
            <EmptyState>No active sessions. Create one to get started.</EmptyState>
          ) : (
            sessions.map((session) => (
              <SessionRow key={session.sessionId}>
                <div className="info">
                  <div className="title">{session.title}</div>
                  <div className="meta">
                    Created by {session.createdBy}
                  </div>
                </div>
                <div className="users">
                  {session.userCount} user{session.userCount !== 1 ? 's' : ''}
                </div>
                <Button
                  variant="contained"
                  size="small"
                  color="secondary"
                  onClick={() => handleJoin(session.sessionId, session.url)}
                >
                  Join
                </Button>
              </SessionRow>
            ))
          )}
        </SessionList>

        {showCreateForm ? (
          <CreateForm>
            <TextField
              label="Title"
              size="small"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <TextField
              label="Paste URL"
              size="small"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button variant="contained" color="secondary" onClick={handleCreate}>
              Create
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </CreateForm>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowCreateForm(true)}
            sx={{ marginTop: '12px' }}
          >
            + Create Session
          </Button>
        )}
      </Wrapper>
    </Backdrop>
  )
}
