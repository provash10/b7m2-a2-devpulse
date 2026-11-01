# DevPulse – Internal Tech Issue & Feature Tracker

DevPulse is a collaborative backend REST API platform designed for software engineering teams to report bugs, request features, and coordinate workflow resolutions with role-based access control.

---


---

## 🚀 Features
- **User Authentication:** Secure user registration & login with password hashing.
- **JWT Authorization:** Role-based access control (`contributor` and `maintainer`).
- **Issue Management:** Full CRUD operations for tech issues (bug reports & feature requests).
- **Filtering & Sorting:** Filter issues by type, workflow status, and sort by newest/oldest.
- **Strict Role Permissions:**
  - `contributor`: Create issues, view issues, and update only own open issues.
  - `maintainer`: Full permissions to manage, update status, and delete any issue.
- **Zero SQL JOINs:** Raw PostgreSQL queries with native `pg` driver adhering strictly to assignment guidelines.

---

## 🛠️ Technology Stack
- **Runtime:** Node.js (v24.x LTS)
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon Serverless Postgres)
- **Database Driver:** Native `pg` Pool
- **Security:** `bcryptjs` (salt rounds 10), `jsonwebtoken` (JWT)

---

## 🗄️ Database Schema Summary

### Table 1: `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(50) | NOT NULL | User display name |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Account login email |
| `password` | TEXT | NOT NULL | Hashed password |
| `role` | VARCHAR(20) | CHECK (role IN ('contributor', 'maintainer')) | Access role (default: contributor) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp created |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Timestamp updated |

### Table 2: `issues`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique issue identifier |
| `title` | VARCHAR(150) | NOT NULL | Short issue headline |
| `description` | TEXT | NOT NULL, CHECK (LENGTH >= 20) | Detailed problem description |
| `type` | VARCHAR(50) | CHECK (type IN ('bug', 'feature_request')) | Categorization |
| `status` | VARCHAR(50) | CHECK (status IN ('open', 'in_progress', 'resolved')) | Workflow state (default: open) |
| `reporter_id` | INT | NOT NULL | Reference to user id |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp created |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Timestamp updated |

---

## 🌐 API Endpoints

### 🔐 Authentication Module
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT token |
| `GET` | `/api/auth/users` | Protected | Get all registered users |

### 📋 Issues Module
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/issues` | Contributor, Maintainer | Create a new issue |
| `GET` | `/api/issues` | Public | Get all issues (supports `?sort=newest|oldest`, `?type=`, `?status=`) |
| `GET` | `/api/issues/:id` | Public | Get single issue details with reporter info |
| `PATCH` | `/api/issues/:id` | Maintainer / Contributor (own & open) | Update issue fields |
| `DELETE` | `/api/issues/:id` | Maintainer only | Permanently delete an issue |

---

## ⚙️ Local Setup Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/provash10/b7m2-a2-devpulse.git
   cd b7m2-a2-devpulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   CONNECTIONSTRING="your-neon-postgres-connection-string"
   PORT=5000
   JWT_SECRET="your-jwt-secret-key"
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000` and automatically create tables in the database.

