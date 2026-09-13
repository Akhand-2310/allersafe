import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Loader2, MessageSquare, Trash2 } from 'lucide-react';

const createGreeting = userProfile => ({ role: 'model', text: `Hi ${userProfile?.name || 'there'}! I'm your AllerSafe AI Assistant. Your profile is loaded with ${userProfile?.allergens?.join(', ') || 'no allergens'}.` });

function loadHistory(storageKey, userProfile) {
	try {
		const saved = window.localStorage.getItem(storageKey);
		const parsed = saved ? JSON.parse(saved) : [];
		const validMessages = Array.isArray(parsed)
			? parsed.filter(message => message && ['user', 'model'].includes(message.role) && typeof message.text === 'string')
			: [];
		return validMessages.length ? validMessages : [createGreeting(userProfile)];
	} catch {
		return [createGreeting(userProfile)];
	}
}

export function AIChat({ userProfile }) {
	const storageKey = `allersafe_chat_history_${userProfile?.email || 'guest'}`;
	const [messages, setMessages] = useState(() => loadHistory(storageKey, userProfile));
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const end = useRef();

	useEffect(() => {
		end.current?.scrollIntoView?.({ behavior: 'smooth' });
	}, [messages, loading]);
	useEffect(() => {
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(messages));
		} catch {
			// Chat remains usable when browser storage is unavailable.
		}
	}, [messages, storageKey]);

	const cleanReply = value => {
		if (typeof value !== 'string') return 'I could not understand that response.';
		try {
			const parsed = JSON.parse(value);
			return parsed.message || parsed.answer || value;
		} catch {
			return value;
		}
	};

	const send = async event => {
		event?.preventDefault();
		if (!input.trim() || loading) return;
		const text = input.trim();
		const conversation = [...messages, { role: 'user', text }];
		setInput('');
		setMessages(conversation);
		setLoading(true);
		try {
			const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ message: text, allergens: userProfile?.allergens || [], history: conversation.slice(-8).map(message => ({ role: message.role === 'model' ? 'assistant' : 'user', content: message.text })) }) });
			const data = await response.json();
			if (response.status === 401) throw new Error('Your session has expired. Please sign in again to use the AI assistant.');
			if (response.status === 502) throw new Error('The AI assistant is temporarily unavailable. Please try again later.');
			if (!response.ok) throw new Error(data.error || data.detail || 'AI request failed.');
			setMessages(prev => [...prev, { role: 'model', text: cleanReply(data.answer) }]);
		} catch (error) {
			setMessages(prev => [...prev, { role: 'model', text: `I could not respond right now. ${error.message}` }]);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(event); } };
	const clearHistory = () => setMessages([createGreeting(userProfile)]);

	return <div className="chat panel"><header><MessageSquare /><div><h2>AllerSafe AI Assistant</h2><p>Powered by Gemini</p></div><button type="button" className="icon-button" onClick={clearHistory} title="Clear chat history" aria-label="Clear chat history"><Trash2 size={17} /></button></header><div className="chat-messages">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`message ${message.role}`}>{message.text}</div>)}{loading && <div className="message model"><Loader2 className="animate-spin" /> Thinking...</div>}<div ref={end} /></div><form onSubmit={send}><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about ingredients or risks..." /><button disabled={!input.trim() || loading}><span>Send</span><ChevronRight /></button></form></div>;
}
