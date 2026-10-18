/* ==========================================================================
   FLOCARD AI CONCIERGE — INTERACTIVE ASSISTANT INTERFACE
   Supports Conversational Guide, Product Recommendation, Professional Bio Studio,
   Design Combinator, and "Apply Suggestions" integration with the Card Designer.
   ========================================================================== */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Palette,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Compass
} from 'lucide-react';
import { EDITIONS, TEMPLATES, FONT_OPTIONS } from '../../lib/constants';
import { checkAiConfigStatus, sendAiConciergeMessage } from '../../lib/aiConciergeApi';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import PromptBar from '../PromptBar/PromptBar';
import {
  Attachment01Icon,
  CreditCardIcon,
  UserIcon,
  Globe02Icon,
  CpuIcon
} from '@hugeicons/core-free-icons';

export default function AiConciergeView({
  onClose = null,
  isFullPage = false,
  designerContext = null,
  onApplySuggestionsToDesigner = null
}) {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const { getAiConversation, saveAiConversation, clearAiConversation } = useData();

  const [aiStatus, setAiStatus] = useState({ configured: true, provider: 'Checking...' });
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'bio' | 'recommend'
  const [copiedKey, setCopiedKey] = useState(null);

  // Bio Studio Inputs
  const [bioInputs, setBioInputs] = useState({
    name: user?.name || '',
    profession: '',
    company: user?.company || '',
    skills: '',
    targetAudience: '',
    tone: 'Professional'
  });

  // Selected suggestion to review and apply
  const [reviewingSuggestion, setReviewingSuggestion] = useState(null);
  const [selectedChanges, setSelectedChanges] = useState({});
  const [appliedFeedback, setAppliedFeedback] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // FLOCARD PromptBar configuration
  const flocardSources = useMemo(() => [
    { key: 'files', name: 'Photos & files', description: 'Attach images or design assets', icon: Attachment01Icon, attach: true },
    { key: 'cards', name: 'FLOCARD Catalog', description: 'Obsidian, 24K Gold, Platinum', icon: CreditCardIcon },
    { key: 'profiles', name: 'Digital Profiles', description: 'Morphing vCard & portfolio suite', icon: UserIcon },
    { key: 'nfc', name: 'NFC Tech Specs', description: 'NTAG216 chip frequency & taps', icon: CpuIcon },
    { key: 'web', name: 'Web Search', description: 'Live web networking trends', icon: Globe02Icon }
  ], []);

  const flocardCommands = useMemo(() => [
    { key: 'summarize', name: '/summarize', description: 'Digest our conversation so far' },
    { key: 'recommend', name: '/recommend', description: 'Recommend the best FLOCARD for me' },
    { key: 'bio', name: '/bio', description: 'Draft my professional bio & tagline' },
    { key: 'compare', name: '/compare', description: 'Compare card materials and finishes side-by-side' },
    { key: 'specs', name: '/specs', description: 'View NXP NTAG216 hardware specs' }
  ], []);

  const flocardModels = useMemo(() => [
    { key: 'gemini-3.8-flash', name: 'Gemini 3.8', tag: 'Flagship' },
    { key: 'gemini-2.5-flash-lite', name: 'Gemini Fast', tag: 'Fast' }
  ], []);

  const handlePromptBarSend = (text, { attachments = [], model, effort } = {}) => {
    let cleanText = (text || '').trim();
    if (cleanText.startsWith('/bio')) {
      handleQuickAction('Create my professional bio');
      return;
    }
    if (cleanText.startsWith('/recommend')) {
      handleQuickAction('Help me choose a card');
      return;
    }
    if (cleanText.startsWith('/compare')) {
      setShowCompareModal(true);
      return;
    }
    if (cleanText.startsWith('/specs')) {
      handleQuickAction('What is the NTAG216 chip?');
      return;
    }
    if (attachments && attachments.length > 0) {
      cleanText += `\n[Attached reference files: ${attachments.join(', ')}]`;
    }
    handleSendMessage(cleanText, 'chat');
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  };

  const handlePromptBarAttach = () => {
    return new Promise((resolve) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt';
      fileInput.multiple = true;
      fileInput.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        resolve(files.map(f => f.name));
      };
      fileInput.click();
    });
  };

  const handlePromptBarDictate = () => {
    return new Promise((resolve) => {
      const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
      if (!SpeechRecognition) {
        alert('Voice dictation is supported in modern Chrome, Edge, and Safari browsers.');
        return resolve('');
      }
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript || '';
          resolve(transcript);
        };
        recognition.onerror = () => resolve('');
        recognition.start();
      } catch (err) {
        resolve('');
      }
    });
  };

  // Load configuration status and initial conversation history
  useEffect(() => {
    let mounted = true;
    checkAiConfigStatus().then(status => {
      if (mounted) {
        setAiStatus(status);
      }
    });

    const savedHistory = getAiConversation ? getAiConversation(user?.id || 'guest') : [];
    if (savedHistory && savedHistory.length > 0) {
      setMessages(savedHistory);
    } else {
      // Welcome experience
      setMessages([
        {
          id: 'welcome_msg',
          role: 'model',
          text: `**Meet Your FLOCARD AI Concierge**\n\n“Let's create a card that represents you.”\n\nI can help you choose the ideal card edition, tailor your professional bio, or recommend design combinations that match your brand identity.`,
          isWelcome: true
        }
      ]);
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  // Persist conversation updates
  useEffect(() => {
    if (messages.length > 1 && saveAiConversation) {
      saveAiConversation(user?.id || 'guest', messages);
    }
  }, [messages, user]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearHistory = () => {
    if (window.confirm('Clear your conversation history with FLOCARD AI Concierge?')) {
      if (clearAiConversation) clearAiConversation(user?.id || 'guest');
      setMessages([
        {
          id: `welcome_${Date.now()}`,
          role: 'model',
          text: `**Meet Your FLOCARD AI Concierge**\n\n“Let's create a card that represents you.”\n\nWhat would you like to explore today?`,
          isWelcome: true
        }
      ]);
    }
  };

  const handleSendMessage = async (customPrompt = null, actionType = 'chat', customProfileInputs = null) => {
    const textToSend = (customPrompt !== null ? customPrompt : inputText).trim();
    if (!textToSend && actionType === 'chat') return;

    const userMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: textToSend || (actionType === 'generate_bio' ? 'Generate professional bio assets' : 'Recommend card design')
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (customPrompt === null) setInputText('');
    setLoading(true);

    try {
      const response = await sendAiConciergeMessage({
        message: textToSend,
        action: actionType,
        history: newHistory.filter(m => !m.isWelcome),
        profileInputs: customProfileInputs || (actionType === 'generate_bio' ? bioInputs : null),
        designContext: designerContext
      });

      if (!response.success && response.configured === false) {
        setAiStatus({ configured: false, error: response.error, setupInstructions: response.setupInstructions });
        setMessages(prev => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: 'model',
            isConfigWarning: true,
            text: response.error || 'AI provider credentials are not configured in your server environment.',
            setupInstructions: response.setupInstructions
          }
        ]);
      } else if (!response.success) {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: 'model',
            isError: true,
            text: `Error: ${response.error || 'Unable to receive response from AI provider. Please verify your connection.'}`
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `msg_model_${Date.now()}`,
            role: 'model',
            text: response.text,
            suggestion: response.suggestion,
            provider: response.provider
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'model',
          isError: true,
          text: `System Error: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (actionText) => {
    if (actionText === 'Create my professional bio') {
      setActiveTab('bio');
    } else if (actionText === 'Help me choose a card') {
      handleSendMessage('Help me choose the ideal FLOCARD edition. Please ask me about my business, how I network, and who will receive my card.');
    } else if (actionText === 'Recommend a material and finish') {
      handleSendMessage('What materials and tactile finishes are available across the Purple, Gold, and Platinum editions, and which do you recommend for my profession?');
    } else if (actionText === 'Find my perfect card design') {
      handleSendMessage('Recommend a complete card design combination including card edition, typography, logo placement, and digital profile theme.', 'recommend');
    } else {
      handleSendMessage(actionText);
    }
  };

  const handleCopyText = (key, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const openApplyReviewModal = (suggestion) => {
    const initialSelections = {};
    if (suggestion.designSuggestions?.edition) initialSelections.edition = true;
    if (suggestion.designSuggestions?.templateType) initialSelections.templateType = true;
    if (suggestion.designSuggestions?.fontFamily) initialSelections.fontFamily = true;
    if (suggestion.designSuggestions?.roleFontFamily) initialSelections.roleFontFamily = true;
    if (suggestion.designSuggestions?.tagline) initialSelections.tagline = true;
    if (suggestion.designSuggestions?.customerLogoSize) initialSelections.customerLogoSize = true;
    if (suggestion.designSuggestions?.flocardLogoPosition) initialSelections.flocardLogoPosition = true;
    if (suggestion.designSuggestions?.nfcPosition) initialSelections.nfcPosition = true;

    setSelectedChanges(initialSelections);
    setReviewingSuggestion(suggestion);
  };

  const executeApplySuggestions = () => {
    if (!reviewingSuggestion) return;
    const { designSuggestions, recommendation } = reviewingSuggestion;
    const finalEdition = designSuggestions?.edition || recommendation?.edition || 'purple';
    const finalTemplate = designSuggestions?.templateType || recommendation?.templateType || 'standard';

    if (onApplySuggestionsToDesigner) {
      // In-page Designer integration
      onApplySuggestionsToDesigner({
        selectedChanges,
        suggestions: designSuggestions,
        recommendation
      });
      setAppliedFeedback('Suggestions applied to card preview!');
      setTimeout(() => {
        setAppliedFeedback(null);
        setReviewingSuggestion(null);
      }, 1800);
    } else {
      // Navigate to designer with query parameters prefilled
      const queryParams = new URLSearchParams();
      if (selectedChanges.edition && finalEdition) queryParams.set('edition', finalEdition);
      if (selectedChanges.templateType && finalTemplate) queryParams.set('template', finalTemplate);
      if (selectedChanges.tagline && designSuggestions?.tagline) queryParams.set('tagline', designSuggestions.tagline);
      if (selectedChanges.fontFamily && designSuggestions?.fontFamily) queryParams.set('font', designSuggestions.fontFamily);

      window.location.href = `/designer?${queryParams.toString()}`;
    }
  };

  return (
    <div
      className="flocard-ai-concierge-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullPage ? 'calc(100vh - var(--header-height) - 40px)' : '100%',
        minHeight: isFullPage ? '700px' : '450px',
        backgroundColor: 'var(--card-surface)',
        borderRadius: isFullPage ? '20px' : '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(90deg, rgba(107, 0, 255, 0.12) 0%, rgba(168, 85, 247, 0.04) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(107, 0, 255, 0.35)',
              flexShrink: 0
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                FLOCARD AI Concierge
              </h2>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  backgroundColor: aiStatus.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: aiStatus.configured ? '#10B981' : '#EF4444',
                  border: aiStatus.configured ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {aiStatus.configured ? (aiStatus.provider || 'Live AI Engine') : 'Setup Needed'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              “Let's create a card that represents you.”
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleClearHistory}
            className="btn btn-outline btn-xs"
            title="Clear Conversation History"
            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
          >
            <Trash2 size={13} />
            <span className="hidden-mobile">Reset</span>
          </button>

          {!isFullPage && (
            <a
              href="/ai-concierge"
              className="btn btn-outline btn-xs"
              title="Open Full Page AI Concierge"
              style={{ padding: '6px 10px' }}
            >
              <Maximize2 size={13} />
            </a>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI Concierge"
              className="btn btn-outline btn-xs"
              style={{ padding: '6px', borderRadius: '50%' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '4px 12px',
          gap: '6px',
          overflowX: 'auto',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'chat' ? 'var(--elevated-surface)' : 'transparent',
            color: activeTab === 'chat' ? 'var(--accent-purple)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'chat' ? 700 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Bot size={14} />
          <span>Conversational Concierge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bio')}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'bio' ? 'var(--elevated-surface)' : 'transparent',
            color: activeTab === 'bio' ? 'var(--accent-purple)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'bio' ? 700 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileText size={14} />
          <span>Professional Bio Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCompareModal(true)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: 'auto'
          }}
        >
          <Sliders size={14} />
          <span>Compare Editions</span>
        </button>
      </div>

      {/* Tab: Professional Bio Studio */}
      {activeTab === 'bio' && (
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ background: 'var(--elevated-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '0.98rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-purple)" />
              Generate Professional Bios & Taglines
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Provide your details below to generate editable drafts for your card tagline, digital portfolio bio, and services. Nothing is published without your review.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                value={bioInputs.name}
                onChange={e => setBioInputs({ ...bioInputs, name: e.target.value })}
                placeholder="e.g. Akhil Anvar"
                className="input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Profession / Role</label>
              <input
                type="text"
                value={bioInputs.profession}
                onChange={e => setBioInputs({ ...bioInputs, profession: e.target.value })}
                placeholder="e.g. Founder & Chief Architect"
                className="input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Company / Practice</label>
              <input
                type="text"
                value={bioInputs.company}
                onChange={e => setBioInputs({ ...bioInputs, company: e.target.value })}
                placeholder="e.g. FLOCARD Enterprise"
                className="input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Preferred Tone</label>
              <select
                value={bioInputs.tone}
                onChange={e => setBioInputs({ ...bioInputs, tone: e.target.value })}
                className="input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
              >
                {['Professional', 'Minimal', 'Friendly', 'Executive', 'Creative'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Key Skills, Specialties or Value Proposition</label>
            <input
              type="text"
              value={bioInputs.skills}
              onChange={e => setBioInputs({ ...bioInputs, skills: e.target.value })}
              placeholder="e.g. High-frequency systems, corporate branding, venture building"
              className="input"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Target Audience / Card Recipients</label>
            <input
              type="text"
              value={bioInputs.targetAudience}
              onChange={e => setBioInputs({ ...bioInputs, targetAudience: e.target.value })}
              placeholder="e.g. Enterprise investors, VIP clients, event networking"
              className="input"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
            />
          </div>

          <button
            type="button"
            disabled={loading || !bioInputs.profession}
            onClick={() => {
              setActiveTab('chat');
              handleSendMessage(null, 'generate_bio', bioInputs);
            }}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>Generate Professional Bio Drafts</span>
          </button>
        </div>
      )}

      {/* Tab: Conversational Chat Thread */}
      {activeTab === 'chat' && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Unconfigured Provider Banner */}
          {!aiStatus.configured && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '14px 18px',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#EF4444' }}>
                    AI Provider Configuration Required
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    The FLOCARD AI Concierge connects to a live, secure server-side AI model. To enable real answers and bio generation, please configure an API key in your server environment:
                  </p>
                  <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#A855F7', marginBottom: '8px' }}>
                    GEMINI_API_KEY=your_google_ai_key_here
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Add this key to your project's <code>.env</code> file. No fake or canned AI answers will be simulated.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: isUser ? 'var(--primary-purple)' : 'rgba(107, 0, 255, 0.15)',
                    color: isUser ? '#FFFFFF' : 'var(--accent-purple)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {isUser ? <User size={16} /> : <Sparkles size={16} />}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: '85%',
                    backgroundColor: isUser ? 'var(--primary-purple)' : 'var(--elevated-surface)',
                    color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '14px 18px',
                    fontSize: '0.86rem',
                    lineHeight: 1.6,
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-soft)'
                  }}
                >
                  {/* Text formatted */}
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>

                  {/* Welcome quick-action prompts */}
                  {msg.isWelcome && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Quick-start actions:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          'Help me choose a card',
                          'Recommend a material and finish',
                          'Create my professional bio',
                          'Find my perfect card design'
                        ].map((qa) => (
                          <button
                            key={qa}
                            type="button"
                            onClick={() => handleQuickAction(qa)}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(107, 0, 255, 0.1)',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                              color: 'var(--accent-purple)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(107, 0, 255, 0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(107, 0, 255, 0.1)'; }}
                          >
                            <span>{qa}</span>
                            <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Embedded Structured Suggestion Card */}
                  {msg.suggestion && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(107, 0, 255, 0.08)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Product Recommendation Banner */}
                      {msg.suggestion.recommendation && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-purple)' }}>
                              Recommended Edition
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: 'var(--card-surface)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 600,
                                textTransform: 'capitalize'
                              }}
                            >
                              {msg.suggestion.recommendation.edition} Edition
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {msg.suggestion.recommendation.explanation}
                          </p>
                        </div>
                      )}

                      {/* Bio Drafts */}
                      {msg.suggestion.bio && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(168, 85, 247, 0.2)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-purple)' }}>
                            Generated Bio & Tagline
                          </span>
                          {msg.suggestion.bio.cardTagline && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-surface)', padding: '6px 10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                Tagline: <strong>{msg.suggestion.bio.cardTagline}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText('tagline', msg.suggestion.bio.cardTagline)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', padding: '2px' }}
                                title="Copy Tagline"
                              >
                                {copiedKey === 'tagline' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                              </button>
                            </div>
                          )}

                          {msg.suggestion.bio.shortBio && (
                            <div style={{ backgroundColor: 'var(--card-surface)', padding: '8px 10px', borderRadius: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Short Bio</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText('shortBio', msg.suggestion.bio.shortBio)}
                                  style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', padding: '2px' }}
                                  title="Copy Bio"
                                >
                                  {copiedKey === 'shortBio' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                                </button>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {msg.suggestion.bio.shortBio}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => openApplyReviewModal(msg.suggestion)}
                          className="btn btn-primary btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Apply Suggestions</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCompareModal(true)}
                          className="btn btn-outline btn-sm"
                          style={{ gap: '6px' }}
                        >
                          <Sliders size={14} />
                          <span>Compare Editions</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(107, 0, 255, 0.15)',
                  color: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div
                style={{
                  backgroundColor: 'var(--elevated-surface)',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>FLOCARD AI Concierge is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Suggested Quick Follow-Up Chips */}
      {activeTab === 'chat' && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            flexShrink: 0
          }}
        >
          {[
            'Minimal design',
            'Bold luxury finish',
            'Creative technology edition',
            'Purple vs Gold comparison',
            'What is the NTAG216 chip?'
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(chip)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.color = 'var(--accent-purple)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Box with React Bits PromptBar */}
      {activeTab === 'chat' && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-surface)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <PromptBar
            placeholder="Ask about cards, finishes, bios, or design combinations..."
            sources={flocardSources}
            commands={flocardCommands}
            models={flocardModels}
            efforts={['Low', 'Medium', 'High', 'Extra', 'Max']}
            defaultEffort="High"
            busy={loading}
            onSend={handlePromptBarSend}
            onStop={handleStop}
            onAttach={handlePromptBarAttach}
            onDictate={handlePromptBarDictate}
            background={isLight ? '#FFFFFF' : '#140D22'}
            color={isLight ? '#191522' : '#F5F3FF'}
            menuBackground={isLight ? '#FFFFFF' : '#1F1433'}
            sparkColor={isLight ? '#6B00FF' : '#B39DFF'}
            sparkBoost={1.2}
            width={isFullPage ? 860 : 440}
            radius={16}
            maxRows={4}
            className="flocard-prompt-bar"
          />
        </div>
      )}

      {/* REVIEW & APPLY SUGGESTIONS MODAL */}
      {reviewingSuggestion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border-highlight)',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-purple)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Review & Apply AI Suggestions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSuggestion(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
              Select which changes you would like to apply to your FLOCARD. Existing elements not selected will be preserved.
            </p>

            {/* Checklist of suggested changes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {reviewingSuggestion.recommendation?.edition && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--elevated-surface)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedChanges.edition)}
                    onChange={e => setSelectedChanges({ ...selectedChanges, edition: e.target.checked })}
                  />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Card Edition:</strong> {EDITIONS[reviewingSuggestion.recommendation.edition]?.name || reviewingSuggestion.recommendation.edition}
                  </div>
                </label>
              )}

              {reviewingSuggestion.designSuggestions?.templateType && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--elevated-surface)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedChanges.templateType)}
                    onChange={e => setSelectedChanges({ ...selectedChanges, templateType: e.target.checked })}
                  />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Template:</strong> {TEMPLATES[reviewingSuggestion.designSuggestions.templateType]?.name || reviewingSuggestion.designSuggestions.templateType}
                  </div>
                </label>
              )}

              {reviewingSuggestion.designSuggestions?.fontFamily && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--elevated-surface)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedChanges.fontFamily)}
                    onChange={e => setSelectedChanges({ ...selectedChanges, fontFamily: e.target.checked })}
                  />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Headline Typography:</strong> {reviewingSuggestion.designSuggestions.fontFamily}
                  </div>
                </label>
              )}

              {reviewingSuggestion.designSuggestions?.tagline && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--elevated-surface)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedChanges.tagline)}
                    onChange={e => setSelectedChanges({ ...selectedChanges, tagline: e.target.checked })}
                  />
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>Tagline:</strong> “{reviewingSuggestion.designSuggestions.tagline}”
                  </div>
                </label>
              )}
            </div>

            {appliedFeedback && (
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.84rem', fontWeight: 600, textAlign: 'center', marginBottom: '14px' }}>
                <Check size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {appliedFeedback}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setReviewingSuggestion(null)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeApplySuggestions}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <Check size={14} />
                <span>Confirm & Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARE EDITIONS MODAL */}
      {showCompareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '840px',
              width: '100%',
              backgroundColor: 'var(--card-surface)',
              borderRadius: '20px',
              border: '1px solid var(--border-highlight)',
              padding: '28px',
              boxShadow: 'var(--shadow-card)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                  Compare FLOCARD Editions
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Genuine physical specifications, finishes, and NFC hardware.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {['purple', 'gold', 'platinum'].map((key) => {
                const ed = EDITIONS[key];
                return (
                  <div
                    key={key}
                    style={{
                      backgroundColor: 'var(--elevated-surface)',
                      borderRadius: '14px',
                      border: `1px solid ${ed.accentColor}44`,
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: ed.accentColor }}>
                        {ed.badge}
                      </span>
                      <h4 style={{ margin: '4px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {ed.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {ed.tagline}
                      </p>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div><strong>Material:</strong> {ed.specs.material}</div>
                      <div><strong>Finish:</strong> {ed.specs.finish}</div>
                      <div><strong>Chip:</strong> {ed.specs.chip}</div>
                      <div><strong>Memory:</strong> {ed.specs.capacity}</div>
                      <div><strong>Durability:</strong> {ed.specs.durability}</div>
                    </div>

                    <a
                      href={`/designer?edition=${key}`}
                      className="btn btn-outline btn-xs"
                      style={{ marginTop: 'auto', justifyContent: 'center', borderColor: `${ed.accentColor}66`, color: ed.accentColor }}
                    >
                      <span>Customize {ed.name}</span>
                      <ArrowRight size={12} />
                    </a>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="btn btn-secondary btn-sm"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
