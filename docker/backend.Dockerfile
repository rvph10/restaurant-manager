FROM node:18.19.0-alpine3.18

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client gnupg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=./src/prisma/schema.prisma

# Make wait-for-it.sh executable
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Set the entrypoint
ENTRYPOINT ["/wait-for-it.sh"]

EXPOSE 5000

# Default command
CMD ["npm", "run", "dev"]