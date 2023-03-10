# DSA-sde-sheet-maker
This repository contains a JavaScript file that fetches the recently solved questions by the user from LeetCode and adds them to a Google Sheet.

Requirements
Node.js
Google Account
Google API credentials file
google-auth-library, googleapis, and node-fetch Node packages.
Installation
Clone this repository:

bash
Copy code

git clone https://github.com/skv93-coder/DSA-sde-sheet-maker.git
Install the required Node packages:

bash
Copy code
yarn add @google-cloud/local-auth googleapis axios dotenv

Follow the Google Sheets API Quickstart Guide to enable the Google Sheets API and generate the credentials.json file.

Move the credentials.json file to the project directory's .env file according to .env.example.
also add the username, sheet name and sheetid in .env file

Run the script:

bash
Copy code
node script.js
Usage
Run the script using the command above.

The script will then fetch the recently solved questions by the user and add them to a Google Sheet acc to .env file.



License
This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/license/mit/) file for details.
