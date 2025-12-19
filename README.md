
  # Subtitles Management System

  This is a code bundle for Subtitles Management System. The original project is available at https://www.figma.com/design/9dtCgLMxOrL0rSvvzweDf8/Subtitles-Management-System.

## Running the code

  **Prerequisites:**
  - Run `npm i` to install the dependencies.

  **Initial Start:**
  1. **Backend:** Run `npm run server` to start the backend server.
  2. **Mock Translator:** Open a new terminal and run `python scripts/mock_libretranslate.py` for the LibreTranslate mock server.
  3. **Frontend:** Open a new terminal and run `npm run dev` to start the development server.

  ## Stopping and Restarting the Application
  
  ### To Close the Application:
  1. Go to your terminal(s) where the servers are running.
  2. Press `Ctrl + C` in each terminal tab or window to stop the running processes.
  3. Close the browser tab.

  ### To Reopen the Application:
  1. Open your terminal or command prompt in the project directory.
  2. **Start the Backend:**
     Run `npm run server`
  3. **Start the Translation Mock Server:**
     Open a new terminal tab/window and run `python scripts/mock_libretranslate.py`
  4. **Start the Frontend:**
     Open another new terminal tab/window and run `npm run dev`
  5. Open your browser and navigate to the URL shown in the frontend terminal (usually `http://localhost:5173`).