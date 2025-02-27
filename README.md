# Taboola Sponsored Content Widget

This project implements a widget that displays sponsored content recommendations from the Taboola REST API, focusing exclusively on outbound links that open in new tabs.

## Project Structure

```
project-root/
├── index.html       # Main HTML file
├── css/
│   └── styles.css   # CSS styles for the widget
├── js/
│   ├── app.js       # Main application code
│   ├── api.js       # Code for handling API requests
│   └── widget.js    # Widget implementation
└── tests/           # Test files
    └── widget.test.js
```

## Features

- Fetches sponsored content recommendations from Taboola API
- Displays recommendations in a sidebar layout next to content
- Opens all content in new tabs (outbound links)
- Clearly labels all content as sponsored
- Interactive close button to dismiss and replace recommendations
- Handles empty recommendation lists with clear user feedback
- Provides user-friendly loading and error states
- "Try Again" buttons for error recovery
- Responsive design that converts to mobile layout on smaller screens
- Sticky sidebar that stays in view as user scrolls
- Designed for future extension with more recommendation types

## Running the Project

### Local Development

1. Clone the repository or download the files.
2. You can run the project locally using any simple HTTP server.

   **Using Node.js:**
   First, install `http-server` globally:
   ```
   npm install -g http-server
   ```
   Then run:
   ```
   http-server
   ```

3. Open your browser and navigate to `http://localhost:8000` (or the port specified by your server).

### Important Note about the Taboola API

The Taboola API used in this project requires a USA VPN to get responses. Make sure you're using a VPN with a USA location if you're experiencing issues with fetching recommendations.

## Running Tests

To run the tests, you'll need to set up Jest. First, initialize a package.json file if you don't have one:

```
npm init -y
```

Then install Jest as a dev dependency:

```
npm install --save-dev jest
```

Add the following to your package.json in the "scripts" section:

```json
"scripts": {
  "test": "jest"
}
```

Run the tests with:

```
npm test
```

## Notes

- The widget uses vanilla JavaScript with no libraries or frameworks for the runtime code.
- CSS is designed to be responsive for both desktop and mobile views.
- The code follows object-oriented principles for better organization and extendability.
