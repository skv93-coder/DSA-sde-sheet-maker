import { promises as fs } from "fs";
import { join } from "path";
import { cwd } from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import axios from "axios";
import { config } from "dotenv";
config();

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const spreadsheetId = process.env.sheetId;
const sheetName = process.env.sheetName;
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = join(cwd(), "token.json");
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const { client_id, client_secret, refresh_token } = process.env;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id,
    client_secret,
    refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

const getQustion = async ({ titleSlug, timestamp }) => {
  const body = {
    query:
      "\n    query questionTitle($titleSlug: String!) {\n  question(titleSlug: $titleSlug) {\n    questionId\n    questionFrontendId\n    title\n    titleSlug\n    isPaidOnly\n    difficulty\n    likes\n    dislikes\n  }\n}\n    ",
    variables: {
      titleSlug,
    },
  };
  const { data } = await axios({
    url: `https://leetcode.com/graphql`,
    data: body,
    method: "post",
  });
  return [
    new Date(timestamp * 1000).toLocaleDateString(),
    data.data.question.questionFrontendId + ". " + data.data.question.title,
    1,
    `https://leetcode.com/problems/${titleSlug}`,
    "",
    data.data.question.difficulty,
  ];
};

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function getSheets(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!C1:C3000`,
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    return;
  }

  const qs = [];

  rows.forEach((row, i) => {
    qs.push(row[0].split(".")[1] || row[0].split(".")[0].trim());
    qs[qs.length - 1] = qs.at(-1).trim().toLowerCase();
  });

  return qs;
}
const getQs = async () => {
  const { data } = await axios.post("https://leetcode.com/graphql", {
    query:
      "\n    query recentAcSubmissions($username: String!, $limit: Int!) {\n  recentAcSubmissionList(username: $username, limit: $limit) {\n    id\n    title\n    titleSlug\n    timestamp\n  }\n}\n    ",
    variables: {
      username: process.env.username,
      limit: 20,
    },
  });

  return data.data.recentAcSubmissionList;
};

const writeSheet = async (auth) => {
  const [arrOfQs, listQs] = await Promise.all([
    authorize().then(getSheets).catch(console.error),
    getQs(),
  ]);
  const newQs = listQs.filter(
    (qs) => !arrOfQs.includes(qs.title.toLowerCase())
  );

  if (newQs.length) {
    const updateQs = await Promise.all(newQs.map((q) => getQustion(q)));

    try {
      const sheets = google.sheets({ version: "v4", auth });
      sheets.spreadsheets.values
        .update({
          spreadsheetId,
          range: `${sheetName}!B${arrOfQs.length + 1}:H${
            arrOfQs.length + 1 + newQs.length
          }`,
          valueInputOption: "RAW",
          requestBody: {
            values: updateQs,
          },
        })
        .then((response) => {
          const result = response.result;
        });
    } catch (err) {
      return;
    }
  }
};

authorize().then(writeSheet).catch(console.log);
