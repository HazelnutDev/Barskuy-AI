import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic, MicOff, Volume2, VolumeX, Loader2, Bot, Sparkles, Headphones } from "lucide-react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AppSettings } from "../types";
import { cn } from "../lib/utils";

interface VoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({ isOpen, onClose, settings }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<"connecting" | "ready" | "speaking" | "listening">("connecting");
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<{ role: "user" | "ai", text: string }[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlaying = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, currentTranscript]);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  const startSession = async () => {
    try {
      setStatus("connecting");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: settings.systemPrompt + " You are in voice mode. Keep your responses concise and conversational.",
        },
        callbacks: {
          onopen: () => {
            setStatus("ready");
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binary = atob(base64Audio);
              const buffer = new Int16Array(binary.length / 2);
              const view = new DataView(new ArrayBuffer(binary.length));
              for (let i = 0; i < binary.length; i++) {
                view.setUint8(i, binary.charCodeAt(i));
              }
              for (let i = 0; i < buffer.length; i++) {
                buffer[i] = view.getInt16(i * 2, true);
              }
              audioQueue.current.push(buffer);
              if (!isPlaying.current) playNextInQueue();
            }
            
            // Handle Transcripts
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              const text = message.serverContent.modelTurn.parts[0].text;
              setTranscript(prev => [...prev, { role: "ai", text }]);
            }

            if (message.serverContent?.inputTranscription?.text) {
              const text = message.serverContent.inputTranscription.text;
              setCurrentTranscript(text);
            }

            if (message.serverContent?.turnComplete) {
              if (currentTranscript) {
                setTranscript(prev => [...prev, { role: "user", text: currentTranscript }]);
              }
              setCurrentTranscript("");
            }

            if (message.serverContent?.interrupted) {
              audioQueue.current = [];
              isPlaying.current = false;
              setCurrentTranscript("");
            }
          },
          onclose: () => setStatus("connecting"),
          onerror: (e) => console.error("Live API Error", e),
        },
      });
      
      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to start voice session", error);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    stopMic();
    audioQueue.current = [];
    isPlaying.current = false;
    setCurrentTranscript("");
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          sum += Math.abs(inputData[i]);
        }
        
        setVolume(sum / inputData.length);
        
        if (sessionRef.current) {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: "audio/pcm;rate=16000" }
          });
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      setIsListening(true);
    } catch (error) {
      console.error("Mic access denied", error);
    }
  };

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  const playNextInQueue = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      setStatus("listening");
      return;
    }

    isPlaying.current = true;
    setStatus("speaking");
    const buffer = audioQueue.current.shift()!;
    
    if (!audioContextRef.current) return;
    
    const audioBuffer = audioContextRef.current.createBuffer(1, buffer.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      channelData[i] = buffer[i] / 0x8000;
    }
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = playNextInQueue;
    source.start();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050608] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Futuristic Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 blur-[120px] rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/40 hover:text-white transition-all z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-4xl px-8 py-20">
            {/* AI Avatar / Visualizer */}
            <div className="flex flex-col items-center gap-6 md:gap-12">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: status === "speaking" ? [1, 1.1, 1] : 1,
                    rotate: status === "speaking" ? [0, 5, -5, 0] : 0,
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.3)] relative z-20"
                >
                  <Bot className="w-10 h-10 md:w-16 md:h-16 text-white" />
                  
                  {/* Orbital Rings */}
                  <div className="absolute inset-[-10px] md:inset-[-15px] border border-white/5 rounded-[2rem] md:rounded-[3.5rem] animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-[-20px] md:inset-[-30px] border border-white/5 rounded-[2.5rem] md:rounded-[4.5rem] animate-[spin_15s_linear_infinite_reverse]" />
                </motion.div>

                {/* Voice Waves */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: status === "speaking" ? [1, 2, 1] : 1,
                        opacity: status === "speaking" ? [0.5, 0, 0.5] : 0,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.4,
                      }}
                      className="absolute inset-0 border-2 border-blue-500/30 rounded-[2.5rem]"
                    />
                  ))}
                </div>
              </div>

              {/* Status & Info */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    status === "connecting" ? "bg-yellow-500" : "bg-green-500"
                  )} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                    {status === "connecting" ? "Menghubungkan..." : "Koneksi Aktif"}
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white">
                  {status === "connecting" && "Menyambungkan..."}
                  {status === "ready" && "Siap berbicara"}
                  {status === "speaking" && "Barskuy sedang berbicara"}
                  {status === "listening" && "Mendengarkan Anda..."}
                </h2>
              </div>
            </div>

            {/* Transcript Area */}
            <div className="w-full max-w-2xl h-48 overflow-y-auto custom-scrollbar px-4 space-y-4 mask-fade-edges">
              {transcript.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-1",
                    t.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                    {t.role === "user" ? "Anda" : "Barskuy-AI"}
                  </span>
                  <p className={cn(
                    "text-sm md:text-base font-medium leading-relaxed max-w-[80%]",
                    t.role === "user" ? "text-blue-400 text-right" : "text-white/80"
                  )}>
                    {t.text}
                  </p>
                </motion.div>
              ))}
              {currentTranscript && (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Anda</span>
                  <p className="text-sm md:text-base font-medium text-blue-400/60 text-right italic">
                    {currentTranscript}
                  </p>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Controls & Visualizer */}
            <div className="flex flex-col items-center gap-8 w-full">
              {/* Visualizer Bars */}
              <div className="flex items-end gap-1 h-16 w-full max-w-xs justify-center">
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: status === "listening" ? [4, Math.random() * 60 + 4, 4] : 
                              status === "speaking" ? [4, Math.random() * 40 + 4, 4] : 4,
                      backgroundColor: status === "speaking" ? "rgba(147, 51, 234, 0.4)" : "rgba(37, 99, 235, 0.4)"
                    }}
                    transition={{ repeat: Infinity, duration: 0.2, delay: i * 0.02 }}
                    className="w-1 rounded-full"
                  />
                ))}
              </div>

              <div className="flex items-center gap-4 md:gap-8">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "p-4 md:p-5 rounded-2xl border transition-all active:scale-90",
                    isMuted 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  )}
                >
                  {isMuted ? <MicOff className="w-5 h-5 md:w-6 h-6" /> : <Mic className="w-5 h-5 md:w-6 h-6" />}
                </button>

                <button
                  onClick={onClose}
                  className="p-6 md:p-8 bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-[0_0_50px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <button
                  className="p-5 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all active:scale-90"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <span>Encrypted Link</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>Low Latency</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>Gemini 3.1 Live</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
