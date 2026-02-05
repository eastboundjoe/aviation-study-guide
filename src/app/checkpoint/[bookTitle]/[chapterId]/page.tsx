'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import checkpointsData from '@/data/checkpoints.json';
import booksData from '@/data/books.json';
import { useProgress } from '@/hooks/useProgress';
import { Mic, MicOff, CheckCircle2, ChevronLeft, Volume2, VolumeX, Info, RefreshCw, Trophy, Sparkles, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { analyzeRecall } from '@/app/actions/study-partner';

export default function CheckpointPage() {
  const params = useParams();
  const router = useRouter();
  const { completeCheckpoint } = useProgress();
  
  const bookTitle = decodeURIComponent(params.bookTitle as string);
  const chapterId = parseInt(params.chapterId as string);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [keyPoints, setKeyPoints] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiClue, setAiClue] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const fullTranscriptRef = useRef('');
  const interimRef = useRef('');

  const checkpoint = checkpointsData.find(c => c.bookTitle === bookTitle && c.chapterId === chapterId);
  const book = booksData.find(b => b.title === bookTitle);
  const chapter = book?.chapters.find(c => c.id === chapterId);

  useEffect(() => {
    if (checkpoint) {
      setKeyPoints(checkpoint.keyPoints.map(kp => ({ ...kp, checked: false })));
    }

    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            fullTranscriptRef.current += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }
        
        interimRef.current = currentInterim;
        setTranscript(fullTranscriptRef.current);
        setInterimTranscript(currentInterim);
        checkKeywords(fullTranscriptRef.current + currentInterim);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
        } else {
           setIsRecording(false);
        }
      };

      rec.onend = () => {
        if (isRecording) {
           rec.start();
        }
      };

      setRecognition(rec);
    }
  }, [checkpoint]);

  const speakResponse = (text: string) => {
    if (isMuted || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const instructorVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Male')) || voices[0];
    if (instructorVoice) utterance.voice = instructorVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const checkKeywords = (text: string) => {
    const lowerText = text.toLowerCase();
    setKeyPoints(prev => prev.map(kp => {
      if (kp.checked) return kp;
      const found = kp.keywords.some((word: string) => lowerText.includes(word.toLowerCase()));
      return found ? { ...kp, checked: true } : kp;
    }));
  };

  const askStudyPartner = async () => {
    const finalTranscript = (fullTranscriptRef.current + interimRef.current).trim();
    if (finalTranscript.length < 10) {
      const msg = "I didn't hear enough to give a summary. Try speaking a bit more.";
      setAiFeedback(msg);
      speakResponse(msg);
      return;
    }
    
    setIsAnalyzing(true);
    
    const result = await analyzeRecall({
      chapterTitle: chapter?.title || '',
      bookTitle: bookTitle,
      keyPoints: checkpoint?.keyPoints.map(kp => ({ text: kp.text, id: kp.id })) || [],
      transcript: finalTranscript
    });

    if (result) {
      setAiFeedback(result.feedback);
      setAiClue(result.clue);
      speakResponse(`${result.feedback}. ${result.clue}`);
      setKeyPoints(prev => prev.map(kp => ({
        ...kp,
        checked: result.coveredPointIds.includes(kp.id) || kp.checked
      })));
    }
    setIsAnalyzing(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      setTimeout(askStudyPartner, 800);
    } else {
      fullTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setAiFeedback(null);
      setAiClue(null);
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleComplete = () => {
    const allChecked = keyPoints.every(kp => kp.checked);
    completeCheckpoint(bookTitle, chapterId, allChecked);
    setIsFinished(true);
  };

  if (!checkpoint) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Checkpoint not found for this chapter.</h2>
        <p className="text-slate-600 mb-8">We're still generating key points for some books.</p>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Go Back</Link>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <Trophy size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Knowledge Captured!</h2>
          <p className="text-slate-600 mb-6">You've successfully verbalized the key points for Chapter {chapterId}.</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            <ChevronLeft size={20} /> Back
          </Link>
          <div className="text-right flex items-center gap-4">
            <button 
              onClick={() => {
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                if (newMuted) window.speechSynthesis.cancel();
              }}
              className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'}`}
              title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bookTitle}</p>
              <h1 className="text-lg font-bold text-slate-800">Chapter {chapterId}: {chapter?.title}</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Side */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="text-blue-500" size={20} /> Verbal Recall
                </h2>
                {isRecording && (
                  <span className="flex items-center gap-2 text-rose-500 text-xs font-bold animate-pulse">
                    <span className="w-2 h-2 bg-rose-500 rounded-full"></span> RECORDING
                  </span>
                )}
              </div>

              <p className="text-slate-500 text-sm mb-8 leading-relaxed italic">
                "Explain the chapter out loud as if you were teaching it to a friend. 
                Include the core rules and regulations mentioned in your reading."
              </p>

              <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 overflow-y-auto mb-8">
                {transcript || interimTranscript ? (
                  <div className="leading-relaxed">
                    <span className="text-slate-700">{transcript}</span>
                    <span className="text-slate-400 italic">{interimTranscript}</span>
                  </div>
                ) : (
                  <p className="text-slate-300 text-center py-12 italic">Your live transcript will appear here...</p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={toggleRecording}
                  disabled={isAnalyzing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110' 
                    : isAnalyzing 
                      ? 'bg-slate-200 text-slate-400 cursor-wait'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? <MicOff size={32} /> : isAnalyzing ? <RefreshCw className="animate-spin" size={32} /> : <Mic size={32} />}
                </button>
              </div>
            </div>

            {/* AI Partner Response */}
            {(aiFeedback || aiClue || isAnalyzing) && (
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles size={20} className="text-amber-300" />
                  </div>
                  <h3 className="font-bold text-lg">Gemini Study Partner</h3>
                </div>
                
                {isAnalyzing ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                    <p className="text-sm font-medium opacity-80">Analyzing your explanation...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-indigo-100 italic">"{aiFeedback}"</p>
                    {aiClue && (
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                        <p className="text-xs uppercase tracking-widest font-bold text-amber-300 mb-2">Instructor Clue:</p>
                        <p className="text-base font-medium leading-relaxed">{aiClue}</p>
                      </div>
                    )}
                    <button 
                      onClick={toggleRecording}
                      className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-white hover:text-amber-300 transition-colors"
                    >
                      <Mic size={14} /> Resume explaining to answer the clue
                    </button>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
            >
              <Info size={16} /> {showSummary ? 'Hide' : 'Need a hint? Show'} Chapter Summary
            </button>
            
            {showSummary && (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-800 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2">
                {checkpoint.summary}
              </div>
            )}

            <div className="pt-12 border-t border-slate-100">
               <button 
                 onClick={() => setShowDebug(!showDebug)}
                 className="text-[10px] text-slate-300 hover:text-slate-500 uppercase tracking-widest font-bold"
               >
                 {showDebug ? 'Hide' : 'Show'} Debug Info
               </button>
               {showDebug && (
                 <div className="mt-4 p-4 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto">
                   <p className="mb-2">// SENT TO GEMINI:</p>
                   <p className="opacity-80">"{fullTranscriptRef.current + interimRef.current}"</p>
                 </div>
               )}
            </div>
          </div>

          {/* Key Points Side */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} /> Target Key Points
            </h2>
            
            <div className="space-y-4 mb-12">
              {keyPoints.map((kp) => (
                <div 
                  key={kp.id} 
                  className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-start gap-3 ${
                    kp.checked 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className={`mt-1 shrink-0 ${kp.checked ? 'text-emerald-500' : 'text-slate-200'}`}>
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-sm font-medium leading-snug">{kp.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isRecording}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                keyPoints.every(kp => kp.checked)
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {keyPoints.every(kp => kp.checked) ? 'Complete Checkpoint' : 'Cover all Key Points to Finish'}
            </button>
            
            {keyPoints.every(kp => kp.checked) && (
              <p className="text-center text-xs text-emerald-600 font-bold mt-4 uppercase tracking-widest animate-bounce">
                Mastery Achieved!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}