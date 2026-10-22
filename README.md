# NutriCart — Smart Grocery and Healthy Food Recommendation System

**Shop Smart. Eat Healthy.**

## 1. Project Overview

NutriCart is a smart grocery e-commerce and healthy food recommendation system designed to help users purchase groceries according to their nutritional needs, health goals, food preferences, and budget.

Unlike a traditional grocery shopping application, NutriCart combines online grocery shopping with nutrition intelligence. It helps users manage groceries, track pantry items, discover healthy recipes, and make informed food choices.

The system supports multiple person profiles under a user account. Recommendations can be personalized using information such as age, height, weight, activity level, dietary preferences, health goals, and allergies.

### Key Features

- **User and Person Profile Management:** Manage user accounts and individual profiles.
- **Smart Grocery Planning:** Plan grocery purchases based on requirements and preferences.
- **Pantry Management:** Track available grocery items.
- **Healthy Food and Recipe Recommendations:** Discover suitable food items and recipes.
- **Budget Tracking:** Manage grocery spending.
- **E-commerce Functionality:** Browse products, search, add items to a cart, and manage orders.

## 2. Technology Stack

### Frontend
- React.js
- TypeScript
- Vite
- HTML, CSS, and JavaScript

### Backend
- Java
- Spring Boot
- REST APIs

### Database
- MySQL

### Development Tools
- Visual Studio Code
- Node.js and npm
- Java Development Kit (JDK)
- Maven
- MySQL Server
- MySQL Workbench

## 3. Prerequisites

Before running NutriCart, install the following software:

1. **Visual Studio Code:** https://code.visualstudio.com/
2. **Node.js (LTS):** https://nodejs.org/
3. **Java JDK:** Install the version required by the backend project.
4. **MySQL Server:** https://dev.mysql.com/downloads/installer/
5. **MySQL Workbench:** https://dev.mysql.com/downloads/workbench/
6. **Git (optional):** https://git-scm.com/

**Important:** MySQL Workbench is a database management tool. It does not replace MySQL Server. You need a running MySQL Server instance for NutriCart to store and retrieve data.

## 4. Download the Source Code

### Option A: Download from GitHub

1. Open the NutriCart repository:
   https://github.com/ragavikannan0207-tech/NutriCart
2. Sign in to GitHub if the repository is private.
3. Click the **Code** button.
4. Select **Download ZIP**.
5. Extract the downloaded ZIP file.
6. Keep the extracted project folder in a convenient location.

### Option B: Clone Using Git

Open Terminal and run:

```bash
git clone https://github.com/ragavikannan0207-tech/NutriCart.git
cd NutriCart
```

If the repository is private, you must have permission to access it and authenticate with GitHub.

## 5. Open the Project in Visual Studio Code

1. Open Visual Studio Code.
2. Select **File → Open Folder**.
3. Select the extracted `NutriCart` folder.
4. Verify that the project contains the following directories:

```text
NutriCart/
├── frontend/
├── backend/
├── database/
├── README.md
└── .gitignore
```

The exact files inside each directory may vary by project version.

## 6. Configure the MySQL Database

### Step 1: Install and Start MySQL Server

1. Install MySQL Server on your computer.
2. Start the MySQL service.
3. Set a secure password for the MySQL user.
4. Confirm the port on which MySQL Server is running. The common default is `3306`, but your configuration may differ.

### Step 2: Open MySQL Workbench

1. Launch MySQL Workbench.
2. Create or select a connection to your local MySQL Server.
3. Enter the hostname, port, username, and password.
4. Test the connection.

For a local server, the hostname is commonly:

```text
localhost
```

### Step 3: Create the Database

In MySQL Workbench, open a SQL tab and execute:

```sql
CREATE DATABASE nutricart;
```

If the database already exists, you do not need to create it again.

### Step 4: Import the Database Structure and Data

1. Open the `database` folder in the NutriCart source code.
2. Identify the SQL files supplied with the project.
3. If the project includes a database dump, use **Server → Data Import** in MySQL Workbench to import it.
4. If the project includes schema or seed scripts, execute them in the documented order.
5. Refresh the Schemas panel and verify that the expected tables exist.

**Note:** Creating an empty database does not automatically create all application tables or sample records. Import or execute the appropriate SQL files supplied with the project.

## 7. Configure the Backend

The backend is responsible for application logic, database access, and REST API requests.

### Step 1: Open the Backend Folder

In the VS Code terminal, navigate to the backend directory:

```bash
cd backend
```

### Step 2: Configure Environment Variables

Check whether the backend contains an `.env.example` file.

