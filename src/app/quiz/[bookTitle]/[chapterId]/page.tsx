'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import quizzesData from '@/data/quizzes.json';
import booksData from '@/data/books.json';
import { useProgress } from '@/hooks/useProgress';
import { CheckCircle2, XCircle, ArrowRight, Home, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { markChapterComplete, updateReviewLevel } = useProgress();
  
  const bookTitle = decodeURIComponent(params.bookTitle as string);
  const chapterId = parseInt(params.chapterId as string);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showOptions, setShowOptions] = useState(false); // For Active Recall / Verbalization

  // Find the quiz for this chapter
  const quiz = quizzesData.find(q => q.bookTitle === bookTitle && q.chapterId === chapterId);
  const book = booksData.find(b => b.title === bookTitle);
  const chapter = book?.chapters.find(c => c.id === chapterId);

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz not found for this chapter.</h2>
        <p className="text-slate-600 mb-8">We're still generating questions for some chapters.</p>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Go Back</Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIdx];

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowOptions(false); // Reset for next question
    } else {
      setIsFinished(true);
      markChapterComplete(bookTitle, chapterId);
      const passed = (score + (selectedOption === currentQuestion.correctAnswer ? 1 : 0)) / quiz.questions.length > 0.7;
      updateReviewLevel(bookTitle, chapterId, passed);
    }
  };

  if (isFinished) {
    const finalScore = score;
    const passed = finalScore / quiz.questions.length >= 0.7;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {passed ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{passed ? 'Great Job!' : 'Keep Practicing'}</h2>
          <p className="text-slate-600 mb-6">You scored {finalScore} out of {quiz.questions.length}</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={20} /> Back to Dashboard
            </button>
            <button 
              onClick={() => {
                setCurrentQuestionIdx(0);
                setScore(0);
                setIsFinished(false);
                setSelectedOption(null);
                setIsAnswered(false);
                setShowOptions(false);
              }}
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            <ChevronLeft size={20} /> Back
          </Link>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bookTitle}</p>
            <h1 className="text-lg font-bold text-slate-800">Chapter {chapterId}: {chapter?.title}</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-slate-200 rounded-full h-1.5 w-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500" 
            style={{ width: `${((currentQuestionIdx) / quiz.questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
          <p className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider">Question {currentQuestionIdx + 1} of {quiz.questions.length}</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">
            {currentQuestion.question}
          </h2>

          {!showOptions && !isAnswered ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
               <p className="text-slate-500 mb-6 font-medium italic">Try to verbalize the answer out loud before seeing the options.</p>
               <button 
                 onClick={() => setShowOptions(true)}
                 className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
               >
                 Show Options
               </button>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedOption === idx 
                      ? isAnswered 
                        ? idx === currentQuestion.correctAnswer 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-rose-500 bg-rose-50'
                        : 'border-blue-500 bg-blue-50'
                      : isAnswered && idx === currentQuestion.correctAnswer
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedOption === idx ? 'border-current' : 'border-slate-200'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium text-slate-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isAnswered && (
            <div className={`mt-8 p-4 rounded-xl ${selectedOption === currentQuestion.correctAnswer ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <p className="text-sm leading-relaxed">
                <span className="font-bold mr-2">{selectedOption === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect.'}</span>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="mt-12 flex justify-end">
            {!isAnswered ? (
              <button
                disabled={selectedOption === null || !showOptions}
                onClick={handleCheck}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-30 transition-opacity"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {currentQuestionIdx === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
