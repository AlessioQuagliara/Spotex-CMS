# CMS API Documentation

## OpenAPI Specification v3.0

Documentazione completa dell'API del CMS con autenticazione JWT, gestione contenuti, media e temi.

**Base URL:** `http://localhost:8000`

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Interactive Documentation](#interactive-documentation)
   - [Swagger UI](#swagger-ui)
   - [ReDoc](#redoc)
   - [Try It Out](#try-it-out)
   - [Code Examples](#code-examples)
3. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Posts](#posts-endpoints)
   - [Categories](#categories-endpoints)
   - [Pages](#pages-endpoints)
   - [Media](#media-endpoints)
   - [Users](#users-endpoints)
   - [Stats](#stats-endpoints)
   - [Cache](#cache-endpoints)
4. [Schemas](#schemas)
5. [Error Responses](#error-responses)

---

## Authentication

L'API utilizza **JWT (JSON Web Tokens)** per l'autenticazione.

### Headers richiesti

```http
Authorization: Bearer <access_token>
```

### Token Flow

1. **Login** con credenziali → ricevi `access_token` e `refresh_token`
2. Usa `access_token` per le richieste autenticate
3. Quando `access_token` scade → usa `refresh_token` per ottenere nuovo `access_token`
4. `refresh_token` ha durata maggiore (7 giorni vs 1 ora)

### Token Expiration

- *Interactive Documentation

### Swagger UI

L'API include **Swagger UI** integrato per esplorare e testare gli endpoint interattivamente.

**URL:** `http://localhost:8000/docs`

#### Features Swagger UI

- ✅ **Interfaccia grafica interattiva** per tutti gli endpoint
- ✅ **Try it out** - Testa le API direttamente dal browser
- ✅ **Request/Response visualization** - Vedi struttura dati in tempo reale
- ✅ **Authentication** - Login e gestione token integrati
- ✅ **Schema documentation** - Visualizzazione automatica degli schemi
- ✅ **Download OpenAPI spec** - Esporta definizione API in JSON/YAML

#### Come usare Swagger UI

1. **Apri Swagger UI:** Vai su `http://localhost:8000/docs`

2. **Autenticazione:**
   - Clicca su "Authorize" 🔒 in alto a destra
   - Fai login con POST `/api/auth/login`
   - Copia il `access_token` dalla response
   - Clicca di nuovo su "Authorize" 🔒
   - Inserisci: `Bearer YOUR_ACCESS_TOKEN`
   - Clicca "Authorize" e "Close"

3. **Testare un endpoint:**
   - Espandi l'endpoint desiderato (es. `GET /api/posts`)
   - Clicca "Try it out"
   - Compila i parametri richiesti
   - Clicca "Execute"
   - Vedi Response Body, Headers e cURL command

4. **Visualizzare Schemas:**
   - Scorri fino alla sezione "Schemas" in fondo
   - Clicca su uno schema per vedere la struttura completa
   - Vedi tipi di dato, campi obbligatori e esempi

#### Screenshot Swagger UI

```
┌─────────────────────────────────────────────────┐
│  CMS API v1.0.0                    [Authorize 🔒] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Auth                                    ▼      │
│    POST /api/auth/login      [Try it out]      │
│    POST /api/auth/register   [Try it out]      │
│    POST /api/auth/refresh    [Try it out]      │
│    GET  /api/auth/me         [Try it out]      │
│                                                 │
│  Posts                                   ▼      │
│    GET    /api/posts         [Try it out]      │
│    POST   /api/posts         [Try it out]      │
│    GET    /api/posts/{id}    [Try it out]      │
│    PUT    /api/posts/{id}    [Try it out]      │
│    DELETE /api/posts/{id}    [Try it out]      │
│                                                 │
│  [... altri endpoint ...]                       │
│                                                 │
│  Schemas                                 ▼      │
│    User                                         │
│    Post                                         │
│    Category                                     │
│    [... altri schemi ...]                       │
└─────────────────────────────────────────────────┘
```

### ReDoc

**ReDoc** offre un'alternativa più pulita e focalizzata sulla lettura.

**URL:** `http://localhost:8000/redoc`

#### Features ReDoc

- ✅ **Three-column layout** - Descrizione, Schema, Examples side-by-side
- ✅ **Search functionality** - Ricerca full-text in tutta la documentazione
- ✅ **Deep linking** - Link diretti a specifici endpoint
- ✅ **Responsive design** - Ottimizzato per mobile e tablet
- ✅ **Dark mode support** - Tema scuro per lettura notturna
- ✅ **Print-friendly** - Esporta documentazione in PDF

#### Differenze Swagger UI vs ReDoc

| Feature | Swagger UI | ReDoc |
|---------|------------|-------|
| Try it out | ✅ | ❌ |
| Interactive testing | ✅ | ❌ |
| Layout | Single column | Three columns |
| Search | Basic | Advanced full-text |
| Focus | Testing & Development | Documentation & Reading |
| Mobile friendly | Good | Excellent |
| Code examples | Limited | Multiple languages |

#### Quando usare cosa?

- **Swagger UI:** Durante sviluppo e testing API
- **ReDoc:** Per consultare documentazione e condividere con team/clienti

### Try It Out

Guida completa per testare gli endpoint usando **Swagger UI**.

#### 1. Setup iniziale

```bash
# Avvia il backend
cd backend
uvicorn app.main:app --reload

# Apri Swagger UI
open http://localhost:8000/docs
```

#### 2. Workflow completo di testing

##### Step 1: Registrazione

1. Espandi `POST /api/auth/register`
2. Clicca "Try it out"
3. Modifica Request body:

```json
{
  "email": "test@example.com",
  "password": "TestPass123!",
  "full_name": "Test User"
}
```

4. Clicca "Execute"
5. Vedi Response (201 Created)

##### Step 2: Login

1. Espandi `POST /api/auth/login`
2. Clicca "Try it out"
3. Request body:

```json
{
  "email": "test@example.com",
  "password": "TestPass123!"
}
```

4. Clicca "Execute"
5. Copia `access_token` dalla Response

##### Step 3: Autorizzazione

1. Clicca "Authorize" 🔒 in alto
2. Incolla nel campo: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Clicca "Authorize" → "Close"
4. Ora tutti gli endpoint autenticati sono accessibili

##### Step 4: Testare endpoint protetti

**Creare un post:**

1. Espandi `POST /api/posts`
2. Clicca "Try it out"
3. Request body:

```json
{
  "title": "My First Post",
  "content": "# Hello World\n\nThis is my first post!",
  "status": "published",
  "tags": ["test", "demo"]
}
```

4. Clicca "Execute"
5. Nota il campo `id` nella Response (es. `"id": 1`)

**Recuperare il post:**

1. Espandi `GET /api/posts/{id}`
2. Clicca "Try it out"
3. Inserisci `id` = `1`
4. Clicca "Execute"
5. Vedi il post completo con tutti i dettagli

**Aggiornare il post:**

1. Espandi `PUT /api/posts/{id}`
2. Clicca "Try it out"
3. Inserisci `id` = `1`
4. Modifica Request body:

```json
{
  "title": "My Updated Post",
  "content": "# Hello World - Updated!\n\nContent updated."
}
```

5. Clicca "Execute"

**Eliminare il post:**

1. Espandi `DELETE /api/posts/{id}`
2. Clicca "Try it out"
3. Inserisci `id` = `1`
4. Clicca "Execute"
5. Response: 204 No Content

#### 3. Testing avanzato

**Paginazione:**

```
GET /api/posts?page=2&limit=10
```

**Filtri:**

```
GET /api/posts?category_id=1&status=published&search=javascript
```

**Ordinamento:**

```
GET /api/posts?sort=views&order=desc
```

**Upload file:**

1. Espandi `POST /api/media/upload`
2. Clicca "Try it out"
3. Clicca "Choose File" e seleziona un'immagine
4. Aggiungi `alt_text`: "Test image"
5. Clicca "Execute"
6. Ricevi URL dell'immagine caricata

### Code Examples

Esempi di chiamate API in **6 linguaggi** diversi.

#### JavaScript (Fetch API)

```javascript
// Login
async function login(email, password) {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data.access_token;
}

// Get Posts with Authentication
async function getPosts(token) {
  const response = await fetch('http://localhost:8000/api/posts', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return response.json();
}

// Create Post
async function createPost(token, postData) {
  const response = await fetch('http://localhost:8000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });
  
  return response.json();
}

// Upload Media
async function uploadMedia(token, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('alt_text', 'Uploaded image');
  
  const response = await fetch('http://localhost:8000/api/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return response.json();
}

// Usage
const token = await login('user@example.com', 'password123');
const posts = await getPosts(token);
console.log(posts);
```

#### Python (Requests)

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Login
def login(email, password):
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    response.raise_for_status()
    return response.json()["access_token"]

# Get Posts
def get_posts(token, page=1, limit=20):
    headers = {"Authorization": f"Bearer {token}"}
    params = {"page": page, "limit": limit}
    
    response = requests.get(
        f"{BASE_URL}/api/posts",
        headers=headers,
        params=params
    )
    response.raise_for_status()
    return response.json()

# Create Post
def create_post(token, post_data):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/posts",
        headers=headers,
        json=post_data
    )
    response.raise_for_status()
    return response.json()

# Upload Media
def upload_media(token, file_path):
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'alt_text': 'Uploaded image'}
        
        response = requests.post(
            f"{BASE_URL}/api/media/upload",
            headers=headers,
            files=files,
            data=data
        )
    
    response.raise_for_status()
    return response.json()

# Usage
token = login("user@example.com", "password123")
posts = get_posts(token)
print(json.dumps(posts, indent=2))

# Create new post
new_post = create_post(token, {
    "title": "My Post",
    "content": "# Content",
    "status": "published"
})
print(f"Created post with ID: {new_post['id']}")
```

#### TypeScript (Axios)

```typescript
import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'http://localhost:8000';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

interface PostCreate {
  title: string;
  content: string;
  status?: 'draft' | 'published' | 'archived';
  category_id?: number;
  tags?: string[];
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = BASE_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests automatically
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  async login(email: string, password: string): Promise<string> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
    
    this.token = response.data.access_token;
    return this.token;
  }

  async getPosts(params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    status?: string;
  }): Promise<Post[]> {
    const response = await this.client.get<{ items: Post[] }>('/api/posts', {
      params,
    });
    return response.data.items;
  }

  async getPost(id: number): Promise<Post> {
    const response = await this.client.get<Post>(`/api/posts/${id}`);
    return response.data;
  }

  async createPost(data: PostCreate): Promise<Post> {
    const response = await this.client.post<Post>('/api/posts', data);
    return response.data;
  }

  async updatePost(id: number, data: Partial<PostCreate>): Promise<Post> {
    const response = await this.client.put<Post>(`/api/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: number): Promise<void> {
    await this.client.delete(`/api/posts/${id}`);
  }

  async uploadMedia(file: File, altText?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('alt_text', altText);

    const response = await this.client.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

// Usage
const api = new ApiClient();

async function main() {
  // Login
  await api.login('user@example.com', 'password123');
  
  // Get posts
  const posts = await api.getPosts({ status: 'published', limit: 10 });
  console.log(`Found ${posts.length} posts`);
  
  // Create post
  const newPost = await api.createPost({
    title: 'TypeScript Guide',
    content: '# TypeScript\n\nTyping for JavaScript',
    status: 'published',
    tags: ['typescript', 'javascript'],
  });
  console.log(`Created post: ${newPost.id}`);
  
  // Update post
  await api.updatePost(newPost.id, {
    title: 'Complete TypeScript Guide',
  });
  
  // Delete post
  await api.deletePost(newPost.id);
}

main().catch(console.error);
```

#### cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get posts with filters
curl -X GET "http://localhost:8000/api/posts?page=1&limit=10&status=published" \
  -H "Authorization: Bearer $TOKEN"

# Create post
curl -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "New Post",
    "content": "# Content here",
    "status": "published",
    "tags": ["test"]
  }'

# Get single post
curl -X GET http://localhost:8000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"

# Update post
curl -X PUT http://localhost:8000/api/posts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Title"
  }'

# Delete post
curl -X DELETE http://localhost:8000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"

# Upload media
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "alt_text=My image"

# Get stats
curl -X GET http://localhost:8000/api/stats/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Clear cache
curl -X POST http://localhost:8000/api/cache/clear \
  -H "Authorization: Bearer $TOKEN"
```

#### PHP (Guzzle)

```php
<?php

require 'vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class ApiClient {
    private $client;
    private $token;
    
    public function __construct($baseUrl = 'http://localhost:8000') {
        $this->client = new Client([
            'base_uri' => $baseUrl,
            'headers' => [
                'Content-Type' => 'application/json',
            ]
        ]);
    }
    
    public function login($email, $password) {
        try {
            $response = $this->client->post('/api/auth/login', [
                'json' => [
                    'email' => $email,
                    'password' => $password
                ]
            ]);
            
            $data = json_decode($response->getBody(), true);
            $this->token = $data['access_token'];
            return $this->token;
        } catch (RequestException $e) {
            throw new Exception('Login failed: ' . $e->getMessage());
        }
    }
    
    private function getHeaders() {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Content-Type' => 'application/json'
        ];
    }
    
    public function getPosts($params = []) {
        $response = $this->client->get('/api/posts', [
            'headers' => $this->getHeaders(),
            'query' => $params
        ]);
        
        return json_decode($response->getBody(), true);
    }
    
    public function getPost($id) {
        $response = $this->client->get("/api/posts/{$id}", [
            'headers' => $this->getHeaders()
        ]);
        
        return json_decode($response->getBody(), true);
    }
    
    public function createPost($data) {
        $response = $this->client->post('/api/posts', [
            'headers' => $this->getHeaders(),
            'json' => $data
        ]);
        
        return json_decode($response->getBody(), true);
    }
    
    public function updatePost($id, $data) {
        $response = $this->client->put("/api/posts/{$id}", [
            'headers' => $this->getHeaders(),
            'json' => $data
        ]);
        
        return json_decode($response->getBody(), true);
    }
    
    public function deletePost($id) {
        $this->client->delete("/api/posts/{$id}", [
            'headers' => $this->getHeaders()
        ]);
    }
    
    public function uploadMedia($filePath, $altText = '') {
        $response = $this->client->post('/api/media/upload', [
            'headers' => ['Authorization' => 'Bearer ' . $this->token],
            'multipart' => [
                [
                    'name' => 'file',
                    'contents' => fopen($filePath, 'r')
                ],
                [
                    'name' => 'alt_text',
                    'contents' => $altText
                ]
            ]
        ]);
        
        return json_decode($response->getBody(), true);
    }
}

// Usage
$api = new ApiClient();

try {
    // Login
    $token = $api->login('user@example.com', 'password123');
    echo "Logged in successfully\n";
    
    // Get posts
    $posts = $api->getPosts(['status' => 'published', 'limit' => 10]);
    echo "Found " . count($posts['items']) . " posts\n";
    
    // Create post
    $newPost = $api->createPost([
        'title' => 'PHP Tutorial',
        'content' => '# PHP Guide',
        'status' => 'published',
        'tags' => ['php', 'tutorial']
    ]);
    echo "Created post ID: " . $newPost['id'] . "\n";
    
    // Update post
    $api->updatePost($newPost['id'], [
        'title' => 'Complete PHP Tutorial'
    ]);
    echo "Post updated\n";
    
    // Delete post
    $api->deletePost($newPost['id']);
    echo "Post deleted\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
```

#### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
)

const baseURL = "http://localhost:8000"

type ApiClient struct {
    client *http.Client
    token  string
}

type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

type LoginResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    TokenType    string `json:"token_type"`
}

type Post struct {
    ID        int      `json:"id"`
    Title     string   `json:"title"`
    Content   string   `json:"content"`
    Status    string   `json:"status"`
    Tags      []string `json:"tags"`
    CreatedAt string   `json:"created_at"`
}

type PostCreate struct {
    Title      string   `json:"title"`
    Content    string   `json:"content"`
    Status     string   `json:"status,omitempty"`
    CategoryID *int     `json:"category_id,omitempty"`
    Tags       []string `json:"tags,omitempty"`
}

func NewApiClient() *ApiClient {
    return &ApiClient{
        client: &http.Client{},
    }
}

func (c *ApiClient) Login(email, password string) error {
    loginReq := LoginRequest{
        Email:    email,
        Password: password,
    }
    
    jsonData, err := json.Marshal(loginReq)
    if err != nil {
        return err
    }
    
    resp, err := c.client.Post(
        baseURL+"/api/auth/login",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    var loginResp LoginResponse
    if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
        return err
    }
    
    c.token = loginResp.AccessToken
    return nil
}

func (c *ApiClient) doRequest(method, path string, body interface{}) (*http.Response, error) {
    var reqBody io.Reader
    
    if body != nil {
        jsonData, err := json.Marshal(body)
        if err != nil {
            return nil, err
        }
        reqBody = bytes.NewBuffer(jsonData)
    }
    
    req, err := http.NewRequest(method, baseURL+path, reqBody)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Content-Type", "application/json")
    if c.token != "" {
        req.Header.Set("Authorization", "Bearer "+c.token)
    }
    
    return c.client.Do(req)
}

func (c *ApiClient) GetPosts() ([]Post, error) {
    resp, err := c.doRequest("GET", "/api/posts", nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result struct {
        Items []Post `json:"items"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return result.Items, nil
}

func (c *ApiClient) CreatePost(post PostCreate) (*Post, error) {
    resp, err := c.doRequest("POST", "/api/posts", post)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var newPost Post
    if err := json.NewDecoder(resp.Body).Decode(&newPost); err != nil {
        return nil, err
    }
    
    return &newPost, nil
}

func (c *ApiClient) DeletePost(id int) error {
    path := fmt.Sprintf("/api/posts/%d", id)
    resp, err := c.doRequest("DELETE", path, nil)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    return nil
}

func (c *ApiClient) UploadMedia(filePath, altText string) (map[string]interface{}, error) {
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()
    
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    
    part, err := writer.CreateFormFile("file", filePath)
    if err != nil {
        return nil, err
    }
    
    if _, err := io.Copy(part, file); err != nil {
        return nil, err
    }
    
    if err := writer.WriteField("alt_text", altText); err != nil {
        return nil, err
    }
    
    writer.Close()
    
    req, err := http.NewRequest("POST", baseURL+"/api/media/upload", body)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("Authorization", "Bearer "+c.token)
    
    resp, err := c.client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return result, nil
}

func main() {
    client := NewApiClient()
    
    // Login
    if err := client.Login("user@example.com", "password123"); err != nil {
        fmt.Printf("Login failed: %v\n", err)
        return
    }
    fmt.Println("Logged in successfully")
    
    // Get posts
    posts, err := client.GetPosts()
    if err != nil {
        fmt.Printf("Failed to get posts: %v\n", err)
        return
    }
    fmt.Printf("Found %d posts\n", len(posts))
    
    // Create post
    newPost, err := client.CreatePost(PostCreate{
        Title:   "Go Tutorial",
        Content: "# Learning Go",
        Status:  "published",
        Tags:    []string{"go", "tutorial"},
    })
    if err != nil {
        fmt.Printf("Failed to create post: %v\n", err)
        return
    }
    fmt.Printf("Created post ID: %d\n", newPost.ID)
    
    // Delete post
    if err := client.DeletePost(newPost.ID); err != nil {
        fmt.Printf("Failed to delete post: %v\n", err)
        return
    }
    fmt.Println("Post deleted successfully")
}
```

#### Generatori di Client SDK

Puoi generare automaticamente client SDK in qualsiasi linguaggio usando **OpenAPI Generator**:

```bash
# Installa OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Scarica OpenAPI spec
curl http://localhost:8000/openapi.json > openapi.json

# Genera client TypeScript
openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-fetch \
  -o ./sdk/typescript

# Genera client Python
openapi-generator-cli generate \
  -i openapi.json \
  -g python \
  -o ./sdk/python

# Genera client Java
openapi-generator-cli generate \
  -i openapi.json \
  -g java \
  -o ./sdk/java

# Altri generatori disponibili:
# - ruby
# - php
# - kotlin
# - swift
# - rust
# - csharp
# - dart
# - elixir
# ... e molti altri
```

---

## *Access Token:** 1 ora
- **Refresh Token:** 7 giorni

---

## OpenAPI YAML Specification

```yaml
openapi: 3.0.3
info:
  title: CMS API
  description: API completa per gestione CMS con contenuti, media, temi e utenti
  version: 1.0.0
  contact:
    name: Support Team
    email: support@cms.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:8000
    description: Development server
  - url: https://api.cms.com
    description: Production server

tags:
  - name: Auth
    description: Autenticazione e gestione sessioni
  - name: Posts
    description: Gestione articoli/post
  - name: Categories
    description: Gestione categorie
  - name: Pages
    description: Gestione pagine statiche
  - name: Media
    description: Upload e gestione file media
  - name: Users
    description: Gestione utenti
  - name: Stats
    description: Statistiche e analytics
  - name: Cache
    description: Gestione cache

security:
  - BearerAuth: []

paths:
  # AUTH ENDPOINTS
  /api/auth/register:
    post:
      tags:
        - Auth
      summary: Registra nuovo utente
      description: Crea un nuovo account utente con email e password
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
                - full_name
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  format: password
                  minLength: 8
                  example: SecurePass123!
                full_name:
                  type: string
                  example: Mario Rossi
      responses:
        '201':
          description: Utente registrato con successo
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '400':
          description: Dati non validi
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                detail: Email già registrata
        '422':
          description: Validazione fallita
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'

  /api/auth/login:
    post:
      tags:
        - Auth
      summary: Login utente
      description: Autenticazione con email e password, ritorna access e refresh token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  format: password
                  example: SecurePass123!
      responses:
        '200':
          description: Login effettuato con successo
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  refresh_token:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  token_type:
                    type: string
                    example: bearer
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Credenziali non valide
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              example:
                detail: Email o password errati

  /api/auth/refresh:
    post:
      tags:
        - Auth
      summary: Refresh access token
      description: Ottieni nuovo access token usando refresh token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refresh_token
              properties:
                refresh_token:
                  type: string
                  example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      responses:
        '200':
          description: Nuovo access token generato
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  token_type:
                    type: string
                    example: bearer
        '401':
          description: Refresh token non valido o scaduto
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/auth/me:
    get:
      tags:
        - Auth
      summary: Ottieni utente corrente
      description: Recupera informazioni dell'utente autenticato
      responses:
        '200':
          description: Dati utente
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  # POSTS ENDPOINTS
  /api/posts:
    get:
      tags:
        - Posts
      summary: Lista posts
      description: Recupera lista posts con filtri, paginazione e ordinamento
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
          example: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
          example: 20
        - name: category_id
          in: query
          schema:
            type: integer
          description: Filtra per categoria
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, published, archived]
          description: Filtra per stato
        - name: search
          in: query
          schema:
            type: string
          description: Cerca nel titolo e contenuto
          example: javascript
        - name: sort
          in: query
          schema:
            type: string
            enum: [created_at, updated_at, title, views]
            default: created_at
        - name: order
          in: query
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: Lista posts
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/Post'
                  total:
                    type: integer
                    example: 150
                  page:
                    type: integer
                    example: 1
                  limit:
                    type: integer
                    example: 20
                  pages:
                    type: integer
                    example: 8

    post:
      tags:
        - Posts
      summary: Crea nuovo post
      description: Crea un nuovo articolo/post
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostCreate'
            example:
              title: Guida completa a Next.js 15
              slug: guida-nextjs-15
              content: "# Introduzione\n\nNext.js 15 porta nuove funzionalità..."
              excerpt: Scopri le novità di Next.js 15
              status: published
              category_id: 1
              featured_image: /uploads/nextjs.jpg
              tags: ["nextjs", "react", "javascript"]
              meta_title: Guida Next.js 15 - Tutorial completo
              meta_description: Tutorial completo su Next.js 15 con esempi pratici
      responses:
        '201':
          description: Post creato con successo
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '422':
          $ref: '#/components/responses/ValidationError'

  /api/posts/{id}:
    get:
      tags:
        - Posts
      summary: Ottieni post per ID
      description: Recupera singolo post con dettagli completi
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
          example: 1
      responses:
        '200':
          description: Dettagli post
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          $ref: '#/components/responses/NotFoundError'

    put:
      tags:
        - Posts
      summary: Aggiorna post
      description: Aggiorna post esistente
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostUpdate'
      responses:
        '200':
          description: Post aggiornato
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          $ref: '#/components/responses/NotFoundError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

    delete:
      tags:
        - Posts
      summary: Elimina post
      description: Elimina post definitivamente
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Post eliminato con successo
        '404':
          $ref: '#/components/responses/NotFoundError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/posts/slug/{slug}:
    get:
      tags:
        - Posts
      summary: Ottieni post per slug
      description: Recupera post usando lo slug URL
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
          example: guida-nextjs-15
      responses:
        '200':
          description: Dettagli post
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          $ref: '#/components/responses/NotFoundError'

  # CATEGORIES ENDPOINTS
  /api/categories:
    get:
      tags:
        - Categories
      summary: Lista categorie
      description: Recupera tutte le categorie con conteggio post
      responses:
        '200':
          description: Lista categorie
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Category'

    post:
      tags:
        - Categories
      summary: Crea categoria
      description: Crea nuova categoria
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CategoryCreate'
            example:
              name: Web Development
              slug: web-development
              description: Tutorial e guide sullo sviluppo web
      responses:
        '201':
          description: Categoria creata
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Category'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/categories/{id}:
    get:
      tags:
        - Categories
      summary: Ottieni categoria
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Dettagli categoria
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Category'
        '404':
          $ref: '#/components/responses/NotFoundError'

    put:
      tags:
        - Categories
      summary: Aggiorna categoria
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CategoryUpdate'
      responses:
        '200':
          description: Categoria aggiornata
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Category'
        '404':
          $ref: '#/components/responses/NotFoundError'

    delete:
      tags:
        - Categories
      summary: Elimina categoria
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Categoria eliminata
        '404':
          $ref: '#/components/responses/NotFoundError'
        '400':
          description: Categoria contiene posts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  # PAGES ENDPOINTS
  /api/pages:
    get:
      tags:
        - Pages
      summary: Lista pagine
      description: Recupera tutte le pagine statiche
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, published, archived]
      responses:
        '200':
          description: Lista pagine
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Page'

    post:
      tags:
        - Pages
      summary: Crea pagina
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PageCreate'
            example:
              title: Chi Siamo
              slug: chi-siamo
              content: "## La nostra storia\n\nFondata nel 2020..."
              status: published
              template: default
              meta_title: Chi Siamo - La nostra storia
              meta_description: Scopri la storia del nostro team
      responses:
        '201':
          description: Pagina creata
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Page'

  /api/pages/{id}:
    get:
      tags:
        - Pages
      summary: Ottieni pagina
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Dettagli pagina
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Page'

    put:
      tags:
        - Pages
      summary: Aggiorna pagina
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PageUpdate'
      responses:
        '200':
          description: Pagina aggiornata
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Page'

    delete:
      tags:
        - Pages
      summary: Elimina pagina
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Pagina eliminata

  # MEDIA ENDPOINTS
  /api/media/upload:
    post:
      tags:
        - Media
      summary: Upload file
      description: Carica file media (immagini, video, documenti)
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - file
              properties:
                file:
                  type: string
                  format: binary
                  description: File da caricare (max 10MB)
                alt_text:
                  type: string
                  description: Testo alternativo per accessibilità
                  example: Screenshot dashboard
      responses:
        '201':
          description: File caricato con successo
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Media'
              example:
                id: 1
                filename: screenshot-1234567890.jpg
                original_filename: screenshot.jpg
                file_path: /uploads/2026/01/screenshot-1234567890.jpg
                file_size: 245678
                mime_type: image/jpeg
                alt_text: Screenshot dashboard
                width: 1920
                height: 1080
                created_at: "2026-01-10T10:30:00Z"
        '400':
          description: File non valido
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              examples:
                file_too_large:
                  value:
                    detail: File troppo grande (max 10MB)
                invalid_format:
                  value:
                    detail: Formato file non supportato
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /api/media:
    get:
      tags:
        - Media
      summary: Lista media
      description: Recupera tutti i file media caricati
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
        - name: type
          in: query
          schema:
            type: string
            enum: [image, video, document]
          description: Filtra per tipo file
      responses:
        '200':
          description: Lista media
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/Media'
                  total:
                    type: integer
                  page:
                    type: integer
                  limit:
                    type: integer

  /api/media/{id}:
    get:
      tags:
        - Media
      summary: Ottieni media
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Dettagli media
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Media'

    delete:
      tags:
        - Media
      summary: Elimina media
      description: Elimina file media e rimuove file dal server
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Media eliminato
        '404':
          $ref: '#/components/responses/NotFoundError'

  # USERS ENDPOINTS
  /api/users:
    get:
      tags:
        - Users
      summary: Lista utenti
      description: Recupera lista utenti (solo admin)
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
        - name: role
          in: query
          schema:
            type: string
            enum: [admin, editor, author, subscriber]
      responses:
        '200':
          description: Lista utenti
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  total:
                    type: integer
        '403':
          $ref: '#/components/responses/ForbiddenError'

    post:
      tags:
        - Users
      summary: Crea utente
      description: Crea nuovo utente (solo admin)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
      responses:
        '201':
          description: Utente creato
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /api/users/{id}:
    get:
      tags:
        - Users
      summary: Ottieni utente
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Dettagli utente
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

    put:
      tags:
        - Users
      summary: Aggiorna utente
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdate'
      responses:
        '200':
          description: Utente aggiornato
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

    delete:
      tags:
        - Users
      summary: Elimina utente
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '204':
          description: Utente eliminato

  # STATS ENDPOINTS
  /api/stats/dashboard:
    get:
      tags:
        - Stats
      summary: Dashboard stats
      description: Statistiche generali per dashboard admin
      responses:
        '200':
          description: Statistiche dashboard
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_posts:
                    type: integer
                    example: 150
                  published_posts:
                    type: integer
                    example: 120
                  draft_posts:
                    type: integer
                    example: 25
                  total_views:
                    type: integer
                    example: 45000
                  total_users:
                    type: integer
                    example: 250
                  total_categories:
                    type: integer
                    example: 12
                  total_media:
                    type: integer
                    example: 450
                  disk_usage:
                    type: object
                    properties:
                      used:
                        type: integer
                        example: 2500000000
                      total:
                        type: integer
                        example: 10000000000
                      percentage:
                        type: number
                        format: float
                        example: 25.5

  /api/stats/posts:
    get:
      tags:
        - Stats
      summary: Post statistics
      description: Statistiche dettagliate sui post
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [day, week, month, year]
            default: month
      responses:
        '200':
          description: Statistiche post
          content:
            application/json:
              schema:
                type: object
                properties:
                  views_by_date:
                    type: array
                    items:
                      type: object
                      properties:
                        date:
                          type: string
                          format: date
                        views:
                          type: integer
                  top_posts:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: integer
                        title:
                          type: string
                        views:
                          type: integer
                  categories_distribution:
                    type: array
                    items:
                      type: object
                      properties:
                        category:
                          type: string
                        count:
                          type: integer

  # CACHE ENDPOINTS
  /api/cache/clear:
    post:
      tags:
        - Cache
      summary: Clear cache
      description: Svuota completamente la cache (solo admin)
      responses:
        '200':
          description: Cache svuotata
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Cache cleared successfully
                  cleared_keys:
                    type: integer
                    example: 47
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /api/cache/clear/{key}:
    delete:
      tags:
        - Cache
      summary: Clear specific cache key
      description: Elimina chiave cache specifica
      parameters:
        - name: key
          in: path
          required: true
          schema:
            type: string
          example: posts:list:page_1
      responses:
        '200':
          description: Chiave cache eliminata
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Cache key cleared

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token ottenuto dal login

  schemas:
    # USER SCHEMAS
    User:
      type: object
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: user@example.com
        full_name:
          type: string
          example: Mario Rossi
        role:
          type: string
          enum: [admin, editor, author, subscriber]
          example: author
        avatar:
          type: string
          nullable: true
          example: /uploads/avatars/user-1.jpg
        bio:
          type: string
          nullable: true
          example: Web developer e blogger
        is_active:
          type: boolean
          example: true
        created_at:
          type: string
          format: date-time
          example: "2026-01-01T10:00:00Z"
        updated_at:
          type: string
          format: date-time
          example: "2026-01-10T15:30:00Z"

    UserCreate:
      type: object
      required:
        - email
        - password
        - full_name
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          format: password
          minLength: 8
        full_name:
          type: string
        role:
          type: string
          enum: [admin, editor, author, subscriber]
          default: subscriber

    UserUpdate:
      type: object
      properties:
        email:
          type: string
          format: email
        full_name:
          type: string
        role:
          type: string
          enum: [admin, editor, author, subscriber]
        avatar:
          type: string
        bio:
          type: string
        is_active:
          type: boolean

    UserResponse:
      allOf:
        - $ref: '#/components/schemas/User'
        - type: object
          properties:
            message:
              type: string
              example: User registered successfully

    # POST SCHEMAS
    Post:
      type: object
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
          example: Guida completa a Next.js 15
        slug:
          type: string
          example: guida-nextjs-15
        content:
          type: string
          example: "# Introduzione\n\nNext.js 15 porta..."
        excerpt:
          type: string
          nullable: true
          example: Scopri le novità di Next.js 15
        status:
          type: string
          enum: [draft, published, archived]
          example: published
        category_id:
          type: integer
          nullable: true
          example: 1
        category:
          $ref: '#/components/schemas/Category'
        author_id:
          type: integer
          example: 1
        author:
          $ref: '#/components/schemas/User'
        featured_image:
          type: string
          nullable: true
          example: /uploads/nextjs.jpg
        tags:
          type: array
          items:
            type: string
          example: ["nextjs", "react", "javascript"]
        meta_title:
          type: string
          nullable: true
        meta_description:
          type: string
          nullable: true
        views:
          type: integer
          example: 1250
        published_at:
          type: string
          format: date-time
          nullable: true
          example: "2026-01-05T10:00:00Z"
        created_at:
          type: string
          format: date-time
          example: "2026-01-01T10:00:00Z"
        updated_at:
          type: string
          format: date-time
          example: "2026-01-10T15:30:00Z"

    PostCreate:
      type: object
      required:
        - title
        - content
      properties:
        title:
          type: string
        slug:
          type: string
        content:
          type: string
        excerpt:
          type: string
        status:
          type: string
          enum: [draft, published, archived]
          default: draft
        category_id:
          type: integer
        featured_image:
          type: string
        tags:
          type: array
          items:
            type: string
        meta_title:
          type: string
        meta_description:
          type: string

    PostUpdate:
      type: object
      properties:
        title:
          type: string
        slug:
          type: string
        content:
          type: string
        excerpt:
          type: string
        status:
          type: string
          enum: [draft, published, archived]
        category_id:
          type: integer
        featured_image:
          type: string
        tags:
          type: array
          items:
            type: string
        meta_title:
          type: string
        meta_description:
          type: string

    # CATEGORY SCHEMAS
    Category:
      type: object
      properties:
        id:
          type: integer
          example: 1
        name:
          type: string
          example: Web Development
        slug:
          type: string
          example: web-development
        description:
          type: string
          nullable: true
          example: Tutorial e guide sullo sviluppo web
        post_count:
          type: integer
          example: 25
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    CategoryCreate:
      type: object
      required:
        - name
      properties:
        name:
          type: string
        slug:
          type: string
        description:
          type: string

    CategoryUpdate:
      type: object
      properties:
        name:
          type: string
        slug:
          type: string
        description:
          type: string

    # PAGE SCHEMAS
    Page:
      type: object
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
          example: Chi Siamo
        slug:
          type: string
          example: chi-siamo
        content:
          type: string
        status:
          type: string
          enum: [draft, published, archived]
        template:
          type: string
          example: default
        meta_title:
          type: string
          nullable: true
        meta_description:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    PageCreate:
      type: object
      required:
        - title
        - content
      properties:
        title:
          type: string
        slug:
          type: string
        content:
          type: string
        status:
          type: string
          enum: [draft, published, archived]
          default: draft
        template:
          type: string
          default: default
        meta_title:
          type: string
        meta_description:
          type: string

    PageUpdate:
      type: object
      properties:
        title:
          type: string
        slug:
          type: string
        content:
          type: string
        status:
          type: string
          enum: [draft, published, archived]
        template:
          type: string
        meta_title:
          type: string
        meta_description:
          type: string

    # MEDIA SCHEMAS
    Media:
      type: object
      properties:
        id:
          type: integer
          example: 1
        filename:
          type: string
          example: image-1234567890.jpg
        original_filename:
          type: string
          example: my-image.jpg
        file_path:
          type: string
          example: /uploads/2026/01/image-1234567890.jpg
        file_size:
          type: integer
          description: Size in bytes
          example: 245678
        mime_type:
          type: string
          example: image/jpeg
        alt_text:
          type: string
          nullable: true
          example: Screenshot dashboard
        width:
          type: integer
          nullable: true
          example: 1920
        height:
          type: integer
          nullable: true
          example: 1080
        uploaded_by:
          type: integer
          example: 1
        created_at:
          type: string
          format: date-time

    # ERROR SCHEMAS
    Error:
      type: object
      properties:
        detail:
          type: string
          example: Resource not found

    ValidationError:
      type: object
      properties:
        detail:
          type: array
          items:
            type: object
            properties:
              loc:
                type: array
                items:
                  oneOf:
                    - type: string
                    - type: integer
                example: ["body", "email"]
              msg:
                type: string
                example: field required
              type:
                type: string
                example: value_error.missing

  responses:
    UnauthorizedError:
      description: Token mancante o non valido
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            detail: Not authenticated

    ForbiddenError:
      description: Permessi insufficienti
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            detail: Insufficient permissions

    NotFoundError:
      description: Risorsa non trovata
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            detail: Resource not found

    BadRequestError:
      description: Richiesta non valida
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            detail: Invalid request data

    ValidationError:
      description: Errore di validazione
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ValidationError'
```

---

## Error Responses

### Struttura Error Standard

```json
{
  "detail": "Messaggio di errore descrittivo"
}
```

### Codici HTTP

| Codice | Significato | Quando avviene |
|--------|-------------|----------------|
| 200 | OK | Richiesta completata con successo |
| 201 | Created | Risorsa creata con successo |
| 204 | No Content | Eliminazione completata con successo |
| 400 | Bad Request | Dati richiesta non validi |
| 401 | Unauthorized | Token mancante o scaduto |
| 403 | Forbidden | Permessi insufficienti |
| 404 | Not Found | Risorsa non trovata |
| 422 | Unprocessable Entity | Errore validazione dati |
| 500 | Internal Server Error | Errore server |

### Esempi Error Responses

#### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

#### 403 Forbidden

```json
{
  "detail": "Insufficient permissions. Admin role required"
}
```

#### 404 Not Found

```json
{
  "detail": "Post with id 999 not found"
}
```

#### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 8 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

---

## Rate Limiting

L'API implementa rate limiting per prevenire abusi:

- **Limite generale:** 100 richieste / minuto per IP
- **Login endpoint:** 5 tentativi / 15 minuti per IP
- **Upload media:** 10 upload / ora per utente

### Headers Rate Limit

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1641998400
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "detail": "Rate limit exceeded. Try again in 60 seconds"
}
```

---

## Pagination

Le liste supportano paginazione con parametri query:

- `page`: Numero pagina (default: 1)
- `limit`: Elementi per pagina (default: 20, max: 100)

### Response Format

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

---

## Filtering & Sorting

### Filtering

Usa parametri query per filtrare:

```http
GET /api/posts?category_id=1&status=published&search=javascript
```

### Sorting

```http
GET /api/posts?sort=created_at&order=desc
```

Parametri disponibili:
- `sort`: Campo per ordinamento
- `order`: `asc` o `desc`

---

## Testing

### Swagger UI

Documentazione interattiva disponibile su:

```
http://localhost:8000/docs
```

### ReDoc

Documentazione alternativa:

```
http://localhost:8000/redoc
```

### cURL Examples

#### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Create Post (Authenticated)

```bash
curl -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "My New Post",
    "content": "Post content here",
    "status": "published"
  }'
```

#### Upload Media

```bash
curl -X POST http://localhost:8000/api/media/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "alt_text=Description"
```

---

## Security Best Practices

### Headers Sicurezza

L'API include headers di sicurezza:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CORS

CORS configurato per domini autorizzati:

```python
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://yourdomain.com"
]
```

### Password Requirements

- Minimo 8 caratteri
- Almeno 1 lettera maiuscola
- Almeno 1 lettera minuscola
- Almeno 1 numero
- Almeno 1 carattere speciale

---

## API Features

Storico completo delle modifiche, feature aggiunte e breaking changes.

### v1.0.0 (2026-01-10) - Current Stable

**🎉 Initial Release**

#### Features

- ✅ **Authentication System**
  - JWT-based authentication
  - Access + Refresh token flow
  - Password hashing con bcrypt
  - Email validation
  - Role-based access control (admin, editor, author, subscriber)

- ✅ **Posts Management**
  - CRUD completo
  - Rich text content support
  - SEO metadata (meta_title, meta_description)
  - Slug auto-generation
  - Status workflow (draft → published → archived)
  - Tag system
  - Featured images
  - View counter
  - Search full-text

- ✅ **Categories**
  - CRUD completo
  - Hierarchical structure support
  - Post count per categoria
  - Slug URL-friendly

- ✅ **Pages System**
  - Static pages management
  - Template selection
  - SEO optimization
  - Custom slugs

- ✅ **Media Library**
  - Upload multipart
  - Image optimization automatic
  - Thumbnail generation
  - File size validation (max 10MB)
  - Supported formats: JPEG, PNG, GIF, WebP, PDF
  - Alt text per accessibilità
  - Usage tracking

- ✅ **Users Management**
  - User CRUD (admin only)
  - Profile editing
  - Avatar upload
  - Bio field
  - Activity status (active/inactive)

- ✅ **Statistics & Analytics**
  - Dashboard overview
  - Post views tracking
  - User activity
  - Storage usage
  - Popular posts
  - Category distribution

- ✅ **Cache System**
  - Redis integration
  - Automatic cache invalidation
  - Cache per endpoint
  - Manual clear support

- ✅ **API Features**
  - OpenAPI 3.0 specification
  - Swagger UI documentation
  - ReDoc alternative
  - Rate limiting (100 req/min)
  - Pagination support
  - Sorting & filtering
  - CORS enabled
  - Security headers

#### Performance

- ⚡ Response time: < 100ms (p95)
- ⚡ Database queries optimized with indexes
- ⚡ Redis caching layer
- ⚡ Async operations
- ⚡ Connection pooling

#### Security

- 🔒 JWT tokens with expiration
- 🔒 Password hashing (bcrypt)
- 🔒 SQL injection prevention
- 🔒 XSS protection headers
- 🔒 CSRF tokens
- 🔒 Rate limiting
- 🔒 Input validation
- 🔒 File upload sanitization

#### API Endpoints

**Total:** 45 endpoints

- **Auth:** 4 endpoints
- **Posts:** 12 endpoints
- **Categories:** 8 endpoints
- **Pages:** 8 endpoints
- **Media:** 6 endpoints
- **Users:** 10 endpoints
- **Stats:** 4 endpoints
- **Cache:** 3 endpoints

#### Known Issues

- 🐛 Large file uploads (>10MB) may timeout on slow connections
  - **Workaround:** Use chunked upload
  - **Fix planned:** v1.1.0

- 🐛 Search con caratteri speciali può dare risultati incompleti
  - **Workaround:** Escape special characters
  - **Fix planned:** v1.0.1

#### Breaking Changes

Nessuno (initial release)

---

### v1.0.1 (Planned - 2026-01-20)

**🐛 Bug Fixes & Minor Improvements**

#### Bug Fixes

- 🐛 Fix search con caratteri speciali (accenti, emoji)
- 🐛 Correggi timezone inconsistencies nei timestamp
- 🐛 Fix cache invalidation per nested resources

#### Improvements

- ⚡ Ottimizza query database per lista posts (50% più veloce)
- 📝 Aggiungi esempi cURL nella documentazione
- 🔧 Migliora error messages validation

#### Deprecations

Nessuna

#### Breaking Changes

Nessuno

---

### v1.1.0 (Planned - 2026-02-15)

**✨ New Features**

#### Features

- ✅ **Chunked Upload** per file grandi (>10MB)
- ✅ **Bulk Operations**
  - Bulk delete posts
  - Bulk update status
  - Bulk assign category
- ✅ **Advanced Search**
  - Elasticsearch integration
  - Full-text search ottimizzato
  - Faceted search
  - Search suggestions
- ✅ **Comments System**
  - Comment CRUD
  - Nested replies (3 levels)
  - Moderation queue
  - Spam detection
- ✅ **Webhooks**
  - Event subscription
  - Retry policy
  - Signature verification
- ✅ **Export/Import**
  - Export posts to JSON/CSV
  - Import batch posts
  - Backup/restore

#### Performance

- ⚡ GraphQL endpoint (alternative to REST)
- ⚡ Response compression (gzip)
- ⚡ Image lazy loading
- ⚡ Database query caching layer 2

#### Deprecations

- ⚠️ `POST /api/auth/login` parameter `remember_me` → usa `expires_in`
- ⚠️ `GET /api/posts/{id}/views` endpoint → usa campo `views` in main endpoint

#### Breaking Changes

Nessuno (backward compatible)

---

### v2.0.0 (Planned - 2026-03-01)

**🚀 Major Release - Breaking Changes**

#### Breaking Changes

##### 1. Response Envelope

```diff
# v1
{
  "items": [...],
  "total": 100
}

# v2
{
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "pages": 10
    }
  },
  "meta": {
    "version": "2.0.0"
  }
}
```

##### 2. Error Format

```diff
# v1
{ "detail": "Not found" }

# v2
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { ... }
  }
}
```

##### 3. Authentication

- Nuovo endpoint: `POST /api/v2/auth/token` (invece di `/api/auth/login`)
- API Keys support: `X-API-Key` header
- OAuth2 support (Google, GitHub)

##### 4. Date Format

```diff
# v1
"created_at": "2026-01-10T15:30:00Z"

# v2
"created_at": "2026-01-10T15:30:00.123456Z"  # microseconds
```

#### New Features

- ✅ GraphQL API completa
- ✅ Real-time subscriptions (WebSocket)
- ✅ Multi-tenancy support
- ✅ Advanced permissions (field-level)
- ✅ Content versioning
- ✅ Workflow approval system
- ✅ A/B testing framework
- ✅ Analytics dashboard avanzato
- ✅ CDN integration
- ✅ Multi-language content

#### Migration Guide

Full guide: https://docs.cms.com/migration/v2

**Timeline:**

- **2026-02-01:** v2 beta release
- **2026-03-01:** v2 stable + v1 deprecation
- **2027-03-01:** v1 end-of-life

#### Removed Features

- ❌ `/api/posts/{id}/views` endpoint
- ❌ `remember_me` login parameter
- ❌ String-based `category` filter (solo `category_id`)

---

### Release Notes Archive

**Versioning Schema:**

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: Breaking changes
MINOR: New features (backward-compatible)
PATCH: Bug fixes
```

**Release Frequency:**

- **Major:** ~12 months
- **Minor:** ~6-8 weeks
- **Patch:** ~2 weeks (or hotfix)

**Support Policy:**

- **Current version:** Full support
- **Previous major:** Security fixes only (12 months)
- **Older versions:** No supportcreato | Post completo |
| `post.updated` | Post aggiornato | Post completo + campi modificati |
| `post.deleted` | Post eliminato | ID e metadata |
| `post.published` | Post pubblicato (cambio status) | Post completo |
| `user.registered` | Nuovo utente registrato | User (no password) |
| `media.uploaded` | File media caricato | Media completo |
| `category.created` | Categoria creata | Category completa |
| `comment.created` | Commento aggiunto | Comment + Post ID |

#### Configurazione Webhook

##### 1. Registra Webhook Endpoint

```bash
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/cms",
  "events": ["post.created", "post.published"],
  "secret": "your_webhook_secret_key",
  "active": true
}
```

**Response:**

```json
{
  "id": 1,
  "url": "https://your-app.com/webhooks/cms",
  "events": ["post.created", "post.published"],
  "active": true,
  "created_at": "2026-01-10T10:00:00Z"
}
```

##### 2. Webhook Payload Structure

Quando un evento viene triggerato, riceverai una POST request:

```json
{
  "event": "post.created",
  "timestamp": "2026-01-10T15:30:00Z",
  "webhook_id": 1,
  "data": {
    "id": 123,
    "title": "New Post Title",
    "status": "published",
    "author": {
      "id": 1,
      "email": "author@example.com"
    },
    "created_at": "2026-01-10T15:30:00Z"
  },
  "metadata": {
    "api_version": "1.0.0",
    "environment": "production"
  }
}
```

**Headers inviati:**

```http
POST /webhooks/cms HTTP/1.1
Host: your-app.com
Content-Type: application/json
X-Webhook-Event: post.created
X-Webhook-ID: 1
X-Webhook-Signature: sha256=abc123...
User-Agent: CMS-Webhook/1.0
```

##### 3. Verifica Signature

Per verificare l'autenticità del webhook, valida la signature HMAC:

**Python:**

```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)

# Usage
payload = request.body.decode()
signature = request.headers.get('X-Webhook-Signature')
secret = 'your_webhook_secret_key'

if verify_webhook_signature(payload, signature, secret):
    # Process webhook
    data = json.loads(payload)
    print(f"Event: {data['event']}")
else:
    # Invalid signature
    return 401
```

**JavaScript:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

// Usage in Express
app.post('/webhooks/cms', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();
  
  if (verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    const data = JSON.parse(payload);
    console.log('Event:', data.event);
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});
```

##### 4. Gestione Webhook

**Lista webhook:**

```bash
GET /api/webhooks
Authorization: Bearer <token>
```

**Aggiorna webhook:**

```bash
PUT /api/webhooks/{id}
Authorization: Bearer <token>

{
  "events": ["post.created", "post.updated", "post.deleted"],
  "active": true
}
```

**Elimina webhook:**

```bash
DELETE /api/webhooks/{id}
Authorization: Bearer <token>
```

**Test webhook:**

```bash
POST /api/webhooks/{id}/test
Authorization: Bearer <token>

{
  "event": "post.created"
}
```

##### 5. Retry Policy

- **Tentativi:** 3 retry automatici
- **Backoff:** Exponential (1s, 5s, 25s)
- **Timeout:** 10 secondi per richiesta
- **Success:** Status code 200-299
- **Failure:** Status code >= 300 o timeout

Se tutti i retry falliscono, il webhook viene marcato come `failed` e riceverai un'email di notifica.

**Webhook Logs:**

```bash
GET /api/webhooks/{id}/logs
Authorization: Bearer <token>
```

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "event": "post.created",
      "status": "success",
      "attempts": 1,
      "response_code": 200,
      "response_time_ms": 145,
      "created_at": "2026-01-10T15:30:00Z"
    },
    {
      "id": 2,
      "event": "post.updated",
      "status": "failed",
      "attempts": 3,
      "last_error": "Connection timeout",
      "created_at": "2026-01-10T16:00:00Z"
    }
  ],
  "total": 2
}
```

#### Best Practices

1. **Idempotenza:** Gestisci duplicati (stesso evento può arrivare più volte)
2. **Async Processing:** Rispendi 200 immediatamente, processa in background
3. **Validazione:** Verifica sempre la signature
4. **Logging:** Salva tutti i webhook ricevuti per debugging
5. **Monitoring:** Monitora failure rate e response times

---

### Rate Limiting

L'API implementa **rate limiting** gerarchico per prevenire abusi e garantire fair usage.

#### Rate Limits per Categoria

| Categoria | Limite | Finestra | Scope |
|-----------|--------|----------|-------|
| **Global** | 1000 req | 1 ora | Per IP |
| **Auth** | 5 tentativi | 15 minuti | Per IP |
| **API Generale** | 100 req | 1 minuto | Per utente |
| **Upload Media** | 10 upload | 1 ora | Per utente |
| **Webhook Delivery** | 100 eventi | 1 ora | Per webhook |
| **Search/Query** | 30 req | 1 minuto | Per utente |

#### Headers Rate Limit

Ogni response include headers informativi:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1641998400
X-RateLimit-Used: 13
Retry-After: 60
```

**Descrizione Headers:**

- `X-RateLimit-Limit`: Limite massimo richieste
- `X-RateLimit-Remaining`: Richieste rimanenti
- `X-RateLimit-Reset`: Timestamp Unix reset limite
- `X-RateLimit-Used`: Richieste già utilizzate
- `Retry-After`: Secondi prima di poter riprovare (solo su 429)

#### Response 429 - Rate Limit Exceeded

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1641998460

{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded. Try again in 60 seconds",
  "details": {
    "limit": 100,
    "window": "1 minute",
    "reset_at": "2026-01-10T15:31:00Z"
  }
}
```

#### Strategie di Rate Limiting

##### Token Bucket Algorithm

```
Bucket Capacity: 100 tokens
Refill Rate: 100 tokens/minute (1.67 tokens/second)

Ogni richiesta consuma 1 token
Se bucket vuoto → 429 Too Many Requests
```

##### Sliding Window

```
Window: 60 secondi
Contatore sliding per calcolo preciso
Esempio: 50 req a t=0, 50 req a t=30 → OK
         50 req a t=0, 51 req a t=30 → 429 su ultima
```

#### Aumentare Rate Limits

Per applicazioni che richiedono limiti superiori:

1. **Business Plan:** 500 req/min, 50 upload/ora
2. **Enterprise Plan:** 2000 req/min, 200 upload/ora, limiti custom
3. **API Key Dedicata:** Limiti separati per ogni API key

**Richiesta aumento limite:**

```bash
POST /api/rate-limit/increase-request
Authorization: Bearer <token>

{
  "reason": "High-traffic application with 10k users",
  "requested_limit": 500,
  "use_case": "Real-time content sync",
  "current_usage": "~300 req/min peak"
}
```

#### Monitoraggio Usage

**Dashboard rate limit:**

```bash
GET /api/rate-limit/usage
Authorization: Bearer <token>
```

**Response:**

```json
{
  "current_period": {
    "start": "2026-01-10T15:00:00Z",
    "end": "2026-01-10T16:00:00Z",
    "requests": 87,
    "limit": 100,
    "percentage": 87
  },
  "today": {
    "total_requests": 1250,
    "peak_hour": "14:00-15:00",
    "peak_requests": 95
  },
  "by_endpoint": [
    {
      "path": "/api/posts",
      "method": "GET",
      "count": 450
    },
    {
      "path": "/api/media/upload",
      "method": "POST",
      "count": 8
    }
  ]
}
```

#### Best Practices

1. **Exponential Backoff:** Riprova con delay crescente (1s, 2s, 4s, 8s)
2. **Cache Responses:** Riduci chiamate cachando dati non volatili
3. **Batch Requests:** Raggruppa operazioni quando possibile
4. **Monitor Headers:** Controlla sempre `X-RateLimit-Remaining`
5. **Graceful Degradation:** Fallback su 429, mostra messaggio utente

**Esempio con retry:**

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
      
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}
```

---

### API Versioning

L'API segue **Semantic Versioning** e supporta multiple versioni simultaneamente.

#### Versioning Strategy

##### URL Versioning (Raccomandato)

```http
GET /api/v1/posts
GET /api/v2/posts
```

**Pro:** Chiaro, esplicito, facile da cachare  
**Contro:** Multiple URL per stessa risorsa

##### Header Versioning (Alternativa)

```http
GET /api/posts
Accept: application/vnd.cms.v2+json
```

**Pro:** Singola URL  
**Contro:** Difficile da testare, cache issues

##### Query Parameter (Non raccomandato)

```http
GET /api/posts?version=2
```

#### Versioni Disponibili

| Versione | Status | Release | End of Life | Breaking Changes |
|----------|--------|---------|-------------|------------------|
| **v1** | ✅ Current | 2026-01-10 | TBD | N/A |
| **v2** | 🚧 Beta | 2026-03-01 (planned) | TBD | Schema changes, new auth |

#### Semantic Versioning

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR: Breaking changes (v1 → v2)
MINOR: New features, backward-compatible (v1.0 → v1.1)
PATCH: Bug fixes, backward-compatible (v1.0.0 → v1.0.1)
```

#### Breaking Changes Policy

**Considerati breaking changes:**

- ❌ Rimozione endpoint
- ❌ Rimozione campi response
- ❌ Cambio tipo dato (string → int)
- ❌ Nuovi campi obbligatori
- ❌ Cambio status code success (200 → 201)
- ❌ Rimozione parametri query
- ❌ Cambio formato autenticazione

**Non considerati breaking:**

- ✅ Nuovi endpoint
- ✅ Nuovi campi opzionali response
- ✅ Nuovi parametri query opzionali
- ✅ Nuovi header response
- ✅ Nuovi valori enum (con default)
- ✅ Bug fixes

#### Migration Guide v1 → v2 (Planned)

##### Principali Cambiamenti

**1. Authentication:**

```diff
- POST /api/auth/login
+ POST /api/v2/auth/token

- Authorization: Bearer <token>
+ Authorization: Bearer <token> (unchanged)
+ X-API-Key: <optional-api-key>
```

**2. Response Envelope:**

```diff
# v1
{
  "items": [...],
  "total": 100
}

# v2
+ {
+   "data": {
+     "items": [...],
+     "pagination": {
+       "total": 100,
+       "page": 1,
+       "pages": 10
+     }
+   },
+   "meta": {
+     "version": "2.0.0",
+     "timestamp": "2026-01-10T15:30:00Z"
+   }
+ }
```

**3. Error Format:**

```diff
# v1
{
  "detail": "Not found"
}

# v2
+ {
+   "error": {
+     "code": "NOT_FOUND",
+     "message": "Resource not found",
+     "details": {
+       "resource": "post",
+       "id": 123
+     },
+     "timestamp": "2026-01-10T15:30:00Z",
+     "trace_id": "abc-123-def"
+   }
+ }
```

**4. Date Format:**

```diff
# v1 - ISO 8601
"created_at": "2026-01-10T15:30:00Z"

# v2 - RFC 3339 with microseconds
+ "created_at": "2026-01-10T15:30:00.123456Z"
```

#### Version Support Timeline

```
v1 Release ────────────────────────▶ v2 Release ──────▶ v1 EOL
   2026-01-10                          2026-03-01        2027-03-01
                                       
                  ◀─── 12 months overlap ───▶
                       (guaranteed support)
```

**Deprecation Timeline:**

1. **T-6 months:** Annuncio deprecation v1, v2 in beta
2. **T-3 months:** v2 stable, v1 maintenance mode
3. **T-0:** v1 end-of-life, rimosso

#### Accesso Versioni

**Default (latest stable):**

```bash
GET /api/posts
# Usa v1 (current stable)
```

**Explicit version:**

```bash
GET /api/v1/posts  # v1 explicit
GET /api/v2/posts  # v2 explicit (quando disponibile)
```

**Header-based:**

```bash
GET /api/posts
Accept: application/vnd.cms.v1+json
```

#### Testing con Multiple Versioni

```javascript
// Test suite per entrambe versioni
const versions = ['v1', 'v2'];

versions.forEach(version => {
  describe(`API ${version}`, () => {
    const baseUrl = `http://localhost:8000/api/${version}`;
    
    test('GET /posts returns list', async () => {
      const response = await fetch(`${baseUrl}/posts`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      if (version === 'v1') {
        expect(data).toHaveProperty('items');
      } else {
        expect(data).toHaveProperty('data.items');
      }
    });
  });
});
```

---

### Deprecation Warnings

Sistema di notifica per feature deprecate e breaking changes futuri.

#### Deprecation Headers

Quando usi feature deprecate, ricevi warning headers:

```http
HTTP/1.1 200 OK
Warning: 299 - "Deprecated: This endpoint will be removed in v2.0"
Sunset: Sat, 01 Mar 2026 00:00:00 GMT
Deprecation: true
Link: <https://docs.cms.com/migration/v2>; rel="deprecation"
X-API-Deprecation-Date: 2026-03-01
X-API-Deprecation-Info: https://docs.cms.com/changelog#v2
```

**Header Descriptions:**

- `Warning`: Messaggio deprecation (HTTP standard)
- `Sunset`: Data rimozione feature (RFC 8594)
- `Deprecation`: Flag boolean deprecation
- `Link`: URL documentazione migrazione
- `X-API-Deprecation-Date`: Data ISO deprecation
- `X-API-Deprecation-Info`: Link changelog

#### Livelli di Deprecation

##### 1. NOTICE (6+ mesi)

```http
Warning: 299 - "Notice: Field 'views' will be renamed to 'view_count' in v2.0"
```

- Feature ancora funzionante
- Nessuna azione richiesta immediatamente
- Inizia a pianificare migrazione

##### 2. DEPRECATED (3-6 mesi)

```http
Warning: 299 - "Deprecated: Endpoint /api/posts/archive will be removed in v2.0"
Sunset: Sat, 01 Mar 2026 00:00:00 GMT
```

- Feature in deprecation attiva
- Aggiorna codice appena possibile
- Support limitato a bug critici

##### 3. SUNSET (0-3 mesi)

```http
Warning: 299 - "Sunset: This endpoint will be removed on 2026-03-01"
Sunset: Sat, 01 Mar 2026 00:00:00 GMT
Deprecation: true
```

- Feature sarà rimossa presto
- Aggiorna immediatamente
- No new features, solo bug fixes

#### Deprecation Notices Attive

##### POST /api/auth/login (Body parameter `remember_me`)

**Status:** DEPRECATED  
**Sunset:** 2026-03-01  
**Replacement:** Usa `expires_in` parameter

```diff
# OLD (deprecated)
- {
-   "email": "user@example.com",
-   "password": "password",
-   "remember_me": true
- }

# NEW
+ {
+   "email": "user@example.com",
+   "password": "password",
+   "expires_in": "7d"
+ }
```

##### GET /api/posts/{id}/views

**Status:** DEPRECATED  
**Sunset:** 2026-03-01  
**Replacement:** Campo `views` già presente in `GET /api/posts/{id}`

```diff
# OLD (deprecated)
- GET /api/posts/123/views
- Response: { "views": 1234 }

# NEW (use main endpoint)
+ GET /api/posts/123
+ Response: { "id": 123, "views": 1234, ... }
```

##### Query Parameter `category` (string)

**Status:** DEPRECATED  
**Sunset:** 2026-03-01  
**Replacement:** Usa `category_id` (integer)

```diff
# OLD (deprecated)
- GET /api/posts?category=web-development

# NEW
+ GET /api/posts?category_id=1
```

#### Notification Methods

##### 1. Email Notifications

Ricevi email quando usi feature deprecate:

```
Subject: API Deprecation Warning - Action Required

You're using deprecated features in your API integration:

1. POST /api/auth/login with 'remember_me' parameter
   - Used: 47 times last 7 days
   - Sunset: 2026-03-01
   - Action: Switch to 'expires_in' parameter
   - Guide: https://docs.cms.com/migration#auth

2. GET /api/posts/{id}/views endpoint
   - Used: 12 times last 7 days
   - Sunset: 2026-03-01
   - Action: Use main /api/posts/{id} endpoint
   - Guide: https://docs.cms.com/migration#views

Update your integration before sunset dates to avoid service disruption.
```

##### 2. Dashboard Warnings

Nel dashboard admin, vedi warning per integrazioni deprecate:

```
⚠️ Deprecation Warnings

You have 2 active deprecation warnings:

┌─────────────────────────────────────────────────────────┐
│ POST /api/auth/login (remember_me parameter)           │
│ Sunset: 2026-03-01 (50 days remaining)                 │
│ Usage: 47 calls last 7 days                            │
│ [View Migration Guide]                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ GET /api/posts/{id}/views                               │
│ Sunset: 2026-03-01 (50 days remaining)                 │
│ Usage: 12 calls last 7 days                            │
│ [View Migration Guide]                                  │
└─────────────────────────────────────────────────────────┘
```

##### 3. Programmatic Check

```bash
GET /api/deprecations
Authorization: Bearer <token>
```

**Response:**

```json
{
  "deprecations": [
    {
      "feature": "POST /api/auth/login - remember_me parameter",
      "level": "DEPRECATED",
      "sunset_date": "2026-03-01",
      "replacement": "Use expires_in parameter",
      "migration_guide": "https://docs.cms.com/migration#auth",
      "usage_last_7_days": 47
    }
  ],
  "total": 1,
  "severity": "medium"
}
```

#### Migration Tools

##### Deprecation Scanner

Scan your codebase for deprecated API usage:

```bash
npm install -g @cms/deprecation-scanner

# Scan project
cms-scan --project ./src --api-url http://localhost:8000

# Output:
# ⚠️  Found 3 deprecation warnings:
# 
# src/api/auth.js:12
#   → POST /api/auth/login with 'remember_me'
#   → Sunset: 2026-03-01 (DEPRECATED)
#   → Fix: Use 'expires_in' instead
# 
# src/api/posts.js:45
#   → GET /api/posts/{id}/views
#   → Sunset: 2026-03-01 (DEPRECATED)
#   → Fix: Use main /api/posts/{id} endpoint
```

##### Auto-Migration CLI

```bash
npm install -g @cms/api-migrate

# Analyze project
cms-migrate analyze ./src

# Preview changes
cms-migrate preview ./src

# Apply migrations
cms-migrate apply ./src --backup
```

#### Best Practices

1. **Monitor Headers:** Log tutti i Warning headers
2. **Dashboard Check:** Controlla dashboard settimanalmente
3. **Subscribe Changelog:** Email notification per deprecations
4. **Test Suite:** Fail CI su deprecation warnings
5. **Update Regularly:** Non aspettare sunset date

---

## Changelog

### v1.0.0 (2026-01-10)

- ✅ API completa con autenticazione JWT
- ✅ CRUD completo per Posts, Categories, Pages, Users
- ✅ Sistema Media con upload multipart
- ✅ Statistiche dashboard
- ✅ Cache management
- ✅ Rate limiting
- ✅ Documentazione OpenAPI 3.0

---

## Support

Per supporto e segnalazioni:

- **Email:** support@cms.com
- **Issues:** https://github.com/yourorg/cms/issues
- **Documentation:** https://docs.cms.com

---

**Generated on:** 10 gennaio 2026  
**API Version:** 1.0.0  
**OpenAPI Version:** 3.0.3
