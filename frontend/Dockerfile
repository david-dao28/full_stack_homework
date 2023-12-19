# Use a lightweight Node.js image as the base image
FROM node:21-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project to the container
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]
