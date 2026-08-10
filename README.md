# Hello World

A boilerplate project using **React + Vite + TypeScript** for the frontend and **Python FastAPI** for the backend. This repository provides a clean, scalable starting point for building full-stack applications.

---

## Tech Stack

### Frontend

* React 19
* Vite
* TypeScript
* React Router
* Redux Toolkit
* Axios

### Backend

* Python
* FastAPI
* Uvicorn
* python-dotenv

---

## Project Structure

```text
hello-world/
-‚
----- frontend/
        ----- src/
           ----- app/
           ----- assets/
           ----- components/
           ----- features/
           ----- layouts/
           ----- pages/
           ----- routes/
           ----- services/
           ----- styles/
           ----- types/
           -”--- utils/
        -”--- .env
-‚
-”--- backend/
    ----- app/
            ----- api/
            ----- core/
            ----- models/
            ----- schemas/
            ----- services/
            ----- utils/
            ----- config.py
            -”--- main.py
    -”--- .env
```

---

## Getting Started

### Clone the repository

```bash
git clone <repository-url>
cd hello-world
```

---

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

### Windows

```bash
.venv\Scripts\activate
```

### macOS / Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```
http://localhost:8000
```

Swagger documentation:

```
http://localhost:8000/docs
```

---

## Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Hello World
```

### Backend (`backend/.env`)

```env
APP_NAME=Hello World API
```

---

## Features

* React + Vite + TypeScript
* FastAPI backend
* Redux Toolkit configured
* React Router configured
* Layout-based routing
* Path aliases (`@`)
* Environment variable support
* ESLint & Prettier ready
* Scalable folder structure

---
