# University AI Chatbot Web Application & Admin Backend

A comprehensive solution tailored for educational institutions. This application features an interactive, dynamic student-facing landing page equipped with a floating AI-powered Chatbot (powered by the Google Gemini API), and a specialized Admin Portal for configuring college-specific information, branding, and knowledge bases. 

Recent updates have introduced a sturdy Node.js backend to securely manage data persistence without completely relying on local storage blockages.

## Features

### 🎓 Student-Facing Landing Page
- Modern, accessible, and responsive learning portal design.
- **Dynamic Theming**: Easily switch between light and dark themes.
- **Floating AI Chatbot**: Integrated with the Gemini 2.5 API to provide smart, context-aware answers to student queries in both English and Hinglish. 
- **Quick-Replies**: Predefined, actionable buttons (Campus, Programs, Placements, Scholarships, etc.) to get answers instantly.
- Persisted chat session history within the browser window.

### ⚙️ Multi-Brand Admin Portal
- A standalone Administrative interface (`admin.html`) to manage institutional preferences.
- **Node.js & SQLite Backend**: Provides robust storage and retrieval of multiple college brands, removing the dependency on client-first persistence.
- **Knowledge Base Management**: Admins can define trigger keywords and customized responses for the Chatbot securely on the server.
- **Branding Customizations**: Personalize taglines, UI primary colors, and structural copies applied across the student-facing portal universally.
- **Quick-Reply Customization**: Configure custom quick replies for the bot.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla + Variable Theming), JavaScript.
- **Backend API**: Node.js, Express.js.
- **Database**: SQLite3 (Locally generated `.sqlite` file).
- **External AI**: Google Generative AI (Gemini Flash API).

## Getting Started / Local Setup

Follow these instructions to safely spin up the backend server and launch the Web Client. 

### 1. Prerequisites 
- **Node.js** and **npm** installed on your system.
- An internet connection for API retrieval (Google Fonts, FontAwesome, DiceBear Avatars, Gemini API).

### 2. Backend Server Setup
From the project directory terminal:
```bash
# Install required backend dependencies (Express, SQLite3, Cors, Dotenv)
npm install

# Start the Express server on port 3000
npm start 
# Alternatively, you can use `node server.js`
```
When running the server for the very first time, an SQLite database (`database.sqlite`) will automatically be created and seeded with default college examples and generic knowledge bases.

### 3. Frontend Client Setup
To visualize the interface, run the frontend code. If you have Python installed, you can simply spin up a static server:
```bash
# Run on port 8000
python -m http.server 8000
```
Open a browser and navigate to `http://localhost:8000/index.html`. 

_Note: If using VSCode, you can optionally right-click `index.html` and select **"Open with Live Server"**._

## Project Structure

- `index.html` & `style.css` - Main student portal web interface and general styling.
- `script.js` - Contains the chatbot UI logic and Gemini API fetching sequence. 
- `server.js` - The brand new Express & SQLite backend serving data to our `admin` features. 
- `package.json` - Node package definitions.
- `admin.html`, `admin.css`, & `admin.js` - The Admin Dashboard UI and interaction logic.
- `login.html`, `login.css`, & `reset-password.html` - Admin portal authentication gateways.

## Configuring the Gemini API

The Chatbot is wired to use the Google Generative AI (Gemini) REST endpoint.
Inside `script.js`, there is a placeholder string for `API_KEY`. The prompt context feeds the Chatbot conversational bounds from the backend's knowledge context database. Be certain to keep your production keys valid and secure.

## Contributors
- Namita Raj Mehra
- Manoj Kumar Meena
- Subham Soni
- Priyanka Mahlawat
