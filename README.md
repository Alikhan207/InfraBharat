# InfraBharat -- AI Urban Infrastructure Intelligence Platform

> 1st Place -- CIT Tumkur Ideathon (Karnataka ISTE Section) | 
> 1st Place -- DataQuest 2025 (8-hour Hackathon) |
> 1st Place -- CMRIT 3rd Semester Mini Project |
> Shortlisted -- MSME 5.0 National Top 40

## What It Does

InfraBharat is an AI system that does not just predict urban flooding risk
it prescribes engineering-grade solutions. Given elevation data, rainfall 
simulations, and citizen-reported infrastructure issues, it generates specific 
actionable fixes: pipe diameter upgrades, slope corrections, and drainage 
capacity improvements.

Built for Indian cities where urban flooding causes billions in damage annually 
and existing systems only warn citizens after the fact.

## The Problem

Traditional flood management tools tell you WHERE flooding will happen.
InfraBharat tells engineers exactly WHAT to fix and HOW.

## Key Features

- AI-generated engineering prescriptions using Manning's equation for 
  hydraulic flow modelling
- Citizen reporting portal with GPS-tagged infrastructure complaints
- Engineer validation dashboard for reviewing and approving AI prescriptions
- Municipal authority interface for execution tracking
- Three-actor governance loop: Citizens -- AI -- Engineers -- Authorities

## Tech Stack

- Frontend: React (Vite)
- Backend: Supabase Edge Functions (Deno/TypeScript)
- Database: Supabase PostgreSQL
- AI Engine: Google Gemini API (Flash Models)
- Infrastructure: Docker Compose

## Architecture
```
Citizen Portal (React)
       |
  Supabase Edge Functions (Gemini AI Chatbot & Recommendation Engine)
       |
  Engineer Validation Dashboard & National Priority Tab
       |
  Supabase (Real-time Database + PostGIS)
```

## Awards

- 1st Place -- CIT Tumkur Ideathon, Karnataka ISTE Section (December 2025)
- 1st Place -- DataQuest 2025, 8-hour Hackathon (December 2025)
- 1st Place -- CMRIT 3rd Semester Mini Project (Late 2025)
- Shortlisted -- MSME 5.0 National Top 40 (August 2025)

## Team

- Mohammed Ali Khan (Founder & Lead) -- github.com/Alikhan207
- Tanvik (Co-developer) -- github.com/tanvik21

## How To Run
```bash
# Clone the repo
git clone https://github.com/Alikhan207/InfraBharat
cd InfraBharat

# Install dependencies and run frontend
npm install
npm run dev

# (Backend is deployed via Supabase Edge Functions)
```
