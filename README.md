# 🗨️ Chat App

## 💡 Overview
Our **Chat App** is a modern real-time chat application built with **Angular**.
It allows users to communicate, create chats, and receive live messages — all within a clean and responsive interface. 💬✨

---

## 🚀 Features
- 🔐 User login and registration  
- 💬 Real-time messaging with automatic updates 
- 😄 Ability to edit messages, add reactions, and mention users or channels
- 👥 Group chats and direct messages  
- 🕓 Online status and timestamps 
- 🔍 Search functionality for users, channels, and messages
- 📱 Fully responsive – works seamlessly on desktop and mobile  

---

## 🛠️ Technologies
- **Frontend:** Angular (Version 20)  
- **Styling:** SCSS / Tailwind CSS  
- **Backend:** Firebase (real-time communication)
- **Datenbank:** No-SQL Firestore Database

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- Angular CLI >= 17
- Firebase-Projekt with the following services enabled:
    - Authentication
    - Firestore
    - Realtime Database
- Access to a valid environment.ts file with Firebase configuration
- Tailwind CSS

---

### Steps
```bash
# 1️⃣ Clone the repository
git clone https://github.com/RaphaelaMulthaup/DABubble.git

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the development server
ng serve
```

➡️ The app will be available at http://localhost:4200

---

## 🧰 Project Structure

src/
 ├── app/
 │   ├── overlay/         # Components displayed in overlays
 │   ├── pages/           # Dashboard and non-auth pages
 │   ├── services/        
 │   ├── shared/
 │   │   ├── components/  # Reusable UI components
 │   │   ├── constants/   # Extracted constants
 │   │   ├── directives/
 │   │   ├── models/      # Interfaces
 │   │   ├── types/       # Type definitions
 ├── assets/              # Images, icons, etc.
 ├── environments/        # Environment variables (dev/prod)

---

## 👩‍💻 Development-Team

👨‍💻 Andrei Buha

👩‍💻 Anne Vollman

👨‍💻 Nicolaus Feldtmann

👩‍💻 Raphaela Multhaup

---

## 🌐 Deployment

```bash
ng build
```
Then upload the build files to your hosting environment.

---

## 📄 License

This project is licensed under the MIT License.
Feel free to use, share, and improve it! ❤️

---

## 💬 Contact

Questions, feedback, or ideas?

Reach out to us directly:

buha2595@gmail.com
kontakt@anne-vollmann.de
nicolaus.feldtmann@gmx.de
kontakt@raphaela-multhaup.de

---

Emojis are from the OpenMoji project (https://openmoji.org/), licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).