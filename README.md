# <img src="https://track-rental.web.app/logo.png" alt="Track Rental Logo" width="32" height="32" style="vertical-align:middle;"> Track Rental


Track Rental is a modern, Progressive Web App (PWA) for rental management, built with React, Vite, and Firebase. Whether you're managing vehicles, equipment, or property rentals, Track Rental provides a fast, secure, and user-friendly platform to streamline your workflow.

## Features

- 🚀 **PWA Compliant:** Installable on desktop and mobile, works offline, and provides a native app-like experience.
- 🔥 **Powered by Firebase:** Real-time database, authentication, and cloud storage.
- ⚡ **Built with Vite & React:** Lightning-fast development and production builds.
- 🔒 **Secure & Scalable:** Environment variables for sensitive configuration, scalable cloud backend.
- 🌐 **Visit Website:** [track-rental.web.app](https://track-rental.web.app)

---

## How to Use

To get started with Track Rental, follow these steps:

1. **Sign in with Google:**
   Begin by signing in using your Google account to access all features of Track Rental.

2. **Add an Asset:**
   Navigate to the **Assets** section and click "Add Asset." Fill in the details for the item you want to rent out (e.g., vehicle, equipment, property).

3. **Add a Contact:**
   Go to the **Contacts** section and click "Add Contact." Enter the contact's information. You may optionally upload a photo of ID Card for the contact.

4. **Create a Rental:**
   In the **Rentals** section, click "Create Rental."
   - **Choose Asset:** Select the asset you want to rent from your list.
   - **Choose Contact:** Select the contact who will be renting the asset.
   - **Set Rate & Amount:** Enter the rental rate and the total amount.
   - **Select Rental Type:** Choose whether the rental is **monthly** or **daily**.

This workflow allows you to efficiently manage your assets, contacts, and rental agreements all in one place.

---

## Getting Started

Follow these steps to set up Track Rental locally:

### 1. Clone the Repository

```bash
git clone https://github.com/imdewan/track-rental.git
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

## Firestore & Storage Security Rules

To keep your data secure and ensure users can only access their own documents and files, you can use the following Firestore and Storage rules. Add these in your Firebase console under **Firestore Rules** and **Storage Rules** respectively:

### Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Match all collections and documents
    match /{collection}/{docId} {

      // Allow read if the user owns the document
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // Allow create only if the userId in the document matches the authenticated user
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;

      // Allow update and delete only if the existing document belongs to the user
      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid;
    }
  }
}
```

These rules ensure that each user can only read, create, update, or delete documents where the `userId` field matches their own Firebase UID.

### Storage Rules

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

These storage rules ensure that users can only read and write files in their own folder under `/images/{userId}/`, where `{userId}` matches their Firebase UID.

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
- **Tailwind CSS** – Utility-first CSS framework for styling.
- **React Router** – Declarative routing for React applications.

---

## Contributing

We welcome contributions! Please fork the repository, create a pull request, and help us improve Track Rental.
For major changes, please open an issue first to discuss what you would like to change.

---

## Live Website

Try Track Rental now: [track-rental.web.app](https://track-rental.web.app)

---

Happy Renting! 🚗🏠🔑

Made with ❤️ by [Dewan Shakil](https://mrdsa.dev)
