'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import checkpointsData from '@/data/checkpoints.json';
import booksData from '@/data/books.json';
import { useProgress } from '@/hooks/useProgress';
import { Mic, MicOff, CheckCircle2, ChevronLeft, Volume2, Info, RefreshCw, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function CheckpointPage() {
  const params = useParams();
  const router = useRouter();
  const { markChapterComplete, updateReviewLevel } = useProgress();
  
  const bookTitle = decodeURIComponent(params.bookTitle as string);
  const chapterId = parseInt(params.chapterId as string);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [keyPoints, setKeyPoints] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const fullTranscriptRef = useRef('');

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
        
        const combined = fullTranscriptRef.current + currentInterim;
        setTranscript(fullTranscriptRef.current);
        setInterimTranscript(currentInterim);
        checkKeywords(combined);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
           // Keep going if it's just silence
        } else {
           setIsRecording(false);
        }
      };

      rec.onend = () => {
        // Only stop if we explicitly called stop
        if (isRecording) {
           rec.start(); // Restart if it timed out but we want to keep recording
        }
      };

      setRecognition(rec);
    }
  }, [checkpoint]);

  const checkKeywords = (text: string) => {
    const lowerText = text.toLowerCase();
    setKeyPoints(prev => prev.map(kp => {
      if (kp.checked) return kp;
      const found = kp.keywords.some((word: string) => lowerText.includes(word.toLowerCase()));
      return found ? { ...kp, checked: true } : kp;
    }));
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      fullTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleComplete = () => {
    const allChecked = keyPoints.every(kp => kp.checked);
    markChapterComplete(bookTitle, chapterId);
    updateReviewLevel(bookTitle, chapterId, allChecked);
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
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bookTitle}</p>
            <h1 className="text-lg font-bold text-slate-800">Chapter {chapterId}: {chapter?.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recording Side */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Volume2 className="text-blue-500" size={20} /> Verbal Recall
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
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110' 
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
              </div>
            </div>

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