If it does, create a local `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and configure the values for your local environment. For example:

```env
NUTRICART_DB_USER=your_mysql_user
NUTRICART_DB_PASSWORD=your_mysql_password
NUTRICART_JWT_SECRET=replace_with_a_strong_secret_at_least_32_bytes
```

Use your actual MySQL username and password. Generate a strong, private JWT secret for your environment.

Check the project's existing `application.yml` and `.env.example` for any additional required variables. Preserve the configured database URL, CORS settings, and other required properties unless you need to change them for your environment.

**Security rules:**
- Never commit your actual `.env` file.
- Never publish database passwords or JWT secrets.
- Keep `.env.example` populated with placeholders, not real credentials.
- Do not use development secrets in production.

### Step 3: Start the Backend

Use the Maven wrapper if it is included in the backend directory. On macOS or Linux, the command is commonly:

```bash
./mvnw spring-boot:run
```

On Windows, if the wrapper is included:

```powershell
.\mvnw.cmd spring-boot:run
```

If the project does not include the Maven wrapper, use Maven installed on your computer:

```bash
mvn spring-boot:run
```

The correct command depends on the build files included in the backend directory. Check the backend's `pom.xml` and README instructions if these commands are unavailable.

Wait for Spring Boot to finish starting. The configured backend port is commonly `8080`, but verify the actual configuration.

## 8. Configure and Run the Frontend

The frontend is the user interface of NutriCart. It communicates with the backend to retrieve data and perform application operations.

### Step 1: Open a New Terminal

Keep the backend running in its existing terminal.

Open a second terminal in VS Code and navigate to the frontend directory:

```bash
cd frontend
```

### Step 2: Install Dependencies

Run:

```bash
npm install
```

Wait until the dependency installation finishes.

### Step 3: Configure the API URL

Check the frontend source code and environment example for the variable used to configure the backend API URL.

If the project expects a Vite environment variable, it will commonly begin with `VITE_`. Use the exact variable name and API URL expected by the existing code.

For example, if the project uses `VITE_API_URL`, its local configuration might look like:

```env
VITE_API_URL=http://localhost:8080
```

This is only an example. Confirm the actual variable name and whether the frontend expects a base URL or a URL that already includes an API path.

Ensure the backend's CORS configuration permits the frontend's local origin.

### Step 4: Start the Frontend

Run:

```bash
npm run dev
```

Vite will display the local development URL in the terminal. Open that URL in your browser. It is commonly:

```text
http://localhost:5173
```

If Vite selects another port, use the URL printed in the terminal.

## 9. Application Startup Order

Whenever you want to run NutriCart locally, follow this order:

1. Start MySQL Server.
2. Verify the `nutricart` database and required tables are available.
3. Start the Spring Boot backend.
4. Start the React frontend using `npm run dev`.
5. Open the frontend URL shown by Vite in your browser.

Keep the backend and frontend terminals running while using the application.

## 10. How the Application Connects to the Database

The application uses the following flow:

```text
User
  |
  v
React Frontend
  |
  | HTTP / REST API
  v
Spring Boot Backend
  |
  | Database connection
  v
MySQL Server
  |
  v
NutriCart Database
```

The frontend does not normally connect directly to MySQL.

Instead, the frontend sends requests to the backend API. The Spring Boot backend uses its database configuration to connect to MySQL Server and read or update data.

To connect NutriCart to a different database server:

1. Install and start MySQL Server on the target computer or server.
2. Create the required database and import the project's schema and data.
3. Configure the backend database URL, username, and password using the supported environment variables.
4. Ensure the MySQL user has the necessary permissions.
5. Start the backend and check its logs for database connection errors.
6. Start the frontend and verify that API requests work.

If the database is hosted on another machine, use the correct hostname and port. Configure network access and firewall rules securely. Do not expose MySQL directly to the public internet.

## 11. Common Problems and Solutions

### Frontend: `npm: command not found`

Install Node.js and npm, restart the terminal, and verify:

```bash
node -v
npm -v
```

### Frontend: `Missing script: "dev"`

Make sure the terminal is inside the `frontend` directory and that its `package.json` contains a `dev` script.

### Backend: Java or Maven command not found

Install the required JDK and configure your environment. If the project includes the Maven wrapper, use the wrapper command instead of relying on a global Maven installation.

### Backend: Database connection failed

Check the following:

- MySQL Server is running.
- The hostname and port are correct.
- The database exists.
- The username and password are correct.
- The user has the necessary permissions.
- The backend environment variables match the names used by the application.

### Tables do not exist

An empty database is not enough. Import the database schema or execute the project's supplied SQL scripts.

### Frontend cannot communicate with the backend

Check that:

- The backend has started successfully.
- The frontend API URL is correct.
- The backend port matches the configured API URL.
- CORS allows the frontend's origin.
- The backend API endpoints match the requests made by the frontend.

### Port already in use

Another application may be using the required port. Stop the conflicting process or configure the application to use an available port and update the related URLs accordingly.

## 12. Development Notes

- Run the frontend and backend in separate terminals.
- Keep database credentials in local environment configuration.
- Do not commit `.env` files or production secrets.
- Use the project's existing configuration files as the source of truth for ports, environment variables, scripts, and API paths.
- Back up important database data before importing or replacing database contents.

## 13. Future Enhancements

Possible future improvements include:

- More personalized grocery recommendations.
- Enhanced nutrition analysis.
- Improved pantry and expiry tracking.
- Better budget planning.
- Additional recipe recommendations.
- Improved shopping and delivery workflows.

## 14. Project Information

**Project Name:** NutriCart  
**Project Title:** Smart Grocery and Healthy Food Recommendation System  
**Project Type:** Full-Stack Web Application  
**Frontend:** React, TypeScript, Vite  
**Backend:** Java, Spring Boot  
**Database:** MySQL

**NutriCart — Shop Smart. Eat Healthy.**
