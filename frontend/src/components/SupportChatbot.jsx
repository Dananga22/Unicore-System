import React, { useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const quickActions = [
  {
    label: 'Book a Facility',
    route: '/dashboard',
    keywords: ['book', 'booking', 'facility', 'resource', 'room'],
    response: 'You can create a new facility booking from the dashboard. Choose a resource, select the date and time, and submit the request.',
  },
  {
    label: 'Report an Issue',
    route: '/tickets/new',
    keywords: ['issue', 'maintenance', 'problem', 'ticket', 'report'],
    response: 'Use the ticket form to report maintenance issues, add details, and attach up to three images if needed.',
  },
  {
    label: 'Track My Ticket',
    route: '/tickets',
    keywords: ['track', 'status', 'ticket status', 'my ticket', 'progress'],
    response: 'Open the tickets page to see ticket status, comments, and any updates from admins or technicians.',
  },
  {
    label: 'View Notifications',
    route: null,
    keywords: ['notification', 'notifications', 'alerts', 'updates'],
    response: 'Use the notification bell in the top bar to view unread booking and ticket updates.',
  },
  {
    label: 'Contact Admin',
    route: '/profile',
    keywords: ['admin', 'support', 'contact', 'help'],
    response: 'If you need manual help, open your profile and use the support details there, or raise a ticket so the admin team can follow up.',
  },
];

const knowledgeBase = [
  {
    keywords: ['book', 'booking', 'facility', 'resource', 'room', 'reserve'],
    response: 'To book a facility, open the dashboard, complete the booking form, and submit your request. The system prevents overlapping bookings automatically.',
    route: '/dashboard',
  },
  {
    keywords: ['issue', 'maintenance', 'broken', 'problem', 'ticket', 'repair'],
    response: 'To report an issue, create a maintenance ticket with a category and description. You can also upload image evidence from the ticket form.',
    route: '/tickets/new',
  },
  {
    keywords: ['track', 'status', 'ticket status', 'my ticket', 'progress', 'follow up'],
    response: 'You can track your ticket lifecycle from OPEN to IN_PROGRESS to RESOLVED on the tickets page. Open any ticket to view comments and updates.',
    route: '/tickets',
  },
  {
    keywords: ['notification', 'notifications', 'alert', 'alerts'],
    response: 'Booking approvals, ticket updates, and system notices appear in the notification bell at the top-right of the dashboard.',
    route: null,
  },
  {
    keywords: ['resource', 'facility list', 'assets', 'lab', 'hall', 'equipment'],
    response: 'The Facilities & Assets page lets you search by type, location, and status so you can quickly find available resources.',
    route: '/resources',
  },
  {
    keywords: ['admin', 'contact admin', 'support', 'who can help'],
    response: 'For account or workflow support, contact the admin team or create a ticket so your request is tracked properly.',
    route: '/profile',
  },
  {
    keywords: ['how', 'use', 'guide', 'help', 'start'],
    response: 'Start from the dashboard for bookings, use Tickets to report issues, Resources to browse facilities, and the notification bell for updates.',
    route: '/dashboard',
  },
];

const createBotMessage = (text, action = null) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  sender: 'bot',
  text,
  action,
});

const createUserMessage = (text) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  sender: 'user',
  text,
});

const getWelcomeMessages = (name) => ([
  createBotMessage(`Hi! I’m the UniCore Support Assistant. How can I help you today?`),
  createBotMessage('I can help with bookings, maintenance tickets, notifications, and finding the right module quickly.')
]);

const SupportChatbot = ({ userData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => getWelcomeMessages(userData?.name));

  const contextualHint = useMemo(() => {
    if (location.pathname.startsWith('/tickets')) {
      return 'Need help with ticket status, comments, or issue reporting?';
    }
    if (location.pathname.startsWith('/resources')) {
      return 'Need help finding or booking a facility?';
    }
    if (location.pathname.startsWith('/dashboard')) {
      return 'You can ask how to submit bookings or where to check approvals.';
    }
    return 'Ask about facilities, tickets, notifications, or how to use UniCore.';
  }, [location.pathname]);

  const pushBotReply = (text, action = null) => {
    setMessages((current) => [...current, createBotMessage(text, action)]);
  };

  const handleRouteAction = (action) => {
    if (action?.route) {
      navigate(action.route);
      if (action.confirmation) {
        pushBotReply(action.confirmation);
      }
      return;
    }

    if (action?.message) {
      pushBotReply(action.message);
    }
  };

  const handleQuickAction = (action) => {
    pushBotReply(action.response, action.route ? {
      label: `Open ${action.label}`,
      route: action.route,
      confirmation: `Opening ${action.label.toLowerCase()} for you now.`,
    } : null);

    if (!action.route) {
      return;
    }

    navigate(action.route);
  };

  const resolveResponse = (rawInput) => {
    const normalizedInput = rawInput.trim().toLowerCase();
    const matchedEntry = knowledgeBase.find((entry) =>
      entry.keywords.some((keyword) => normalizedInput.includes(keyword))
    );

    if (matchedEntry) {
      return {
        text: matchedEntry.response,
        action: matchedEntry.route
          ? {
              label: 'Open page',
              route: matchedEntry.route,
              confirmation: 'Taking you to the related page.',
            }
          : null,
      };
    }

    return {
      text: 'I can help with facility bookings, maintenance tickets, notifications, resource discovery, and general UniCore guidance. Try one of the quick actions below.',
      action: null,
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    setMessages((current) => [...current, createUserMessage(trimmedInput)]);
    setInput('');

    const reply = resolveResponse(trimmedInput);
    setMessages((current) => [...current, createUserMessage(trimmedInput), createBotMessage(reply.text, reply.action)]);
  };

  return (
    <div className={`support-chatbot${isOpen ? ' open' : ''}`}>
      {isOpen && (
        <section className="support-chatbot-panel" aria-label="Student support chatbot">
          <header className="support-chatbot-header">
            <div className="support-chatbot-title">
              <div className="support-chatbot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <strong>UniCore Support</strong>
                <span>{contextualHint}</span>
              </div>
            </div>
            <button
              type="button"
              className="support-chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close support chatbot"
            >
              <X size={18} />
            </button>
          </header>

          <div className="support-chatbot-body">
            <div className="support-chatbot-quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="support-chatbot-chip"
                  onClick={() => handleQuickAction(action)}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="support-chatbot-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`support-chatbot-message ${message.sender === 'user' ? 'is-user' : 'is-bot'}`}
                >
                  <div className="support-chatbot-bubble">
                    <p>{message.text}</p>
                    {message.action && (
                      <button
                        type="button"
                        className="support-chatbot-link"
                        onClick={() => handleRouteAction(message.action)}
                      >
                        {message.action.label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form className="support-chatbot-form" onSubmit={handleSubmit}>
            <div className="support-chatbot-input-wrap">
              <Sparkles size={16} />
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about bookings, tickets, notifications, or support..."
              />
            </div>
            <button type="submit" className="support-chatbot-send" aria-label="Send chatbot message">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="support-chatbot-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open student support chatbot"
      >
        <MessageCircle size={22} />
        <span>Support</span>
      </button>
    </div>
  );
};

export default SupportChatbot;
