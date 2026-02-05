'use client';

import { useState } from 'react';
import booksData from '@/data/books.json';
import { useProgress } from '@/hooks/useProgress';
import { Book, Chapter } from '@/types';
import { BookOpen, CheckCircle2, Clock, PlayCircle, Trophy, Calendar, Zap, HelpCircle, MessageSquare, Layout, ChevronRight } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import studyTips from '@/data/study-tips.json';
import checkpointsData from '@/data/checkpoints.json';

export default function Dashboard() {
  const router = useRouter();
  const { progress } = useProgress();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const startMixedReview = () => {
    const randomIdx = Math.floor(Math.random() * checkpointsData.length);
    const checkpoint = checkpointsData[randomIdx];
    router.push(`/checkpoint/${encodeURIComponent(checkpoint.bookTitle)}/${checkpoint.chapterId}`);
  };

  const stats = {
    completed: Object.values(progress.completedChapters).filter(Boolean).length,
    dueToday: Object.entries(progress.reviewDates).filter(([key, date]) => {
        const d = parseISO(date);
        return isToday(d) || d < new Date();
    }).length,
    mastered: Object.values(progress.reviewLevels).filter(l => l === 5).length
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Aviation Study Guide</h1>
        <p className="text-slate-600">Master your FAA handbooks with spaced repetition.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          label="Chapters Completed" 
          value={stats.completed} 
        />
        <StatCard 
          icon={<Calendar className="text-blue-500" />} 
          label="Reviews Due Today" 
          value={stats.dueToday} 
        />
        <StatCard 
          icon={<Trophy className="text-amber-500" />} 
          label="Chapters Mastered" 
          value={stats.mastered} 
        />
      </div>

      {/* Interleaving / Mixed Practice Call to Action */}
      <div className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-200">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className="text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Advanced Study</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Masterclass: Interleaved Practice</h2>
          <p className="text-blue-50 mb-6 leading-relaxed">
            Mixing different subjects in one session forces your brain to work harder, 
            significantly improving long-term retention. Try a mixed quiz from all your handbooks.
          </p>
          <button 
            onClick={startMixedReview}
            className="px-8 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <PlayCircle size={20} /> Start Mixed Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Study Schedule Section */}
        <div className="lg:col-span-3">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={24} className="text-blue-500" /> Study Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                <ScheduleColumn 
                    title="2nd Day Review" 
                    subtitle="1 Day After Study"
                    level={1}
                    progress={progress}
                />
                <ScheduleColumn 
                    title="3rd Day Review" 
                    subtitle="3 Days After Study"
                    level={2}
                    progress={progress}
                />
                <ScheduleColumn 
                    title="Weekly Review" 
                    subtitle="7 Days After Study"
                    level={3}
                    progress={progress}
                />
                <ScheduleColumn 
                    title="Monthly Review" 
                    subtitle="30 Days After Study"
                    level={4}
                    progress={progress}
                />
            </div>
        </div>

        {/* Books List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen size={24} /> Handbooks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booksData.map((book: any) => (
              <button
                key={book.title}
                onClick={() => setSelectedBook(book)}
                className={`text-left p-6 rounded-xl border transition-all ${
                  selectedBook?.title === book.title 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-3">{book.emoji}</div>
                <h3 className="font-bold text-slate-900 mb-1">{book.title}</h3>
                <p className="text-sm text-slate-500">{book.chapters.length} Chapters</p>
                <div className="mt-4 bg-slate-100 rounded-full h-2 w-full">
                   <div 
                    className="bg-emerald-500 h-full rounded-full transition-all" 
                    style={{ width: `${(book.chapters.filter((c: any) => progress.completedChapters[`${book.title}-${c.id}`]).length / book.chapters.length) * 100}%` }}
                   />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Book Details / Chapter List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-fit sticky top-6">
          {selectedBook ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{selectedBook.emoji}</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedBook.title}</h2>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {selectedBook.chapters.map((chapter: any) => {
                  const isCompleted = progress.completedChapters[`${selectedBook.title}-${chapter.id}`];
                  const level = progress.reviewLevels[`${selectedBook.title}-${chapter.id}`] || 0;
                  const reviewDate = progress.reviewDates[`${selectedBook.title}-${chapter.id}`];
                  
                  // Color coding based on Spaced Repetition / Retrospective Timetable
                  // 0: Red (Needs study), 1-2: Amber (Getting there), 3-4: Green (Good), 5: Gold (Mastered)
                  const colors = [
                    'border-rose-200 bg-rose-50',
                    'border-amber-200 bg-amber-50',
                    'border-amber-200 bg-amber-50',
                    'border-emerald-200 bg-emerald-50',
                    'border-emerald-200 bg-emerald-50',
                    'border-amber-400 bg-amber-50 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                  ];

                  return (
                    <div 
                      key={chapter.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isCompleted ? colors[level] : 'bg-slate-50 border-slate-100 opacity-80'}`}
                    >
                      <div className="flex-1 pr-4">
                        <p className={`text-sm font-medium leading-tight ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                          <span className="opacity-50 mr-2">{chapter.id}.</span>
                          {chapter.title}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {isCompleted ? (
                            <>
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                                Level {level}
                              </span>
                              {reviewDate && (
                                <span className="text-[9px] uppercase tracking-wider font-bold text-blue-600">
                                  Next: {format(parseISO(reviewDate), 'MMM d')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 italic">
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                      <Link 
                        href={`/checkpoint/${encodeURIComponent(selectedBook.title)}/${chapter.id}`}
                        className="p-2 text-blue-600 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-blue-200"
                      >
                        <PlayCircle size={24} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a handbook to see its chapters</p>
            </div>
          )}
        </div>
      </div>

      {/* Study Methodology Section */}
      <section className="mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <Zap size={24} className="text-amber-500" /> The Study System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyTips.map((tip) => (
            <div key={tip.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg text-blue-600">
                  {tip.title === 'Active Recall' && <Zap size={20} />}
                  {tip.title === 'Spaced Repetition' && <Clock size={20} />}
                  {tip.title === 'Retrospective Timetable' && <Calendar size={20} />}
                  {tip.title === 'Big Picture (Why is this bad?)' && <HelpCircle size={20} />}
                  {tip.title === 'Verbal Recall' && <MessageSquare size={20} />}
                  {tip.title === 'Spatial Memory' && <Layout size={20} />}
                </div>
                <h3 className="font-bold text-slate-900">{tip.title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {tip.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source: {tip.source}</span>
                <a 
                  href={tip.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Watch Tip <ChevronRight size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {

  return (

    <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">

      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>

      <div>

        <p className="text-sm text-slate-500 font-medium">{label}</p>

        <p className="text-2xl font-bold text-slate-900">{value}</p>

      </div>

    </div>

  );

}



function ScheduleColumn({ title, subtitle, level, progress }: { title: string, subtitle: string, level: number, progress: any }) {

    const dueChapters = Object.entries(progress.reviewLevels)

        .filter(([key, l]) => l === level)

        .filter(([key]) => {

            const date = progress.reviewDates[key];

            return date && (parseISO(date) <= new Date() || isToday(parseISO(date)));

        });



    return (

        <div className="bg-white rounded-xl border border-slate-200 p-5">

            <h3 className="font-bold text-slate-900 leading-tight">{title}</h3>

            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">{subtitle}</p>

            

            <div className="space-y-2">

                {dueChapters.length > 0 ? (

                    dueChapters.map(([key]) => {

                        const [book, chapter] = key.split('-');

                                                return (

                                                    <Link 

                                                        key={key}

                                                        href={`/checkpoint/${encodeURIComponent(book)}/${chapter}`}

                                                        className="block p-2 rounded bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 border border-blue-100"

                                                    >

                                                        {book.substring(0, 15)}... - Ch {chapter}

                                                    </Link>

                                                );

                        

                    })

                ) : (

                    <p className="text-xs text-slate-400 italic py-2">Nothing due</p>

                )}

            </div>

        </div>

    );

}
