LeadFlow CRM – AI-Powered Mini CRM

LeadFlow CRM is a modern, full-stack customer relationship management system built with Next.js, Supabase, and AI integration.
It allows teams to manage sales leads, track pipeline progress, and generate intelligent follow-up messages using AI.

The system includes role-based authentication, where administrators can manage leads and users, while regular users can interact with leads and generate AI-powered responses.

Features
Authentication & Security

Supabase Authentication (email/password)

Role-based access control (Admin / User)

Secure Row Level Security (RLS) policies

Protected API routes for AI calls

Lead Management

Create, update, and delete leads

Track lead status across pipeline stages:

New

Contacted

Follow-Up Required

Converted

Lost

Filter and search leads

Real-time lead status updates

AI Sales Assistant

Generate professional follow-up messages using AI

Select tone:

Friendly

Professional

Urgent

Suggest best follow-up timing based on lead data

Editable AI response before use

Copy-to-clipboard functionality

Admin Dashboard

View lead statistics

Conversion rate analytics

Pipeline breakdown visualization

View all users and performance metrics

User Roles

Admin

Access dashboard

Create and manage leads

View users

Manage pipeline

Sales User

View leads

Generate AI follow-up messages

Cannot create or delete leads

Tech Stack

Frontend

Next.js (React)

TypeScript

Tailwind / Custom CSS

Backend

Supabase

PostgreSQL

Row Level Security (RLS)

AI Integration

OpenAI API (via secure server route)

Other Tools

Supabase Auth

Supabase Database

REST API

Project Architecture
Frontend (Next.js)
        |
        | API request
        v
Next.js API Route (/api/ai)
        |
        v
OpenAI API

Database layer:

Supabase
 ├── auth.users
 ├── profiles (role-based access)
 └── leads (CRM data)
