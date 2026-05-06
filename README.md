# Backend API

Express and MongoDB backend for the blogging platform.

## Features

- JWT authentication with refresh-session support
- User registration, login, logout-ready session flow
- Password change and reset endpoints
- Posts, categories, tags, likes, and comments APIs
- Comment moderation and simple spam detection
- Profile, follow, and bookmark support

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT
- bcryptjs

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the `backend` folder.

3. Add the required environment variables:

```env
NODE_ENV=development
PORT=9090
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d
```

4. Start the server:

```bash
npm run dev
```

For production:

```bash
npm start
```

## API Base URL

Local:

```text
http://localhost:9090/api
```

## Main Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/reset-password`
- `GET /auth/profile`
- `PUT /auth/profile`
- `PUT /auth/change-password`

### Posts

- `GET /posts`
- `GET /posts/me`
- `GET /posts/:slug`
- `POST /posts`
- `DELETE /posts/:postId`

### Categories and Tags

- `GET /posts/categories`
- `POST /posts/categories`
- `PUT /posts/categories/:categoryId`
- `DELETE /posts/categories/:categoryId`
- `GET /posts/tags`
- `GET /posts/category/:slug`
- `GET /posts/tag/:slug`

### Comments

- `GET /posts/:slug/comments`
- `POST /posts/:slug/comments`
- `PUT /posts/:slug/comments/:commentId`
- `DELETE /posts/:slug/comments/:commentId`
- `GET /posts/:slug/comments/moderation`
- `PATCH /posts/:slug/comments/:commentId/moderate`

## Notes

- Protected routes require `Authorization: Bearer <token>`.
- Refresh sessions use the `/auth/refresh` endpoint with a valid refresh token.
- Keep `.env` private and never commit secrets.
