# Golem XIV – Plataforma Web d'Autocorrecció de Pràctiques (TFG)

**Golem XIV** és una plataforma web per a la gestió i autocorrecció de pràctiques de programació. Aquesta tercera versió se centra en la millora de la interfície d’usuari, l’arquitectura interna, la modularitat del backend i la incorporació d’un sistema distribuït per a la correcció automàtica d’entregues.

## 🧩 Arquitectura

El sistema es compon de quatre components principals:

- **Frontend:** Aplicació web desenvolupada amb Next.js, TailwindCSS i HeroUI.
- **Backend:** API RESTful desenvolupada amb FastAPI, SQLModel i Alembic.
- **Practice Correction Queue Worker:** Consumidor de missatges asíncron basat en `asyncio`, `aio-pika` i SQLAlchemy asíncron.
- **Dummy Practices Correction Server:** Simulador de servidor RPC que rep les pràctiques i en retorna la correcció.

## ⚙️ Requisits previs

Abans de començar, assegura’t de tenir instal·lat:

- **Python 3.10 o superior**
- **Node.js 18 o superior** (per al frontend)
- **uv** (https://github.com/astral-sh/uv) → gestor de dependències utilitzat als components Python  
- (Opcional però recomanat) **Docker**

Instal·lació de `uv`:

```console
$ pip install uv
```

## 🗂️ Estructura de carpetes

- `/backend`                                -> API RESTful
- `/practice_correction_queue_worker`       -> Worker asíncron de correcció de pràctiques
- `/dummy_practices_correction_server`      -> Servidor de simulador de correcció de pràctiques
- `/frontend`                               -> Aplicació web

## 🌍 Variables d’entorn

Backend:
```.env
PROJECT_NAME=...
FIRST_SUPERUSER=...
FIRST_SUPERUSER_PASSWORD=...
SECRET_KEY=...
DB_ENGINE=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=...
BACKEND_CORS_ORIGINS=... # separat per comes si poses més d'una URL. Ex.: http://localhost:8000,http://example.com
CLOUDAMQP_URL=amqps://...
ENABLE_EXTERNAL_SERVICE=... # true or false
SFTP_HOST=...
SFTP_PORT=...
SFTP_USER=...
SFTP_KEY=... # base64
```

Worker:
```.env
PROJECT_NAME=...
DB_ENGINE=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=...
CLOUDAMQP_URL=amqps://...
RPC_URL=amqps://...
```

Dummy Server RPC:
```.env
PROJECT_NAME=...
RPC_URL=amqps://...
```

Frontend:
```.env
SESSION_SECRET=...
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 📦 Instal·lació de dependències als components Python

Cada component Python (backend, worker, dummy server RPC) conté els fitxers `pyproject.toml` i `uv.lock`. Per instal·lar les dependències:

```console
$ cd backend  # o practice_correction_queue_worker, o dummy_practices_correction_server
$ uv sync
```

Pots activar l'entorn virtual de dues maneres:
 - `.venv/Scripts/activate` (Windows) o `.venv/bin/activate` (Unix)
 - O bé executar directament amb `uv run <comanda>`

## 🚀 Execució
### 🔧 1. Backend
Per executar en mode desenvolupament:

```console
$ cd backend
$ uv run fastapi run --reload app/main.py
```

Per producció:
```console
$ uv run fastapi run app/main.py
```

Executa primer les migracions si és necessari:
```console
$ cd backend
$ uv run alembic upgrade head
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
Per executar en mode desenvolupament:

```console
$ cd frontend
$ npm install
$ npm run dev
```

Per producció:
```console
$ npm run build
$ npm start
```
