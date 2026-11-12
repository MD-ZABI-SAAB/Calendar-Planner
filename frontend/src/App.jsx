
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

const STORAGE_KEY = 'taskai_conversations'

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hello! How can I help you today?'
  }
]

function createChat() {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: initialMessages
  }
}

function App() {
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY)

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats)

        if (Array.isArray(parsedChats) && parsedChats.length > 0) {
          return parsedChats
        }
      } catch (error) {
        console.error('Could not load saved chats:', error)
      }
    }

    return [createChat()]
  })

  const [activeChatId, setActiveChatId] = useState(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY)

    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats)

        if (Array.isArray(parsedChats) && parsedChats.length > 0) {
          return parsedChats[0].id
        }
      } catch (error) {
        console.error('Could not load active chat:', error)
      }
    }

    return null
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef(null)

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  )

  const messages = activeChat?.messages || initialMessages

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages, loading])

  const sendMessage = async () => {
    const message = input.trim()

    if (!message || loading || !activeChat) return

    const chatId = activeChat.id

    const conversationHistory = activeChat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }))

    const updatedMessages = [
      ...activeChat.messages,
      { role: 'user', content: message }
    ]

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title:
                chat.title === 'New Chat'
                  ? message.slice(0, 35)
                  : chat.title,
              messages: updatedMessages
            }
          : chat
      )
    )

    setInput('')
    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          history: conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: 'assistant',
                    content: data.response
                  }
                ]
              }
            : chat
        )
      )

    } catch (error) {
      console.error('Chat API Error:', error)

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please check your API server and try again.'
                  }
                ]
              }
            : chat
        )
      )

    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const newChat = () => {
    const chat = createChat()

    setChats((prev) => [chat, ...prev])
    setActiveChatId(chat.id)
    setInput('')
  }

  const openChat = (chatId) => {
    setActiveChatId(chatId)
    setInput('')
  }

  // Delete a conversation
  const deleteChat = (chatId) => {
    const remainingChats = chats.filter(
      (chat) => chat.id !== chatId
    )

    if (remainingChats.length === 0) {
      const newChat = createChat()

      setChats([newChat])
      setActiveChatId(newChat.id)
    } else {
      setChats(remainingChats)

      if (activeChatId === chatId) {
        setActiveChatId(remainingChats[0].id)
      }
    }

    setInput('')
  }

  return (
    <div className="chat-app">
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">✦</div>
          <span>TaskAI</span>
        </div>

        <button className="new-chat-btn" onClick={newChat}>
          + New Chat
        </button>

        <div className="chat-list">
          <h4>Recent Chats</h4>

          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-list-item ${
                chat.id === activeChatId ? 'active' : ''
              }`}
            >
              <button
                className="chat-title-btn"
                onClick={() => openChat(chat.id)}
              >
                {chat.title}
              </button>

              <button
                className="delete-chat-btn"
                title="Delete conversation"
                aria-label={`Delete ${chat.title}`}
                onClick={() => deleteChat(chat.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          AI Assistant
          <span>Powered by TaskAI</span>
        </div>

      </aside>

      <main className="chat-main">

        <header className="chat-header">
          <div>
            <h3>TaskAI Assistant</h3>

            <span className="online-status">
              <span className="status-dot"></span>
              Ready to help
            </span>
          </div>
        </header>

        <section className="chat-messages">

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.role}`}
            >
              {msg.role === 'assistant' && (
                <div className="avatar">✦</div>
              )}

              <div className="message-bubble">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {msg.role === 'user' && (
                <div className="user-avatar">U</div>
              )}
            </div>
          ))}

          {loading && activeChat && (
            <div className="message-row assistant">
              <div className="avatar">✦</div>

              <div className="message-bubble typing">
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef}></div>

        </section>

        <footer className="chat-input-area">

          <div className="input-container">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message TaskAI..."
              rows="1"
              disabled={loading}
            />

            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              ↑
            </button>
          </div>

          <p className="input-hint">
            Press Enter to send · Shift + Enter for a new line
          </p>

        </footer>

      </main>
    </div>
  )
}

export default App
