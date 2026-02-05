# Aviation Interactive Study Guide

An interactive study application for FAA handbooks using Spaced Repetition (2nd day, 3rd day, weekly, monthly reviews).

## Features
- **Spaced Repetition**: Automatically schedules reviews based on your quiz performance.
- **Interactive Quizzes**: Chapter-by-chapter quizzes to test your knowledge.
- **Progress Tracking**: See your mastery levels for each handbook.
- **Offline First**: All progress is saved to your browser's local storage.

## Included Handbooks
1. Airplane Flying Handbook
2. Pilot's Handbook of Aeronautical Knowledge
3. Instrument Flying Handbook
4. Instrument Procedures Handbook
5. Weather Handbook
6. Weight & Balance Handbook
7. Aviation Instructor's Handbook
8. Risk Management Handbook
9. Plane Sense

## How to Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Aviation Study Guide"
# Create a repository on GitHub and then:
git remote add origin https://github.com/YOUR_USERNAME/aviation-study-guide.git
git branch -M main
git push -u origin main
```

### 2. Ship to Vercel
- Go to [vercel.com](https://vercel.com)
- Import your new GitHub repository.
- Vercel will automatically detect Next.js and deploy.

## Development
To run locally:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.