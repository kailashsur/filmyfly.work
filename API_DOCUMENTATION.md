# API Documentation for Astro Frontend

## Base URL

**Development:** `http://localhost:4000/api`  
**Production:** `https://filmyflyhd.space/api`

All API endpoints return JSON responses in the following format:

```json
{
  "success": true,
  "data": { ... }
}
```

Or in case of error:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Endpoints

### 1. Get Homepage Data

Get all data needed for homepage (trending movies, recent movies, categories)

**Endpoint:** `GET /api/home`

**Query Parameters:**
- `page` (optional): Page number for recent movies (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "trendingMovies": [
      {
        "id": 1,
        "title": "Movie Title",
        "slug": "movie-title",
        "thumbnail": "https://...",
        "keywords": "...",
        "releaseYear": 2024,
        "genre": "Action"
      }
    ],
    "recentMovies": [ ... ],
    "categories": [
      {
        "id": 1,
        "name": "Bollywood",
        "slug": "bollywood",
        "_count": { "movies": 150 }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 2. Get Movies List

Get paginated list of movies

**Endpoint:** `GET /api/movies`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Movie Title",
      "slug": "movie-title",
      "thumbnail": "https://...",
      "keywords": "...",
      "releaseYear": 2024,
      "genre": "Action",
      "createdAt": "2024-12-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. Get Trending Movies

Get list of trending movies

**Endpoint:** `GET /api/movies/trending`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Trending Movie",
      "slug": "trending-movie",
      "thumbnail": "https://...",
      "keywords": "...",
      "releaseYear": 2024,
      "genre": "Action"
    }
  ]
}
```

---

### 4. Get Single Movie

Get movie details by slug

**Endpoint:** `GET /api/movies/:slug`

**Parameters:**
- `slug`: Movie slug (e.g., "movie-title-2024")

**Response:**
```json
{
  "success": true,
  "data": {
    "movie": {
      "id": 1,
      "title": "Movie Title",
      "slug": "movie-title",
      "description": "Movie description...",
      "thumbnail": "https://...",
      "genre": "Action",
      "languages": "Hindi, English",
      "duration": "2h 30m",
      "releaseYear": 2024,
      "cast": "Actor 1, Actor 2",
      "sizes": "480p, 720p, 1080p",
      "downloadUrl": "https://...",
      "screenshot": "https://...",
      "keywords": "...",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Bollywood",
        "slug": "bollywood"
      },
      "TrendingMovie": null,
      "createdAt": "2024-12-24T10:00:00Z",
      "updatedAt": "2024-12-24T10:00:00Z"
    },
    "relatedMovies": [ ... ],
    "downloadRedirectUrl": "https://redirect-url.com"
  }
}
```

---

### 5. Get Categories

Get all categories with movie counts

**Endpoint:** `GET /api/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bollywood",
      "slug": "bollywood",
      "description": "Bollywood movies",
      "_count": {
        "movies": 150
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 6. Get Category by Slug

Get category details with movies

**Endpoint:** `GET /api/categories/:slug`

**Parameters:**
- `slug`: Category slug (e.g., "bollywood")

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "name": "Bollywood",
      "slug": "bollywood",
      "description": "Bollywood movies"
    },
    "movies": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 7. Search Movies

Search for movies

**Endpoint:** `GET /api/search`

**Query Parameters:**
- `q`: Search query (required)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "avengers",
    "movies": [
      {
        "id": 1,
        "title": "Avengers: Endgame",
        "slug": "avengers-endgame",
        "thumbnail": "https://...",
        "description": "...",
        "releaseYear": 2019,
        "genre": "Action",
        "keywords": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 8. Get Static Page

Get static page content by slug

**Endpoint:** `GET /api/static-pages/:slug`

**Parameters:**
- `slug`: Page slug (e.g., "privacy-policy")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Privacy Policy",
    "slug": "privacy-policy",
    "content": "Page content in HTML...",
    "metaTitle": "Privacy Policy - FilmyFly",
    "metaDescription": "Our privacy policy",
    "metaKeywords": "privacy, policy",
    "isPublished": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 9. Get Public Settings

Get public site settings

**Endpoint:** `GET /api/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadRedirectUrl": "https://...",
    "googleTagManagerHead": "...",
    "googleTagManagerBody": "...",
    "googleAnalytics": "...",
    "googleSearchConsole": "...",
    "adsenseCode": "...",
    "adsteraCode": "...",
    "siteUrl": "https://filmyflyhd.space"
  }
}
```

---

## Error Responses

### 404 Not Found

```json
{
  "success": false,
  "error": "Movie not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "error": "Failed to fetch movies"
}
```

---

## CORS Configuration

The API is configured to accept requests from:
- **Development:** `http://localhost:3000`
- **Production:** Set via `FRONTEND_URL` environment variable

Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`

---

## Usage in Astro

### Example API Client

```typescript
// src/lib/api.ts
const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getHomePageData(page = 1) {
  const res = await fetch(`${API_BASE}/home?page=${page}`);
  return res.json();
}

export async function getMovieBySlug(slug: string) {
  const res = await fetch(`${API_BASE}/movies/${slug}`);
  return res.json();
}

export async function searchMovies(query: string, page = 1) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&page=${page}`);
  return res.json();
}
```

### Example Usage in Astro Page

```astro
---
// src/pages/index.astro
import { getHomePageData } from '../lib/api';

const { data } = await getHomePageData();
const { trendingMovies, recentMovies, categories } = data;
---

<h1>Trending Movies</h1>
{trendingMovies.map(movie => (
  <div>
    <h2>{movie.title}</h2>
    <img src={movie.thumbnail} alt={movie.title} />
  </div>
))}
```

---

## Environment Variables

Add to your `.env` file:

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Change port if needed (default: 3000)
PORT=4000
```

---

## Testing the API

### Using curl:

```bash
# Get homepage data
curl http://localhost:4000/api/home

# Get single movie
curl http://localhost:4000/api/movies/movie-slug

# Search
curl "http://localhost:4000/api/search?q=avengers"

# Get categories
curl http://localhost:4000/api/categories
```

### Using browser:

Simply visit: `http://localhost:4000/api/home`

---

**Created:** 2024-12-28  
**For:** FilmyFly Astro Frontend Integration
