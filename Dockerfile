FROM node:14.3

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Copy both package.json and package-lock.json
COPY package*.json ./
COPY .env ./
COPY .npmrc ./

# If you are building your code for production
RUN npm install --production

# Bundle app source
COPY . .

CMD [ "npm", "start" ]
