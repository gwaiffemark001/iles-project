// Reusable component to display error messages in the UI
export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="iles-error-message" role="alert" aria-live="assertive">
      {message}
    </div>
  )
}
const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const previousMessagesRef = useRef([]);