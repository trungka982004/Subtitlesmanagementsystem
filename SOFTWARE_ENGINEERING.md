# Software Engineering Documentation
## Subtitles Management System

### 1. System Overview
The **Subtitles Management System** is a full-stack web application designed to facilitate the translation, editing, and management of subtitle files. It addresses the need for a specialized tool that combines project management with advanced, domain-specific machine learning capabilities.

**Key Capabilities:**
*   **Project Management**: Organize subtitle files into distinct projects.
*   **User Management**: Secure authentication and user-specific data isolation.
*   **Automated Translation**: Integration with a local Python/FastAPI service running custom NLP models (Chinese-Vietnamese).
*   **Hot-Swappable AI Models**: Unique capability to switch underlying translation models at runtime without downtime.

### 2. Architecture Design
The system employs a **Microservices-Lite** architecture. It consists of three decoupled components communicating over HTTP.

#### 2.1 Communication Flow
1.  **Client (React)**: Initiates all user interactions.
2.  **API Gateway / Core Backend (Node.js)**: Acts as the primary entry point for business logic, data persistence, and authentication.
3.  **Inference Engine (Python)**: A dedicated stateless service processing heavy computational tasks (NLP).

#### 2.2 System Diagram
```mermaid
graph TD
    subgraph Frontend
        SPA[React SPA]
    end

    subgraph Backend Services
        NodeAPI[Node.js Express API]
        PythonAPI[Python FastAPI Inference]
    end

    subgraph Persistence layer
        PG[(PostgreSQL Database)]
        LocalStorage[Local File System]
    end

    SPA -->|HTTP / JSON| NodeAPI
    SPA -->|HTTP / JSON| PythonAPI
    
    NodeAPI -->|Prisma Client| PG
    PythonAPI -->|transformers| LocalStorage
```

### 3. Core System Models
To better understand the system's behavior and user interactions, the following diagrams detail the core logical flows.

#### 3.1 Use Case Diagram
This diagram outlines the primary actors and their interactions with the major system components.

```mermaid
usecaseDiagram
    actor U as "User"
    package "Subtitles Management System" {
        usecase "Register / Login" as UC1
        usecase "Create & Manage Projects" as UC2
        usecase "Upload Subtitle File (.srt)" as UC3
        usecase "Edit Subtitle Content" as UC4
        usecase "Translate Text (AI)" as UC5
        usecase "Switch AI Model Version" as UC6
        usecase "Export / Download" as UC7
    }
    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
```

#### 3.1.1 Core Use Case Specifications

The following tables describe the detailed interactions for the core system functionalities identified in the Use Case Diagram.

**UC1: Register / Login**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User |
| **Preconditions** | User must have a valid email address. for Login, user must be registered. |
| **Main Flow** | 1. User navigates to Auth page.<br>2. User enters credentials (email, password).<br>3. System validates input format.<br>4. System verifies credentials against Database.<br>5. System issues a JWT token and redirects to Dashboard. |
| **Alternative Flows** | **Invalid Credentials**: System displays error message; user retries.<br>**Server Error**: System displays generic error message. |
| **Postconditions** | User is authenticated and session is stored locally. |

**UC2: Create & Manage Projects**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User |
| **Preconditions** | User is logged in. |
| **Main Flow** | 1. User clicks "New Project" on Dashboard.<br>2. User inputs Project Name and Description.<br>3. User submits the form.<br>4. System creates record in `Project` table.<br>5. System refreshes project list. |
| **Postconditions** | A new project container is available for file uploads. |

**UC3: Upload Subtitle File**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User |
| **Preconditions** | User has selected a specific Project. |
| **Main Flow** | 1. User clicks "Upload File".<br>2. User selects a `.srt` file from local machine.<br>3. Frontend reads file content.<br>4. Content is sent to Node.js Backend.<br>5. Backend parses and saves content to `SubtitleFile` table. |
| **Postconditions** | Subtitle file is visible in the project and ready for editing. |

**UC4: Edit Subtitle Content**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User |
| **Preconditions** | User has opened a Subtitle File. |
| **Main Flow** | 1. User selects a timeline block.<br>2. User modifies the text content.<br>3. User saves changes (Manual or Auto-save).<br>4. System updates the specific record in Database. |
| **Postconditions** | The subtitle file content is permanently updated. |

