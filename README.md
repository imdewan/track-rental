# Track Rental

![Track Rental Logo](https://track-rental.web.app/logo.png)

Track Rental is a modern, Progressive Web App (PWA) for rental management, built with React, Vite, and Firebase. Whether you're managing vehicles, equipment, or property rentals, Track Rental provides a fast, secure, and user-friendly platform to streamline your workflow.

## Features

- 🚀 **PWA Compliant:** Installable on desktop and mobile, works offline, and provides a native app-like experience.
- 🔥 **Powered by Firebase:** Real-time database, authentication, and cloud storage.
- ⚡ **Built with Vite & React:** Lightning-fast development and production builds.
- 🔒 **Secure & Scalable:** Environment variables for sensitive configuration, scalable cloud backend.
- 🌐 **Live Demo:** [track-rental.web.app](https://track-rental.web.app)

---

## Getting Started

Follow these steps to set up Track Rental locally:

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/track-rental.git
cd track-rental
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed.

```bash
npm install
```

### 3. Configure Firebase Environment Variables

Track Rental uses Firebase for authentication, database, and storage. You need to set up a Firebase project and obtain your credentials.

Create a `.env` file in the root directory and add the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

You can find these values in your Firebase project settings under **Project Overview > Project Settings > General**.

#### Example:

```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=track-rental.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=track-rental
VITE_FIREBASE_STORAGE_BUCKET=track-rental.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser to view the app.

---

## Deployment

Track Rental is ready to deploy on [Firebase Hosting](https://firebase.google.com/docs/hosting). To deploy:

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:

   ```bash
   firebase init
   ```

4. Build the project:

   ```bash
   npm run build
   ```

5. Deploy:

   ```bash
   firebase deploy
   ```

---

## Technologies Used

- **React** – UI library for building interactive interfaces.
- **Vite** – Next-generation frontend tooling.
- **Firebase** – Backend services for authentication, database, and hosting.
- **PWA** – Progressive Web App features for offline support and installability.

---

## License

Track Rental is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/
```

You are free to use, modify, and distribute this software under the terms of the license.

---

## Contributing

We welcome contributions! Please fork the repository, create a pull request, and help us improve Track Rental.

---

## Support

If you have any questions or need help, open an issue on GitHub or contact us at [support@track-rental.web.app](mailto:support@track-rental.web.app).

---

## Live Website

Try Track Rental now: [track-rental.web.app](https://track-rental.web.app)

---

Happy Renting! 🚗🏠🔑
Made with ❤️ by [Dewan Shakil](https://mrdsa.dev)
