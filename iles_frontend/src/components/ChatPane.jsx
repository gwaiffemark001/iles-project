/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { chatAPI } from '../api/api';
import { useAuth } from '@/auth/useAuth';
import { formatDate, formatTime } from '@/utils/dateUtils'
import useInterval from '../hooks/useInterval'
import './ChatPane.css';
import UserAvatar from './UserAvatar';

export default function ChatPane({ currentUserId, onUnreadCountChange }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filteredContacts = useMemo(() => {
    const loweredSearch = searchText.trim().toLowerCase();

    return contacts.filter((contact) => {
      const name = (contact.full_name || contact.username || '').toLowerCase();
      const role = (contact.role || '').toLowerCase();
      const matchesSearch = !loweredSearch || name.includes(loweredSearch) || role.includes(loweredSearch);
      const matchesFilter = activeFilter === 'all' || (activeFilter === 'unread' && contact.unread_count > 0);
      return matchesSearch && matchesFilter;
    });
  }, [contacts, searchText, activeFilter]);

  const formatConversationTime = (rawTime) => {
    if (!rawTime) return '';

    const messageDate = new Date(rawTime);
    const now = new Date();
    const isSameDay = messageDate.toDateString() === now.toDateString();
    if (isSameDay) {
      return formatTime(rawTime);
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return formatDate(rawTime, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getContactSubtitle = (contact) => {
    if (contact.last_message) return contact.last_message;
    if (contact.role) return contact.role;
    return 'Tap to open chat';
  };

  const getMessageAuthor = (message) => {
    if (message.sender === currentUserId) {
      return currentUser || null;
    }
    return selectedContact || null;
  };

  const openUserProfile = (profileUser) => {
    if (!profileUser) return;
    navigate('/app/profile', { state: { profileUser, fromChat: true } });
  };

  return (
    <div className="chat-pane">
      <div className="chat-container">
        <div className="chat-contacts-panel">
          <div className="contacts-panel-header">
            <h3>Chats</h3>
          </div>

          <div className="chat-search-wrap">
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="chat-search-input"
            />
          </div>

          <div className="chat-filters">
            <button
              type="button"
              className={`chat-filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`chat-filter-chip ${activeFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveFilter('unread')}
            >
              Unread
            </button>
          </div>

          {filteredContacts.length === 0 ? (
            <p className="no-contacts">No contacts available</p>
          ) : (
            <ul className="contacts-list">
              {filteredContacts.map((contact) => (
                <li
                  key={contact.id}
                  className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="contact-avatar">
                    <UserAvatar user={contact} size="medium" />
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <div className="contact-name">{contact.full_name || contact.username}</div>
                      {contact.last_message_time && (
                        <div className="contact-time">{formatConversationTime(contact.last_message_time)}</div>
                      )}
                    </div>

                    <div className="contact-sub-row">
                      <div className="contact-subtitle">{getContactSubtitle(contact)}</div>
                      {contact.unread_count > 0 && <span className="unread-badge">{contact.unread_count}</span>}
                    </div>
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
                <div className="chat-header-user">
                  <button
                    type="button"
                    className="chat-header-avatar-button"
                    onClick={() => openUserProfile(selectedContact)}
                    aria-label={`Open ${selectedContact.full_name || selectedContact.username || 'user'} profile`}
                  >
                    <UserAvatar user={selectedContact} size="medium" className="chat-header-avatar" />
                  </button>
                  <div>
                    <h3>{selectedContact.full_name || selectedContact.username}</h3>
                    <div className="contact-subtitle">{selectedContact.role}</div>
                  </div>
                </div>
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
                      className={`message-row ${msg.sender === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-avatar">
                        <UserAvatar user={getMessageAuthor(msg)} size="small" />
                      </div>
                      <div className="message">
                        <div className="message-content">{msg.message}</div>
                        <div className="message-time">
                          {formatTime(msg.created_at)}
                        </div>
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