**UC5: Translate Text (AI)**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User, AI Inference Service |
| **Preconditions** | Python Inference Service is healthy (`/health` returns OK). |
| **Main Flow** | 1. User selects a subtitle line to translate.<br>2. User clicks "AI Translate" or uses shortcut.<br>3. Client sends text to Python Service (`POST /translate`).<br>4. Python Service runs inference and returns text.<br>5. UI displays suggestion for user approval. |
| **Alternative Flows** | **Service Offline**: UI shows "AI Service Unavailable" notification. |
| **Postconditions** | User has a translated text suggestion to merge or edit. |

**UC6: Switch AI Model Version**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User (Admin) |
| **Preconditions** | Multiple model versions exist in backend storage. |
| **Main Flow** | 1. User navigates to Settings > System Info.<br>2. System lists available versions from Python Service.<br>3. User selects a different version.<br>4. Python Service unloads current model and loads new one.<br>5. System confirms "Model Loaded". |
| **Postconditions** | Subsequent translations use the newly selected model weights. |

**UC7: Export / Download**
| Attribute | Description |
| :--- | :--- |
| **Actors** | User |
| **Preconditions** | Editing is complete. |
| **Main Flow** | 1. User clicks "Export" in Editor.<br>2. System reconstructs `.srt` format from database content.<br>3. Browser triggers file download of the updated subtitle file. |
| **Postconditions** | User possesses the modified `.srt` file locally. |

#### 3.2 Activity Diagram: Translation Workflow
The detailed flow of how a user interacts with the system to translate a specific line of text.

```mermaid
flowchart TD
    Start([Start]) --> Login[User Logs In]
    Login --> SelectProj[Open Project]
    SelectProj --> SelectFile[Select Subtitle File]
    SelectFile --> EditView[Enter Editor Mode]
    EditView --> SelectLine[Select Subtitle Line]
    
    SelectLine --> ReqTrans{Request Translation?}
    ReqTrans -- Yes --> CheckHealth[Check AI Service Health]
    
    CheckHealth -- Online --> CallAI[POST /translate to Python Service]
    CheckHealth -- Offline --> Err[Show Error Toast]
    
    CallAI --> Inf[Model Inference (GPU/CPU)]
    Inf --> Ret[Return Translated Text]
    Ret --> UpdateUI[Populate suggestion in UI]
    UpdateUI --> UserReview[User Reviews & Edits]
    
    UserReview --> Save{Save Changes?}
    Save -- Yes --> CallNode[PUT /api/files to Node Backend]
    CallNode --> DB[(Update Database)]
    DB --> Notify[Show "Saved" Notification]
    Notify --> EditView
    
    Save -- No --> EditView
    ReqTrans -- No --> EditView
```

#### 3.3 Sequence Diagram: Real-time Translation
This diagram illustrates the sequence of network calls between the Client, Core Backend, and the AI Inference Service during a translation task. Note that the Client communicates **directly** with the Python Service for inference to reduce latency on the Core Backend.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client
    participant Node as Node.js API
    participant DB as PostgreSQL
    participant Python as Python NLP Service

    note over User, Client: Translation Phase
    User->>Client: Clicks "Translate" button
    Client->>Python: POST /translate { text: "Hello..." }
    activate Python
    Python->>Python: Pre-processing (Tokenization)
    Python->>Python: Model Inference (Seq2Seq)
    Python->>Python: Post-processing (Decoding)
    Python-->>Client: { translated_text: "Xin chào..." }
    deactivate Python
    Client->>User: Displays suggested text
    
    note over User, Client: Persistence Phase
    User->>Client: Modifies text & Clicks "Save"
    Client->>Node: PUT /api/files/:id { content: "...", status: "in-progress" }
    activate Node
    Node->>Node: Validate Token (JWT)
    Node->>DB: UPDATE SubtitleFile...
    activate DB
    DB-->>Node: Success
    deactivate DB
    Node-->>Client: 200 OK { updatedFile }
    deactivate Node
    Client->>User: Show "Changes Saved" Toast
