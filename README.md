# FilmyFly Backend

A modern Express.js backend application with EJS templating and TypeScript.

## Features

- Express.js web framework
- EJS templating engine
- TypeScript for type safety
- Organized file structure
- Error handling middleware
- Static file serving

## Project Structure

```
.
├── src/
│   ├── app.ts                 # Main application entry point
│   ├── routes/                # Route definitions
│   │   └── index.routes.ts
│   ├── controllers/           # Request handlers
│   │   └── index.controller.ts
│   ├── middleware/            # Custom middleware
│   │   └── error.middleware.ts
│   ├── config/                # Configuration files
│   │   └── database.ts
│   └── types/                 # TypeScript type definitions
│       └── index.ts
├── views/                     # EJS templates
│   ├── partials/              # Reusable partials
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── index.ejs
│   ├── about.ejs
│   └── error.ejs
├── public/                    # Static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── dist/                      # Compiled JavaScript (generated)
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Run the development server with hot-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm start
```

## Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run watch` - Watch for TypeScript changes and compile

## Environment Variables

Create a `.env` file in the root directory for environment-specific configuration. You can copy the included example:

```
cp .env.example .env
```

See `docs/GETTING_STARTED.md` for full setup instructions. The `docs/` folder contains more developer documentation and a routes overview.
 
Key variables are also summarized in `..\.env.example` at project root.

## License

ISC

