# DSR Analysis Project Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Console account
- OpenAI API account

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
   GOOGLE_SHEETS_CLIENT_ID=your_google_client_id_here
   GOOGLE_SHEETS_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_SHEETS_REFRESH_TOKEN=your_refresh_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   DSR_SHEET_ID=1MBcdsEJuaX4c8B0cHrBHxyr6cbOO3HWnm5vFZ7awYeU
   DSR_SHEET_RANGE=A5:U21
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Google Sheets API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials JSON file
6. Use the credentials to generate a refresh token

## OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add the API key to your `.env` file

## Usage

1. Start both backend and frontend servers
2. Open your browser and go to `http://localhost:5173`
3. Click "Refresh Data" to fetch DSR data from Google Sheets
4. Click "Get AI Analysis" to generate AI insights about store performance

## Features

- **Real-time DSR Data**: Fetches data directly from Google Sheets
- **AI Analysis**: Uses OpenAI to analyze performance issues
- **Interactive Dashboard**: React Bootstrap components with charts
- **Performance Metrics**: Visual representation of store performance
- **Actionable Insights**: AI-generated recommendations for improvement

## Troubleshooting

- Ensure all environment variables are properly set
- Check that the Google Sheets API is enabled
- Verify the sheet ID and range are correct
- Make sure both servers are running on the correct ports
