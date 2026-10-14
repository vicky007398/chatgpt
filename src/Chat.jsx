import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, House, MessageCircle, Send, Check, Search, Flag, Ban } from 'lucide-react';
import { api } from './Live.jsx';
import { useI18n } from './i18n.jsx';

const localeFor = language => language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';

export default function Chat({ user, conversations, active, onSelect, onRead }) {
  const [search, S] = useState('');
  const { language, t } = useI18n();
  const locale = localeFor(language);

  return <main className={'chat-app ' + (active ? 'has-conversation' : '')}>
    <aside className="chat-list">
      <h2>{t('Chats')}</h2>
      <label className="chat-search">
        <Search size={18} />
        <input aria-label={t('Search chats')} placeholder={t('Search chats')} value={search} onChange={e => S(e.target.value)} />
      </label>
      {conversations.filter(c => ((c.contact_name || '') + ' ' + c.data.title).toLowerCase().includes(search.toLowerCase())).map(c =>
        <button className={'chat-list-row ' + (active?.id === c.id ? 'selected' : '')} key={c.id} onClick={() => onSelect(c)}>
          <span className="chat-avatar">{c.data.image ? <img src={c.data.image} alt="" /> : <House size={24} />}</span>
          <div>
            <strong>{c.contact_name || c.data.name}</strong>
            <small>{c.data.title}</small>
            <p>{c.last_message || t('Start a conversation')}</p>
          </div>
          <span className="chat-row-meta">
            {c.last_message_at && <time>{new Date(c.last_message_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time>}
            {c.unread > 0 && <span className="unread-badge" aria-label={c.unread + ' ' + t('unread messages')}>{c.unread}</span>}
          </span>
        </button>
      )}
      {!conversations.length && <div className="empty">
        <MessageCircle size={35} />
        <h3>{t('No chats yet')}</h3>
        <p>{t('Open an available home to chat with its owner.')}</p>
      </div>}
    </aside>
    {active ? <Thread key={active.id} chat={conversations.find(c => c.id === active.id) || active} user={user} onBack={() => onSelect(null)} onRead={onRead} /> :
      <section className="chat-welcome">
        <MessageCircle size={44} />
        <h2>{t('Your next home starts with a conversation')}</h2>
        <p>{t('Select a chat to get started.')}</p>
      </section>}
  </main>;
}

function Thread({ chat, user, onBack, onRead }) {
  const { language, t } = useI18n();
  const locale = localeFor(language);
  const [msgs, M] = useState([]);
  const [draft, D] = useState('');
  const [sending, S] = useState(false);
  const [error, E] = useState('');
  const [loading, L] = useState(true);
  const [blocked, B] = useState(!!chat.blocked);
  const [blockedByMe, BM] = useState(!!chat.blocked_by_me);
  const [safetyNotice, SN] = useState('');
  const [safetyBusy, SB] = useState(false);

  useEffect(() => { B(!!chat.blocked); BM(!!chat.blocked_by_me); }, [chat.blocked, chat.blocked_by_me]);

  async function block() {
    if (safetyBusy) return;
    SB(true);
    E('');
    try {
      const result = await api('/conversations/' + chat.id + '/block', { method: 'POST', body: '{}' });
      B(result.blocked);
      BM(result.blocked);
      SN(result.blocked ? 'User blocked. You cannot exchange messages or start new chats until unblocked.' : 'User unblocked.');
    } catch (e) { E(e.message); } finally { SB(false); }
  }

  async function report() {
    const reason = window.prompt(t('Why are you reporting this user or conversation?'));
    if (!reason?.trim()) return;
    try {
      await api('/reports', { method: 'POST', body: JSON.stringify({ conversation: chat.id, reason }) });
      SN('Report sent to the administrator for review.');
    } catch (e) { E(e.message); }
  }

  const scroll = useRef(null);
  const nearBottom = useRef(true);
  const seen = useRef('');
  const busy = useRef(false);
  const alive = useRef(true);
  const first = useRef(true);

  useEffect(() => {
    alive.current = true;
    async function load() {
      if (busy.current || document.hidden) return;
      busy.current = true;
      try {
        const rows = await api('/conversations/' + chat.id + '/messages');
        if (!alive.current) return;
        M(rows);
        L(false);
        E('');
        const last = rows.at(-1);
        if (last && String(last.seq) !== seen.current) {
          await api('/conversations/' + chat.id + '/read', { method: 'POST', body: JSON.stringify({ seq: last.seq }) });
          if (!alive.current) return;
          seen.current = String(last.seq);
          onRead(chat.id);
        }
      } catch (e) {
        if (alive.current) { E(e.message); L(false); }
      } finally { busy.current = false; }
    }
    load();
    const timer = setInterval(load, 1500);
    document.addEventListener('visibilitychange', load);
    return () => { alive.current = false; clearInterval(timer); document.removeEventListener('visibilitychange', load); };
  }, [chat.id]);

  useEffect(() => {
    if (scroll.current && (first.current || nearBottom.current)) {
      scroll.current.scrollTop = scroll.current.scrollHeight;
      if (msgs.length) first.current = false;
    }
  }, [msgs.length]);

  async function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || blocked) return;
    S(true);
    E('');
    try {
      const message = await api('/conversations/' + chat.id + '/messages', { method: 'POST', body: JSON.stringify({ body: text }) });
      if (!alive.current) return;
      M(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
      D('');
      nearBottom.current = true;
    } catch (e) { if (alive.current) E(e.message); } finally { if (alive.current) S(false); }
  }

  return <section className="chat-thread">
    <div className="thread-header">
      <button aria-label={t('Back to chats')} onClick={onBack}><ArrowLeft size={23} /></button>
      <span className="chat-avatar">{chat.data.image ? <img src={chat.data.image} alt="" /> : <House size={23} />}</span>
      <div><strong>{chat.contact_name || chat.data.name}</strong><small>{chat.data.title}</small></div>
    </div>
    <div className="thread-safety">
      <button onClick={report}><Flag size={16} />{t('Report user')}</button>
      <button onClick={block} disabled={safetyBusy || (blocked && !blockedByMe)}><Ban size={16} />{blockedByMe ? t('Unblock user') : blocked ? t('User blocked') : t('Block user')}</button>
    </div>
    {safetyNotice && <p className="chat-info" role="status">{t(safetyNotice)}</p>}
    <div className="thread-messages" ref={scroll} onScroll={() => { const el = scroll.current; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90; }}>
      {loading ? <p className="chat-info">{t('Loading messages…')}</p> : !msgs.length ? <p className="chat-info">{t('Say hello and ask about this home.')}</p> :
        msgs.map((m, i) => <React.Fragment key={m.id}>
          {(i === 0 || new Date(msgs[i - 1].created).toDateString() !== new Date(m.created).toDateString()) && <div className="chat-date">{new Date(m.created).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</div>}
          <div className={'message-bubble ' + (m.sender === user.id ? 'outgoing' : 'incoming')}>
            <span>{m.body}</span>
            <small>{new Date(m.created).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}{m.sender === user.id && <Check size={13} aria-label={t('Sent')} />}</small>
          </div>
        </React.Fragment>)}
    </div>
    {error && <div className="chat-error" role="alert">{t(error)}</div>}
    <form className="thread-compose" onSubmit={send}>
      <textarea rows={1} disabled={sending || blocked} aria-label={t('Message')} placeholder={blocked ? t('This user is blocked') : t('Message')} maxLength={2000} value={draft} onChange={e => D(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e); } }} />
      <button type="submit" aria-label={t('Send')} disabled={sending || blocked || !draft.trim()}><Send size={21} /></button>
    </form>
  </section>;
}
