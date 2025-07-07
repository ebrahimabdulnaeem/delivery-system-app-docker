# 1. Base Image: Use an official Node.js image. Alpine is lightweight.
FROM node:20.15.1-alpine AS base

# Update and upgrade base packages to patch vulnerabilities
RUN apk update && apk upgrade -y && apk add --no-cache openssl

# 2. Set Working Directory: Create a directory inside the container to house our app.
WORKDIR /app

# 3. Install Dependencies: Copy package.json and package-lock.json first to leverage Docker's layer caching.
COPY package*.json ./
RUN npm install

# 4. Copy Prisma Schema
COPY prisma ./prisma/

# 6. Copy Application Code: Copy the rest of your application's source code.
COPY . .

# Generate Prisma Client for the container's environment
RUN npx prisma generate

# 7. Build the application for production
RUN npm run build

# 7. Start Command: The command to run when the container starts.
# We use tail -f /dev/null to keep the container running for manual setup.
CMD ["npm", "start"]
