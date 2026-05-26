/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useRef } from 'react';

import { chatAPI } from '../api/api';
import { formatDate, formatTime } from '@/utils/dateUtils'
import useInterval from '../hooks/useInterval'
import './ChatPane.css';

export default function ChatPane({ currentUserId, onUnreadCountChange }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const previousMessagesRef = useRef([]);

  const fetchContacts = useCallback(async () => {
    try {
      const response = await chatAPI.getContacts();
      setContacts(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Failed to load contacts');
    }
  }, []);

  const fetchMessages = useCallback(async (contactId, showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await chatAPI.getMessages(contactId);
      const newMessages = Array.isArray(response.data) ? response.data : [];
      
      // Only update state if messages actually changed
      if (JSON.stringify(newMessages) !== JSON.stringify(previousMessagesRef.current)) {
        setMessages(newMessages);
        previousMessagesRef.current = newMessages;
      }
      
      setError('');
    } catch {
      setError('Failed to load messages');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;

    try {
      await chatAPI.sendMessage(selectedContact.id, messageText);
      setMessageText('');
      // Refresh messages
      await fetchMessages(selectedContact.id, false);
      // Refresh contacts to update unread counts
      await fetchContacts();
    } catch {
      setError('Failed to send message');
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Report unread count to parent component
  useEffect(() => {
    if (onUnreadCountChange && contacts.length > 0) {
      const unreadContactCount = contacts.filter((contact) => contact.unread_count > 0).length;
      onUnreadCountChange(unreadContactCount);
    }
  }, [contacts, onUnreadCountChange]);

  useEffect(() => {
    if (selectedContact) {
      // Fetch messages immediately
      fetchMessages(selectedContact.id, true);
    }
  }, [selectedContact, fetchMessages]);

  useInterval(
    () => {
      if (selectedContact) {
        fetchMessages(selectedContact.id, false)
      }
    },
    selectedContact ? 3000 : null,
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-pane">
      <div className="chat-container">
        <div className="chat-contacts-panel">
          <h3>Chat Contacts</h3>
          {contacts.length === 0 ? (
            <p className="no-contacts">No contacts available</p>
          ) : (
            <ul className="contacts-list">
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="contact-info">
                    <div className="contact-header">
                      <div className="contact-name">
                        {contact.full_name || contact.username}
                      </div>
                      {contact.unread_count > 0 && (
                        <span className="unread-badge">{contact.unread_count}</span>
                      )}
                    </div>
                    <div className="contact-role">{contact.role}</div>
                    {contact.last_message_time && (
                      <div className="contact-time">
                        {formatDate(contact.last_message_time, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="chat-messages-panel">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <h3>{selectedContact.full_name || selectedContact.username}</h3>
                <div className="contact-role-badge">{selectedContact.role}</div>
              </div>

              {error && <div className="chat-error">{error}</div>}

              <div className="messages-container">
                {loading ? (
                  <p className="loading">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="no-messages">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.sender === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">{msg.message}</div>
                      <div className="message-time">
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="message-input"
                />
                <button type="submit" className="send-button" disabled={!messageText.trim()}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-contact-selected">
              <p>Select a contact to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Commit 16: small comment added to ChatPane.jsx for commit history
