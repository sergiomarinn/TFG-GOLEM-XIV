# Golem XIV – Plataforma Web d'Autocorrecció de Pràctiques

[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-Latest-000000.svg)](https://nextjs.org)

> Plataforma web per a la gestió i autocorrecció automatitzada de pràctiques de programació, desenvolupada com a Treball Final de Grau.

**Golem XIV** és una plataforma web per a la gestió i autocorrecció de pràctiques de programació. Aquesta tercera versió se centra en la millora de la interfície d'usuari, l'arquitectura interna, la modularitat del backend i la incorporació d'un sistema distribuït per a la correcció automàtica d'entregues.

## 🚀 Inici ràpid

1. **Clona el repositori:**
   ```console
   $ git clone [URL-del-repositori]
   $ cd golem-xiv
   ```

2. **Configura les variables d'entorn** per a cada component (veure secció [Variables d'entorn](#-variables-dentorn))

3. **Instal·la les dependències** seguint les instruccions per component

4. **Executa els serveis** en aquest ordre:
   - Backend → Worker → Dummy Server → Frontend

## 🧩 Arquitectura

El sistema es compon de quatre components principals:

- **Frontend:** Aplicació web desenvolupada amb Next.js, TailwindCSS i HeroUI.
- **Backend:** API RESTful desenvolupada amb FastAPI, SQLModel i Alembic.
- **Practice Correction Queue Worker:** Consumidor de missatges asíncron basat en `asyncio`, `aio-pika` i SQLAlchemy asíncron.
- **Dummy Practices Correction Server:** Simulador de servidor RPC que rep les pràctiques i en retorna la correcció.

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
│  Frontend   │───▶│   Backend   │───▶│ Message Queue    │
│  (Next.js)  │    │  (FastAPI)  │    │   (RabbitMQ)     │
└─────────────┘    └─────────────┘    └──────────────────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          │                     ▼                     │
                          │        ┌─────────────────────┐            │
                          │        │ Queue Worker        │            │
                          │        │ (Python asyncio)    │            │
                          │        └─────────────────────┘            │
                          │                     │                     │
                          │                     ▼                     │
                          │        ┌─────────────────────┐            │
                          └───────▶│ Dummy RPC Server    │◀───────────┘
                                   │ (Practice Checker)  │
                                   └─────────────────────┘
```

## ⚙️ Requisits previs

Abans de començar, assegura't de tenir instal·lat:

- **Python 3.10 o superior**
- **Node.js 18 o superior** (per al frontend)
- **uv** (https://github.com/astral-sh/uv) → gestor de dependències utilitzat als components Python  
- (Opcional però recomanat) **Docker**

### Instal·lació de `uv`:
```console
$ pip install uv
```

## 🗂️ Estructura de carpetes

```
golem-xiv/
├── backend/                               # API RESTful
├── practice_correction_queue_worker/      # Worker asíncron de correcció
├── dummy_practices_correction_server/     # Simulador de servidor de correcció
├── frontend/                              # Aplicació web Next.js
├── README.md
└── .gitignore
```

## 🌐 Ports per defecte

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Documentació API:** http://localhost:8000/docs
- **Redoc API:** http://localhost:8000/redoc

## 🌐 Desplegament

El projecte es troba desplegat i accessible a través dels següents enllaços:

- **Frontend:** https://tfg-golem-xiv-seven.vercel.app
- **Backend API:** https://golemxiv-api-e0hmbkgxeggxd2a6.spaincentral-01.azurewebsites.net
- **Documentació API:** https://golemxiv-api-e0hmbkgxeggxd2a6.spaincentral-01.azurewebsites.net/docs
- **Redoc API:** https://golemxiv-api-e0hmbkgxeggxd2a6.spaincentral-01.azurewebsites.net/redoc

### Plataformes utilitzades
- **Frontend**: Desplegat a Vercel
- **Backend**: Desplegat a Azure Web App for Container

## 🌍 Variables d'entorn

### Backend:
```env
PROJECT_NAME=Golem XIV
FIRST_SUPERUSER=your-secure-email
FIRST_SUPERUSER_PASSWORD=your-secure-password
SECRET_KEY=your-secret-key
DB_ENGINE=... # postgres o sqlite
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=your-db-port
BACKEND_CORS_ORIGINS=your-web-app-url # separat per comes si poses més d'una URL. Ex.: http://localhost:8000,http://example.com
CLOUDAMQP_URL=amqps://user:password@host:port/vhost
ENABLE_EXTERNAL_SERVICE=true # true or false
SFTP_HOST=your-sftp-host
SFTP_PORT=your-sftp-port
SFTP_USER=your-sftp-user
SFTP_KEY=base64-encoded-ssh-key
```

### Worker:
```env
PROJECT_NAME=Golem XIV Worker
DB_ENGINE=... # postgres o sqlite
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=your-db-port
CLOUDAMQP_URL=amqps://user:password@host:port/vhost
RPC_URL=amqps://user:password@host:port/vhost
```

### Dummy Server RPC:
```env
PROJECT_NAME=Golem XIV RPC Dummy Server
RPC_URL=amqps://user:password@host:port/vhost
```

### Frontend:
```env
SESSION_SECRET=your-session-secret-key
NEXT_PUBLIC_API_URL=your-api-url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 📦 Instal·lació de dependències als components Python

Cada component Python (backend, worker, dummy server RPC) conté els fitxers `pyproject.toml` i `uv.lock`. Per instal·lar les dependències:

```console
$ cd backend  # o practice_correction_queue_worker, o dummy_practices_correction_server
$ uv sync
```

### Activació de l'entorn virtual:
Pots activar l'entorn virtual de dues maneres:
- **Activació manual:**
  - Windows: `.venv/Scripts/activate`
  - Unix/macOS: `.venv/bin/activate`
- **Execució directa:** `uv run <comanda>`

## 🚀 Execució

### 🔧 1. Backend

**Executa primer les migracions si és necessari:**
```console
$ cd backend
$ uv run alembic upgrade head
```

**Mode desenvolupament:**
```console
$ cd backend
$ uv run fastapi run --reload app/main.py
```

**Mode producció:**
```console
$ cd backend
$ uv run fastapi run app/main.py
```

### ⚙️ 2. Worker (Practice Correction Queue Worker)

```console
$ cd practice_correction_queue_worker
$ uv run worker.py
```

### 🧪 3. Dummy RPC Correction Server

```console
$ cd dummy_practices_correction_server
$ uv run server.py
```

### 🌐 4. Frontend

**Mode desenvolupament:**
```console
$ cd frontend
$ npm install
$ npm run dev
```

**Mode producció:**
```console
$ cd frontend
$ npm run build
$ npm start
```

## 🐳 Execució amb Docker (Opcional)

Si prefereixes utilitzar Docker, pots crear i executar els contenidors:

### Backend

```console
$ cd backend
$ docker build -t golem-xiv-backend .
$ docker run -p 8000:8000 --env-file .env golem-xiv-backend
```

### Worker

```console
$ cd practice_correction_queue_worker
$ docker build -t golem-xiv-worker .
$ docker run --env-file .env golem-xiv-worker
```

## 📚 Documentació de l'API

Un cop el backend estigui executant-se, pots accedir a la documentació interactiva de l'API:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🛠️ Desenvolupament

### Estructura del codi
- **Backend:** Segueix l'arquitectura de FastAPI amb separació clara entre models, rutes, CRUD i endpoints
- **Frontend:** Utilitza l'App Router de Next.js 15+ amb components de React
- **Worker:** Implementa el patró producer-consumer amb cues de missatges
- **Dummy RPC Server:** Simulador senzill per a testing i desenvolupament

### Eines de desenvolupament recomanades
- **Backend i Worker:** VS Code amb extensions de Python
- **Frontend:** VS Code amb extensions de TypeScript i Tailwind CSS

## 📄 Llicència

Aquest projecte ha estat desenvolupat per a finalitats acadèmiques dins el marc del Treball de Fi de Grau del Grau en Enginyeria Informàtica de la Universitat de Barcelona. L'ús queda permès per a finalitats educatives i de recerca.

## 👨‍💻 Autor

**Sergio Marín Herrera** - Treball Final de Grau  
**Universitat:** Facultat de Matemàtiques i Informàtica - UB  
**Any:** 2024-2025

## 🙏 Agraïments

- Director/a del TFG: Daniel Ortiz Martinez
- Departament de Matemàtiques i Informàtica
- Universitat de Barcelona
