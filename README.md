
  # Subtitles Management System
## Running the code

  **Prerequisites:**
  - Run `npm i` to install the dependencies.

  **Initial Start:**
  1. **Backend:** Run `npm run server` to start the backend server.
  2. **Mock Translator:** Open a new terminal and run `python scripts/mock_libretranslate.py` for the LibreTranslate mock server.
  3. **Custom NLP Model:** Double-click `start_nlp.bat` OR run `python main.py` in `server/python_service`. (See `README_NLP.md` for optimization details).
  4. **Frontend:** Open a new terminal and run `npm run dev` to start the development server.

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
  4. **Start the Custom NLP Service:**
     Double-click `start_nlp.bat` script in the root directory.
  5. **Start the Frontend:**
     Open another new terminal tab/window and run `npm run dev`
  6. Open your browser and navigate to the URL shown in the frontend terminal (usually `http://localhost:5173`).

  ## Mock account
  User 1:
  - Email: john@example.com
  - Password: password123

  User 2:
  - Email: trung@example.com
  - Password: 123456