```

### 4. Technology Stack

| Layer | Technology | Key Libraries | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 (Vite) | `react-hook-form`, `sonner`, `lucide-react` | UI/UX, State Management |
| **Styling** | Tailwind CSS | `clsx`, `tailwind-merge`, `radix-ui` | Responsive, accessible design |
| **Core Backend** | Node.js / Express | `prisma`, `jsonwebtoken`, `bcryptjs` | Business logic, DB operations |
| **AI Service** | Python 3.8+ / FastAPI | `torch`, `transformers`, `uvicorn` | ML Inference, GPU acceleration |
| **Database** | PostgreSQL | `prisma` | Relational data storage |

### 5. Database Schema
Managed via **Prisma ORM**. The schema is normalized (3NF) to ensure data integrity.

#### **User**
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default(uuid) | Unique user ID |
| `email` | String | Unique | User login credential |
| `password` | String | | Bcrypt hashed string |
| `name` | String | Optional | Display name |

#### **Project**
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default(uuid) | Unique project ID |
| `name` | String | | Project title |
| `description` | String | Optional | Project details |
| `userId` | UUID | FK | Owner of the project |
| `createdAt` | DateTime | default(now) | Timestamp |

#### **SubtitleFile**
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default(uuid) | Unique file ID |
| `name` | String | | Original filename |
| `content` | Text | | Raw subtitle text content |
| `status` | Enum | default('not-started') | `not-started`, `in-progress`, `done` |
| `progress` | Int | default(0) | Completion percentage (0-100) |
| `projectId` | UUID | FK, Nullable | Associated project |

### 6. API Usage Specifications

#### 6.1 Authentication (Node.js)
Base URL: `http://localhost:3001/api`

*   **POST /auth/register**
    *   **Body**: `{ "email": "user@example.com", "password": "securePass123", "name": "John Doe" }`
    *   **Response**: `{ "token": "jwt_string...", "user": { ... } }`
*   **POST /auth/login**
    *   **Body**: `{ "email": "user@example.com", "password": "securePass123" }`
    *   **Response**: `{ "token": "jwt_string...", "user": { ... } }`
*   **GET /auth/me**
    *   **Header**: `Authorization: Bearer <token>`
    *   **Response**: User profile object.

#### 6.2 Projects & Files (Node.js)
*   **GET /projects**: List all projects for authenticated user.
*   **POST /projects**: Create new project. Body: `{ "name": "Movie A", "description": "..." }`.
*   **POST /files**: Upload file content. Body: `{ "name": "subs.srt", "content": "1\n00:01...", "projectId": "..." }`.
*   **PUT /files/:id**: Update file content/status. Body: `{ "content": "Updated...", "status": "in-progress" }`.

#### 6.3 NLP Service (Python)
Base URL: `http://localhost:8000`

*   **POST /translate**
    *   **Body**: `{ "text": "Hello world" }`
    *   **Response**: `{ "translated_text": "Chào thế giới" }`
*   **GET /versions**: List available local models.
*   **POST /set_version**: Hot-swap model. Body: `{ "version": "v1.2_beta" }`.
*   **GET /health**: Returns `{ "status": "ok", "device": "cuda" }`.

### 7. Security Implementation
1.  **JWT Authentication**: Stateless authentication mechanism. Tokens expire in 7 days.
2.  **Password Hashing**: Bcrypt with salt rounds (default 10) for secure storage.
3.  **CORS**: Configured on both Node.js and Python servers to allow frontend communication.
4.  **Authorization**: Middleware ensures users can only access their own projects/files via `userId` checks.

### 8. Deployment & DevOps Strategy

#### Docker Deployment (Recommended)
A `docker-compose.yml` orchestration is recommended for production.

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  api:
    build: ./server
    environment:
      DATABASE_URL: postgres://postgres:${DB_PASSWORD}@db:5432/mydb
  nlp-service:
    build: ./server/python_service
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
  web:
    build: ./
    ports:
      - "80:80"
```

#### Environment Variables (.env)
Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/subtitle_db"

# Auth
JWT_SECRET="complex_random_string_here"

# Server Port
PORT=3001
```

### 9. Development Workflow

1.  **Setup Phase**:
    *   Install Node dependencies: `npm install`
    *   Install Python dependencies: `pip install -r server/python_service/requirements.txt`
    *   Start Postgres database.
2.  **Migration Phase**:
    *   Run `npx prisma generate` to create client.
    *   Run `npx prisma db push` to sync schema.
3.  **Run Phase**:
    *   Start Backend: `npm run server`
    *   Start NLP Service: `cd server/python_service && python -m uvicorn main:app --reload`
    *   Start Frontend: `npm run dev`

### 10. Future Enhancements Roadmap
*   **Message Queues (Redis/RabbitMQ)**: Decouple the translation request loop to handle long documents asynchronously without timing out HTTP requests.
*   **WebSockets**: Implement real-time progress bars for file processing.
*   **Batch Processing**: Allow bulk upload and translation of multiple files.
*   **Unit & Integration Tests**: Add `Jest` for backend testing and `Vitest` for frontend components.

