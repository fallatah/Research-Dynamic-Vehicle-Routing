# Research Dynamic Vehicle Routing

## Abstract
This project explores the Dynamic Vehicle Routing problem, a central challenge in logistics and operations research. The goal is to compute efficient and adaptive delivery routes for a fleet of vehicles serving multiple customers under real-world constraints such as time-dependent travel times, dynamic requests, and operational uncertainty.

The application is built using NextJS and provides an interactive interface for visualizing routing scenarios, testing algorithms, and running simulations.

---

## Prerequisites

Before running the application locally, ensure you have the following installed:

- Node.js (LTS version recommended)
- npm (bundled with Node.js)
- Git (optional but recommended)

---

## Installing Node.js and npm

### macOS

#### Method 1: Official Installer
1. Go to https://nodejs.org
2. Download the macOS Installer (.pkg) for the LTS version
3. Open the installer and follow the instructions
4. Verify installation in Terminal:
   ```
   node -v
   npm -v
   ```

#### Method 2: Homebrew
```
brew update
brew install node
```

---

### Windows

1. Visit https://nodejs.org
2. Download the Windows Installer (.msi) for the LTS version
3. Run the installer and complete the setup
4. Verify installation in Command Prompt or PowerShell:
   ```
   node -v
   npm -v
   ```

---

## Cloning the Repository

```
git clone <your-repo-url>
cd <project-folder>
```

If downloaded as ZIP, extract it and open the folder.

---


## Running the App Locally

```
cd app
npm install
npm run dev
```

The application will be available at:

http://localhost:3000/

Other users can reach this app if they are connected to your local network via:
http://192.168.100.82:3000