# Videogram Backend

Videogram is a robust and scalable backend architecture designed to power a modern video sharing platform. Built with Node.js, Express, and MongoDB, it provides comprehensive features for video management, user authentication, and social interaction.

## 🚀 Features

- **User Authentication**: Secure user registration and login using JWT (JSON Web Tokens) and bcrypt for password hashing.
- **Video Management**: Seamless video uploading and management integration with **Cloudinary**.
- **Database**: efficient data storage and retrieval using **MongoDB** with Mongoose ODM.
- **Email Notifications**: Integrated email services using **SendGrid** and **Nodemailer** for user communications.
- **Security**: Enhanced security features including CORS configuration and secure cookie handling.
- **Pagination**: Efficient data pagination with `mongoose-aggregate-paginate-v2`.

## 🛠️ Tech Stack

- **Runtime Environment**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Cloud Storage**: [Cloudinary](https://cloudinary.com/)
- **Authentication**: JWT, Reference Tokens
- **Language**: JavaScript (ES Modules)

## 📂 Project Structure

```
├── .postman/          # Postman configuration files
├── postman/           # Postman collections and environments
├── public/            # Public assets
├── src/               # Source code
│   ├── controllers/   # Request handlers
│   ├── db/            # Database connection logic
│   ├── middlewares/   # Express middlewares
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── services/      # Business logic services
│   ├── utils/         # Utility functions
│   ├── app.js         # App entry point
│   ├── constants.js   # Constant values
│   └── index.js       # Server startup script
├── .env               # Environment variables
├── .gitignore         # Git ignore rules
└── package.json       # Dependencies and scripts
```

## ⚙️ Installation & Setup

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/manikandaprabhu0512/videoTube.git
    cd VideoTube
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Configuration**

    Create a `.env` file in the root directory and configure the necessary environment variables (e.g., PORT, MONGODB_URI, CLOUDINARY_URL, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, etc.).

4.  **Start the Server**

    For development (requires nodemon):

    ```bash
    npm run dev
    ```

    For production:

    ```bash
    npm start
    ```

## 🔌 API Documentation

The API is fully documented using Postman. You can find the collection and environment files in the `postman` directory.

### Importing into Postman

1.  Open Postman.
2.  Click on **Import**.
3.  Drag and drop the files from the `postman/collections` and `postman/environments` directories.
    - Collection: `postman/collections/videoTube.postman_collection.json`
    - Environment: `postman/environments/base.postman_environment.json` (or similar)

Alternatively, you can access the collection file directly [here](./postman/collections/videoTube.postman_collection.json).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
