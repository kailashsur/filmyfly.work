# Environment variables declared in this file are NOT automatically loaded by Prisma.
# Please add `import "dotenv/config";` to your `prisma.config.ts` file, or use the Prisma CLI with Bun
# to load environment variables from .env files: https://pris.ly/prisma-config-env-vars.

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

# supabase
# DATABASE_URL="postgresql://postgres:KAilashsu5r@@db.puqbugcetzqthlfndaky.supabase.co:5432/postgres?schema=public"
# local
DATABASE_URL="postgresql://postgres:admin@localhost:5432/filmyfly?schema=public"

# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Option 1: Full JSON as string (recommended)
FIREBASE_SERVICE_ACCOUNT_KEY='{
  "type": "service_account",
  "project_id": "filmyfly-6b630",
  "private_key_id": "dbebe0e66f66b899fadeccfd9147ed75b7eaff7f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDPs3SsG5pB6hbO\ndxgCi0b1DZNnHLuYoD4qSwrc1bMW31kNYhoAdfIvriA3VwypJuwlnZjSf6/4Pnuv\nrxCpeQWA0JBUYK1JIq99HPH8GQETTrB7+u5NEO/F1mr1hSTA1v/NZvo8CbXGjgf3\nNU2wnAp2Fp2VUB34OSK0vi+D40ePehi0GYeoVdLF4lpNhHo6HyZU/wl2QHnQFMlQ\ncPHFMjTRj42+0p+bDVg8zgshswdMHEcaoV18LxFhyz3M2cpCkGY2EBQGRd1nna05\n/qLUjATMHj49b/BQ3EOrRdeGNboL+d5m+LLtFEc/vP1+BEopBaKS+aaqu1Z0OryZ\nUUwQXMwnAgMBAAECggEABLu0tXVdkxH4GhVptSkiYVRBXzCu77/7GrCiGz09exB0\n8ZKiQA9wCPkhX9F6huJNsF/Ci02An5og7HSDXzFUWEaoe1vGpyuEr0e5FgMl3KBG\n8lRaGOSBalNEFbtGhqR/qNkna7XW8CLteIs87YDo1h8W0T/FpxH6Qf8xiwJjb5gQ\nr9Z+eNhCFjuYL2lsAZJzEkv11KBo+3+BlT6RQPkzo5pbkLwN4BUm3mQ0RhiDLzBk\nmmI0caXRt72+9SUBVQ68qeR8ZBFrurEmWWEG3HKOlHOVCqTKT5LGxxlzTtZ80nEc\nE9BJ2BcJvWfK10xjUAAa/KLYpU7QenpNiFHU2NSTnQKBgQD0o50J7ZPyLMSslmP/\nNs9n5AabVzkSwB5j62VJeenDwM9BGpbdyCqfP+xuD+WQ7sRkIbsTY++zSSgLj3x9\nd62mLAJrsV/svwajkfHBnF2qYwqenXifNABLk35S2Oy1FepKxQJ+tAso5g0H73XC\n4rA8QtvLhPdiXYAR3MNcPP3w2wKBgQDZWLRRRsJnPeUgpPBqC2AWwrovzIorV4cj\nMA3i0sot6Aq/eFUFa90o/xjdYeMu8CRp6Ofclt++gPJEg3ovulU2t9Y+ZC+YXQTn\ndJAjY035OEhrOHaujeOJYje4vGeAuxuScilXubLX0zYLe1HUmXsyl3OZIOMZ1aGN\nv1IAKuNdpQKBgQDbZ7XbBplOdHo7c3Hhna2sNmT6guKr/2QCJ0ci+9T8/HqkoA04\ngWJAixsnptg0AQBf8aSPgmyjNfRVUe3LtT8nLodJQL6QXM6+epEBHJUg0Ezg7sgU\nuJWfMnv0H5tD2ZDUWBahviXYG2MKf+f0zkxS73+i6vDX5pWK75zCp+z0SwKBgBHU\nNPZ113yglysWXKJWTIuRbbR+Etd7VpqMVpdEs1EQt9D9Dfxj3MCALIn8faZcDKCj\nemGd/ryh1z3Hiz5fCp5ydiCoFz9oYf6akThV7Q+Ejmw9NX8cJI4ggHGnAtaMgraA\npuOLWCBcMxK+CvhlnrWHtvPYvshfveDi0NcyrXQBAoGACMin171tIBf+UYAbYF1Z\nX58G9DuBZakWWPCeOuiWm+KCaOnvbAAJustfev8kbv6Vp8fglG99Jg/RvdYXxbtn\nhAST37IPwd9E0uYuJH9TcSzGN//Jysi5vdKC8WS8E7xcByPErIfiNC/3FJJPReKs\nvNuqonvGnA3CyXqzXhetSDc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@filmyfly-6b630.iam.gserviceaccount.com",
  "client_id": "108123150537974533906",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40filmyfly-6b630.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'

# Firebase Client SDK (for login page)
FIREBASE_API_KEY="AIzaSyAqOiy5kbj_vMTGM9mFIEtFnC-smCqTESk"
FIREBASE_AUTH_DOMAIN='filmyfly-6b630.firebaseapp.com'
FIREBASE_STORAGE_BUCKET='filmyfly-6b630.firebasestorage.app'
FIREBASE_MESSAGING_SENDER_ID=1023108403110
FIREBASE_APP_ID=1:1023108403110:web:1eb6f6454cc9e1e49a0967
FIREBASE_PROJECT_ID=filmyfly-6b630