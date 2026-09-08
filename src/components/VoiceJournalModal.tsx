import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Square,
  AlertCircle,
  Loader2,
  Brain,
  Lightbulb,
  FileText,
  Heart,
  Save,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { JournalEntry, JournalMessage, ReflectionMode } from '../types';
import { floatTo16BitPCM, arrayBufferToBase64, GaplessAudioPlayer } from '../lib/audioLive';
import { monumentSound } from '../lib/monumentSound';
import { MonumentRealmTheme, getRealmTheme } from '../lib/realmTheme';

interface VoiceJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSaveVoiceEntry: (entry: JournalEntry) => Promise<void>;
  monumentTheme?: MonumentRealmTheme;
}

export const VoiceJournalModal: React.FC<VoiceJournalModalProps> = ({
  isOpen,
  onClose,
  userId,
  onSaveVoiceEntry,
  monumentTheme = 'rose',
}) => {
  const theme = getRealmTheme(monumentTheme);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const isMicMutedRef = useRef(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>('insight');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Status: 'idle' | 'listening' | 'gemini_speaking'
  const [liveStatus, setLiveStatus] = useState<'idle' | 'listening' | 'gemini_speaking'>('idle');
  const [micActivity, setMicActivity] = useState(false);

  // Conversation turns
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [currentUserSpeech, setCurrentUserSpeech] = useState('');
  const [currentGeminiSpeech, setCurrentGeminiSpeech] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Audio & WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playerRef = useRef<GaplessAudioPlayer | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Gapless Audio Player for 24kHz model output
  useEffect(() => {
    playerRef.current = new GaplessAudioPlayer();
    return () => {
      playerRef.current?.close();
    };
  }, []);

  // Auto-scroll chat transcript smoothly
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentUserSpeech, currentGeminiSpeech]);

  // Start Live Session
  const startSession = async () => {
    setErrorMsg(null);
    setSaveSuccessMsg(null);
    setIsConnecting(true);

    try {
      // Unlock 24kHz playback audio context on user gesture
      await playerRef.current?.resume();

      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup WebSocket connection to /api/live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setLiveStatus('listening');

        // Initial setup handshake
        ws.send(
          JSON.stringify({
            type: 'setup',
            reflectionMode,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setIsConnected(true);
            setIsConnecting(false);
            setLiveStatus('listening');
          } else if (data.type === 'audio' && data.audio) {
            setLiveStatus('gemini_speaking');
            playerRef.current?.playChunk(data.audio);
          } else if (data.type === 'interrupted') {
            playerRef.current?.stopAndClear();
            setLiveStatus('listening');
          } else if (data.type === 'model_transcript' && data.text) {
            setCurrentGeminiSpeech((prev) => (prev ? prev + ' ' + data.text : data.text));
          } else if (data.type === 'turn_complete') {
            setLiveStatus('listening');
            setCurrentGeminiSpeech((prev) => {
              if (prev.trim()) {
                setMessages((msgs) => [
                  ...msgs,
                  {
                    id: `msg_${Date.now()}_gemini`,
                    sender: 'gemini',
                    text: prev.trim(),
                    timestamp: new Date().toISOString(),
                    modelUsed: 'gemini-3.1-flash-live-preview',
                  },
                ]);
              }
              return '';
            });
          } else if (data.type === 'error') {
            setErrorMsg(data.error || 'Live conversation error');
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setErrorMsg('Live audio connection error. Verify network and try again.');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setLiveStatus('idle');
      };

      // 3. Audio Pipeline setup (Record 16kHz PCM chunks)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      // Buffer size: 2048 samples = ~128ms chunks
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isMicMutedRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Simple activity check
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setMicActivity(rms > 0.015);

        const pcm16 = floatTo16BitPCM(inputData);
        const base64Audio = arrayBufferToBase64(pcm16);

        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio,
          })
        );
      };

      sourceNode.connect(processor);
      processor.connect(audioCtx.destination);

      // 4. Client-side speech recognition for visual transcript feedback
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg_${Date.now()}_user`,
                sender: 'user',
                text: final.trim(),
                timestamp: new Date().toISOString(),
              },
            ]);
            setCurrentUserSpeech('');
          } else {
            setCurrentUserSpeech(interim);
          }
        };

        recognition.onerror = () => {
          // Ignore SpeechRecognition failures since primary audio goes via WebSocket
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      console.error('Failed to start live session:', err);
      setErrorMsg(
        err?.message || 'Microphone access denied. Please grant permission in browser settings.'
      );
      setIsConnecting(false);
      stopSession();
    }
  };

  // Stop Live Session
  const stopSession = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    playerRef.current?.stopAndClear();

    setIsConnected(false);
    setIsConnecting(false);
    setLiveStatus('idle');
  };

  // Close Modal Handler
  const handleClose = () => {
    stopSession();
    onClose();
  };

  // Save Voice Entry to Firestore
  const [quickInputText, setQuickInputText] = useState('');

  const handleSaveToJournal = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    const compiledMessages: JournalMessage[] = [...messages];
    if (currentUserSpeech.trim()) {
      compiledMessages.push({
        id: `msg_${Date.now()}_user_final`,
        sender: 'user',
        text: currentUserSpeech.trim(),
        timestamp: new Date().toISOString(),
      });
    }
    if (currentGeminiSpeech.trim()) {
      compiledMessages.push({
        id: `msg_${Date.now()}_gemini_final`,
        sender: 'gemini',
        text: currentGeminiSpeech.trim(),
        timestamp: new Date().toISOString(),
        modelUsed: 'gemini-3.1-flash-live-preview',
      });
    }

    // Ensure there is at least a meaningful initial reflective message
    if (compiledMessages.length === 0) {
      compiledMessages.push({
        id: `msg_${Date.now()}_user_init`,
        sender: 'user',
        text: 'Voice reflection session recorded with Gemini Voice Companion.',
        timestamp: new Date().toISOString(),
      });
      compiledMessages.push({
        id: `msg_${Date.now() + 1}_gemini_init`,
        sender: 'gemini',
        text: 'Your voice reflection has been recorded and saved. You can continue adding thoughts or ask Gemini for insights.',
        timestamp: new Date().toISOString(),
        modelUsed: 'gemini-3.1-flash-live-preview',
      });
    }

    const newId = `voice_entry_${Date.now()}`;
    const newVoiceEntry: JournalEntry = {
      id: newId,
      userId,
      title: `Voice Reflection on ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: compiledMessages,
      tags: ['Voice Journal', 'Live Voice', reflectionMode],
    };

    try {
      await onSaveVoiceEntry(newVoiceEntry);
      monumentSound.playHarmonicResolve();
      setSaveSuccessMsg('Voice journal saved to your reflections!');
      setTimeout(() => {
        stopSession();
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Failed to save voice journal:', err);
      setErrorMsg(err?.message || 'Failed to save voice journal to Firestore. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Mute Mic
  const handleToggleMic = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      isMicMutedRef.current = next;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  };

  // Send a text prompt over Live API or add to messages
  const sendTextMessage = (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_user`,
        sender: 'user',
        text: clean,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'text',
            text: clean,
          })
        );
      } catch (err) {
        console.warn('Could not send text over websocket:', err);
      }
    }
  };

  const handleQuickSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInputText.trim()) {
      sendTextMessage(quickInputText);
      setQuickInputText('');
    }
  };

  // Toggle Mute Speaker
  const handleToggleSpeaker = () => {
    setIsSpeakerMuted((prev) => {
      const next = !prev;
      if (playerRef.current) {
        playerRef.current.setMuted(next);
      }
      return next;
    });
  };

  // Interrupt Gemini Playback immediately
  const handleInterrupt = () => {
    playerRef.current?.stopAndClear();
    setLiveStatus('listening');
    try {
      wsRef.current?.send(JSON.stringify({ type: 'interrupt' }));
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-journal-modal"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-md p-3 sm:p-5 flex items-center justify-center transition-all animate-fadeIn"
    >
      <div className={`${theme.cardBg} ${theme.textPrimary} border ${theme.cardBorder} rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden relative backdrop-blur-3xl`}>
        {/* Soft Ambient Backlight */}
        <div className="absolute top-0 right-1/4 w-72 h-40 bg-white/20 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-72 h-40 bg-white/15 blur-3xl pointer-events-none rounded-full" />

        {/* Minimal Clean Header */}
        <div className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b ${theme.cardBorder} relative z-10 shrink-0 bg-white/40`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full ${theme.accentIconBg} border ${theme.accentIconBorder} ${theme.accentIconColor} flex items-center justify-center shrink-0`}>
              <Radio className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-serif font-semibold ${theme.textPrimary} tracking-tight`}>
                  Voice Journal
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isConnected
                      ? liveStatus === 'gemini_speaking'
                        ? `${theme.accentIconBg} ${theme.accentIconColor} border ${theme.accentIconBorder}`
                        : `${theme.accentIconBg} ${theme.textPrimary} border ${theme.accentIconBorder}`
                      : `${theme.cardBg} ${theme.textSecondary} border ${theme.cardBorder}`
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-stone-300'
                    }`}
                  />
                  <span>
                    {isConnecting
                      ? 'Connecting...'
                      : isConnected
                      ? liveStatus === 'gemini_speaking'
                        ? 'Gemini Speaking'
                        : 'Live Listening'
                      : 'Ready'}
                  </span>
                </span>
              </div>
              <p className={`text-xs ${theme.textSecondary} font-sans truncate`}>
                Converse naturally with Gemini in real time.
              </p>
            </div>
          </div>

          <button
            id="close-voice-modal-btn"
            type="button"
            onClick={handleClose}
            className={`p-2 rounded-full ${theme.textMuted} hover:${theme.textPrimary} transition-colors cursor-pointer shrink-0`}
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="px-5 py-2.5 bg-rose-100 border-b border-rose-300 text-rose-900 text-xs flex items-center gap-2 relative z-10 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}
        {saveSuccessMsg && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 relative z-10 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{saveSuccessMsg}</span>
          </div>
        )}

        {/* Minimalist Theme Pills */}
        <div className={`px-5 sm:px-6 py-2.5 bg-white/30 border-b ${theme.cardBorder} flex items-center justify-between gap-2 relative z-10 shrink-0 overflow-x-auto no-scrollbar`}>
          <span className={`text-xs ${theme.textSecondary} font-medium shrink-0`}>Inquiry Lens:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'insight', label: 'Deep Insight', icon: Brain },
                { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
                { id: 'summary', label: 'Synthesis', icon: FileText },
                { id: 'compassion', label: 'Compassion', icon: Heart },
              ] as const
            ).map((mode) => {
              const Icon = mode.icon;
              const isSelected = reflectionMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setReflectionMode(mode.id)}
                  disabled={isConnected}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? `${theme.primaryBtn} text-white shadow-xs`
                      : `${theme.textPrimary} hover:bg-white/60 border border-transparent`
                  } ${isConnected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice Visualizer Orb Centerpiece */}
        <div className="py-5 sm:py-6 px-6 flex flex-col items-center justify-center relative z-10 shrink-0">
          <div className="relative flex items-center justify-center my-1">
            {/* Concentric sound wave pulses */}
            <div
              className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
                liveStatus === 'gemini_speaking'
                  ? 'w-28 h-28 bg-white/40 scale-125 animate-pulse'
                  : liveStatus === 'listening'
                  ? micActivity
                    ? 'w-28 h-28 bg-white/50 scale-125 animate-ping opacity-60'
                    : 'w-24 h-24 bg-white/30 scale-110'
                  : 'w-20 h-20 bg-white/20'
              }`}
            />

            {/* Central Animated Orb */}
            <div
              className={`relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                liveStatus === 'gemini_speaking'
                  ? `${theme.primaryBtn} text-white ring-4 ring-white/50 scale-105`
                  : liveStatus === 'listening'
                  ? micActivity
                    ? `${theme.primaryBtn} text-white ring-4 ring-white/50 scale-105`
                    : `${theme.primaryBtn} text-white ring-2 ring-white/30`
                  : `bg-white border ${theme.cardBorder} ${theme.accentIconColor} shadow-xs`
              }`}
            >
              {liveStatus === 'gemini_speaking' ? (
                <Sparkles className="w-7 h-7 animate-spin text-white" />
              ) : liveStatus === 'listening' ? (
                <Mic
                  className={`w-7 h-7 text-white transition-transform ${
                    micActivity ? 'scale-115' : ''
                  }`}
                />
              ) : (
                <Mic className={`w-6 h-6 ${theme.accentIconColor}`} />
              )}
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className={`text-xs sm:text-sm font-medium ${theme.textPrimary}`}>
              {isConnecting
                ? 'Connecting to live Gemini voice stream...'
                : liveStatus === 'gemini_speaking'
                ? 'Gemini is reflecting out loud...'
                : liveStatus === 'listening'
                ? isMicMuted
                  ? 'Microphone is muted'
                  : micActivity
                  ? 'Voice detected — streaming to Gemini...'
                  : 'Listening... speak freely'
                : 'Ready to converse. Click Start to begin.'}
            </p>
          </div>
        </div>

        {/* Quick Suggested Starters */}
        {isConnected && (
          <div className={`px-5 sm:px-6 py-1.5 bg-white/40 border-t border-b ${theme.cardBorder} flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs`}>
            <span className={`${theme.accentIconColor} font-medium text-[11px] shrink-0`}>Prompts:</span>
            <button
              type="button"
              onClick={() =>
                sendTextMessage('Hello Gemini! How are you doing today? Please introduce yourself.')
              }
              className={`px-2.5 py-1 rounded-full bg-white hover:bg-white/80 ${theme.textPrimary} border ${theme.cardBorder} transition-colors whitespace-nowrap cursor-pointer shrink-0 text-[11px]`}
            >
              ✨ "Introduce yourself"
            </button>
            <button
              type="button"
              onClick={() =>
                sendTextMessage('I had a really busy day today. Can you ask me how I am feeling?')
              }
              className={`px-2.5 py-1 rounded-full bg-white hover:bg-white/80 ${theme.textPrimary} border ${theme.cardBorder} transition-colors whitespace-nowrap cursor-pointer shrink-0 text-[11px]`}
            >
              🌸 "I had a busy day..."
            </button>
            <button
              type="button"
              onClick={() =>
                sendTextMessage('What is one gentle reflection question you have for me right now?')
              }
              className={`px-2.5 py-1 rounded-full bg-white hover:bg-white/80 ${theme.textPrimary} border ${theme.cardBorder} transition-colors whitespace-nowrap cursor-pointer shrink-0 text-[11px]`}
            >
              💭 "Reflection question"
            </button>
          </div>
        )}

        {/* Transcript Feed */}
        <div
          id="voice-transcript-feed"
          className={`flex-1 min-h-[110px] max-h-[220px] sm:max-h-[260px] overflow-y-auto no-scrollbar px-5 sm:px-6 py-3 space-y-2.5 bg-white/20 border-t border-b ${theme.cardBorder} relative z-10`}
        >
          {messages.length === 0 && !currentUserSpeech && !currentGeminiSpeech && (
            <div className={`h-full flex flex-col items-center justify-center text-center ${theme.textMuted} py-6`}>
              <p className={`text-xs ${theme.textSecondary}`}>
                Spoken reflections and Gemini replies will appear here in real time.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? `${theme.accentIconBg} ${theme.textPrimary} border ${theme.accentIconBorder}`
                    : `bg-white ${theme.textPrimary} border ${theme.cardBorder}`
                }`}
              >
                <div className={`flex items-center gap-1.5 mb-0.5 text-[10px] ${theme.accentIconColor} font-mono`}>
                  {msg.sender === 'user' ? (
                    <>
                      <Mic className="w-2.5 h-2.5" />
                      <span>You (Voice)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Gemini</span>
                    </>
                  )}
                </div>
                <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Real-time In-progress user speech */}
          {currentUserSpeech && (
            <div className="flex justify-end">
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm ${theme.accentIconBg} ${theme.textPrimary} border border-dashed ${theme.accentIconBorder} animate-pulse font-sans`}>
                <div className={`flex items-center gap-1.5 mb-0.5 text-[10px] ${theme.accentIconColor} font-mono`}>
                  <Mic className="w-2.5 h-2.5" />
                  <span>Transcribing...</span>
                </div>
                <p>{currentUserSpeech}</p>
              </div>
            </div>
          )}

          {/* Real-time In-progress gemini speech */}
          {currentGeminiSpeech && (
            <div className="flex justify-start">
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm bg-white/90 ${theme.textPrimary} border border-dashed ${theme.cardBorder} animate-pulse font-serif`}>
                <div className={`flex items-center gap-1.5 mb-0.5 text-[10px] ${theme.accentIconColor} font-mono`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Gemini speaking...</span>
                </div>
                <p>{currentGeminiSpeech}</p>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Quick Message Input Form inside Modal */}
        <form
          onSubmit={handleQuickSend}
          className={`px-5 sm:px-6 py-2.5 bg-white/40 border-b ${theme.cardBorder} flex items-center gap-2 relative z-10 shrink-0`}
        >
          <input
            id="voice-modal-text-input"
            type="text"
            value={quickInputText}
            onChange={(e) => setQuickInputText(e.target.value)}
            placeholder="Type a reflection note or message to Gemini..."
            className={`flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-1 focus:ring-current ${theme.textPrimary} placeholder:text-stone-400 shadow-2xs font-sans`}
          />
          <button
            id="voice-modal-send-btn"
            type="submit"
            disabled={!quickInputText.trim()}
            className={`px-3.5 py-2 rounded-xl ${theme.primaryBtn} disabled:opacity-40 text-white text-xs font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0`}
          >
            <span>Add</span>
          </button>
        </form>

        {/* Clean Footer Controls */}
        <div className="px-5 sm:px-6 py-3.5 bg-white/60 flex items-center justify-between gap-3 relative z-10 shrink-0">
          {/* Audio Toggles & Interruption */}
          <div className="flex items-center gap-1.5">
            {isConnected && (
              <>
                <button
                  id="mute-mic-btn"
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isMicMuted
                      ? `${theme.accentIconBg} ${theme.accentIconBorder} ${theme.accentIconColor}`
                      : `bg-white ${theme.cardBorder} ${theme.textPrimary} hover:bg-stone-50`
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className={`w-4 h-4 ${theme.accentIconColor}`} />}
                </button>

                <button
                  id="mute-speaker-btn"
                  type="button"
                  onClick={handleToggleSpeaker}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isSpeakerMuted
                      ? `${theme.accentIconBg} ${theme.accentIconBorder} ${theme.accentIconColor}`
                      : `bg-white ${theme.cardBorder} ${theme.textPrimary} hover:bg-stone-50`
                  }`}
                  title={isSpeakerMuted ? 'Unmute Gemini Audio' : 'Mute Gemini Audio'}
                >
                  {isSpeakerMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className={`w-4 h-4 ${theme.accentIconColor}`} />}
                </button>

                {liveStatus === 'gemini_speaking' && (
                  <button
                    id="interrupt-gemini-btn"
                    type="button"
                    onClick={handleInterrupt}
                    className={`px-2.5 py-2 rounded-xl bg-white border ${theme.cardBorder} ${theme.textPrimary} hover:bg-stone-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer`}
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Interrupt</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
            {!isConnected ? (
              <button
                id="start-voice-session-btn"
                type="button"
                onClick={startSession}
                disabled={isConnecting}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${theme.primaryBtn} text-white text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap border border-white/30`}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-white" />
                    <span>Start Voice Journal</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="stop-voice-session-btn"
                type="button"
                onClick={stopSession}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 ${theme.textPrimary} text-xs font-medium border ${theme.cardBorder} transition-all cursor-pointer whitespace-nowrap`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Pause Voice</span>
              </button>
            )}

            {/* Permanent "Save Voice Journal Entry" Button */}
            <button
              id="save-voice-journal-btn"
              type="button"
              onClick={handleSaveToJournal}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${theme.primaryBtn} active:scale-95 text-white shadow-sm cursor-pointer border border-white/30 disabled:opacity-60`}
              title="Save this voice reflection and synthesis to your journal"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>
                    Save Voice Journal Entry
                    {messages.length > 0 ? ` (${messages.length})` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
