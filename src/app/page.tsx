'use client';

import { useState } from 'react';
import booksData from '@/data/books.json';
import { useProgress } from '@/hooks/useProgress';
import { Book, Chapter } from '@/types';
import { BookOpen, CheckCircle2, Clock, PlayCircle, Trophy, Calendar, Zap, HelpCircle, MessageSquare, Layout, ChevronRight, Sparkles, PenTool, LogIn, LogOut, Cloud, CloudOff } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import studyTips from '@/data/study-tips.json';
import checkpointsData from '@/data/checkpoints.json';
import { HeatmapCalendar } from '@/components/HeatmapCalendar';
import { getHeatmapData } from '@/utils/stats';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/components/auth-provider';
import { AuthModal } from '@/components/AuthModal';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { progress, syncing } = useProgress(user?.id);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const heatmapData = getHeatmapData(progress.studyHistory);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <header className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Aviation Study Guide</h1>
          <p className="text-slate-600 dark:text-slate-400">Master your FAA handbooks with spaced repetition.</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {syncing ? (
                <><Cloud size={14} className="animate-pulse text-blue-500" /> Syncing...</>
              ) : (
                <><Cloud size={14} className="text-emerald-500" /> Synced</>
              )}
            </span>
          )}
          {authLoading ? null : user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Guest mode banner */}
      {!authLoading && !user && (
        <div className="mb-8 flex items-center gap-3 px-5 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <CloudOff size={18} className="text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <button onClick={() => setAuthModalOpen(true)} className="font-semibold underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100">Sign in</button> to sync your progress across devices.
          </p>
        </div>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Study Activity Heatmap */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Study Activity</h2>
        <HeatmapCalendar data={heatmapData} />
      </div>

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
      <div className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
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

      {/* Retaining Information Video Section */}
      <div className="mb-12 space-y-8">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <PlayCircle size={24} className="text-rose-500" /> Professor Kaplan's Masterclass
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Video 1: Marginalia */}
          <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex-1 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Retention</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">The Marginalia Method</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Learn the recursive summary technique that forces your brain to engage with the 
                meaning of every paragraph.
              </p>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 mb-4">
              <iframe 
                width="100%" height="100%" 
                src="https://www.youtube.com/embed/uiNB-6SuqVA" 
                title="The Marginalia Method" 
                frameBorder="0" allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Video 2: Memorization */}
          <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex-1 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-amber-500 dark:text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Memory</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Memorize Efficiently</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Discover the power of mnemonic cues and why index cards are the ultimate 
                tool for spaced repetition.
              </p>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 mb-4">
              <iframe 
                width="100%" height="100%" 
                src="https://www.youtube.com/embed/oBUhdwTt7ow" 
                title="Memorize Efficiently" 
                frameBorder="0" allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Video 3: Note-Taking */}
          <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex-1 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <PenTool size={16} className="text-emerald-500 dark:text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Note-Taking</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Effective Note-Taking</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Stop transcribing and start processing. Learn the 24-hour "flesh on bones" 
                rule for handwritten notes.
              </p>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800 mb-4">
              <iframe 
                width="100%" height="100%" 
                src="https://www.youtube.com/embed/ATmJb3bH2E0" 
                title="Effective Note-Taking" 
                frameBorder="0" allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Study Schedule Section */}
        <div className="lg:col-span-3">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
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
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BookOpen size={24} /> Handbooks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booksData.map((book: any) => (
              <button
                key={book.title}
                onClick={() => setSelectedBook(book)}
                className={`text-left p-6 rounded-xl border transition-all ${
                  selectedBook?.title === book.title 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-900/40' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-3">{book.emoji}</div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{book.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{book.chapters.length} Chapters</p>
                <div className="mt-4 bg-slate-100 dark:bg-slate-800 rounded-full h-2 w-full">
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
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-fit sticky top-6">
          {selectedBook ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{selectedBook.emoji}</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBook.title}</h2>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {selectedBook.chapters.map((chapter: any) => {
                  const isCompleted = progress.completedChapters[`${selectedBook.title}-${chapter.id}`];
                  const level = progress.reviewLevels[`${selectedBook.title}-${chapter.id}`] || 0;
                  const reviewDate = progress.reviewDates[`${selectedBook.title}-${chapter.id}`];
                  
                  // Color coding based on Spaced Repetition / Retrospective Timetable
                  // 0: Red (Needs study), 1-2: Amber (Getting there), 3-4: Green (Good), 5: Gold (Mastered)
                  const colors = [
                    'border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30',
                    'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30',
                    'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30',
                    'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30',
                    'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30',
                    'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                  ];

                  return (
                    <div 
                      key={chapter.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isCompleted ? colors[level] : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-80'}`}
                    >
                      <div className="flex-1 pr-4">
                        <p className={`text-sm font-medium leading-tight ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          <span className="opacity-50 mr-2">{chapter.id}.</span>
                          {chapter.title}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {isCompleted ? (
                            <>
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                                Level {level}
                              </span>
                              {reviewDate && (
                                <span className="text-[9px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                                  Next: {format(parseISO(reviewDate), 'MMM d')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 italic">
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                      <Link 
                        href={`/checkpoint/${encodeURIComponent(selectedBook.title)}/${chapter.id}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-900"
                      >
                        <PlayCircle size={24} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-600">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a handbook to see its chapters</p>
            </div>
          )}
        </div>
      </div>

      {/* Study Methodology Section */}
      <section className="mt-20 mb-12">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Zap size={24} className="text-amber-500" /> The Study System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyTips.map((tip) => (
            <div key={tip.title} className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-blue-600 dark:text-blue-400">
                  {tip.title === 'Active Recall' && <Zap size={20} />}
                  {tip.title === 'Spaced Repetition' && <Clock size={20} />}
                  {tip.title === 'Retrospective Timetable' && <Calendar size={20} />}
                  {tip.title === 'Big Picture (Why is this bad?)' && <HelpCircle size={20} />}
                  {tip.title === 'Verbal Recall' && <MessageSquare size={20} />}
                  {tip.title === 'Spatial Memory' && <Layout size={20} />}
                  {tip.title === "Professor Kaplan's Marginalia" && <BookOpen size={20} />}
                  {tip.title === 'Mnemonic Cues' && <Sparkles size={20} />}
                  {tip.title === 'Note-Taking Bones' && <PenTool size={20} />}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{tip.title}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {tip.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Source: {tip.source}</span>
                <a 
                  href={tip.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
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

    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">

      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">{icon}</div>

      <div>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>

        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>

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

        <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5">

            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">{subtitle}</p>

            

            <div className="space-y-2">

                {dueChapters.length > 0 ? (

                    dueChapters.map(([key]) => {

                        const [book, chapter] = key.split('-');

                                                return (

                                                    <Link 

                                                        key={key}

                                                        href={`/checkpoint/${encodeURIComponent(book)}/${chapter}`}

                                                        className="block p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/30"

                                                    >

                                                        {book.substring(0, 15)}... - Ch {chapter}

                                                    </Link>

                                                );

                        

                    })

                ) : (

                    <p className="text-xs text-slate-400 dark:text-slate-600 italic py-2">Nothing due</p>

                )}

            </div>

        </div>

    );

}
