FROM node:18.19.0-alpine3.18

# Install PostgreSQL client and other required packages
RUN apk add --no-cache postgresql-client netcat-openbsd gnupg openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Copy and make wait-for-it script executable
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Generate Prisma Client
RUN npx prisma generate --schema=./src/prisma/schema.prisma

EXPOSE 5000

# Set the entrypoint to wait-for-it script
ENTRYPOINT ["/wait-for-it.sh"]

# Default command
CMD ["npm", "run", "dev"]