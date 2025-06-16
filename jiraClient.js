require("dotenv").config();
const axios = require("axios");

const extractTextFromADF = (adf) => {
  if (!adf || !adf.content) return "";
  return adf.content.map(block => {
    if (block.content) {
      return block.content.map(textNode => textNode.text || "").join("");
    }
    return "";
  }).join("\n");
};

const getJiraTicket = async (ticketKey) => {
  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

  const response = await axios.get(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}`, {
    auth: {
      username: JIRA_EMAIL,
      password: JIRA_API_TOKEN,
    },
    headers: {
      Accept: "application/json",
    },
  });

  const fields = response.data.fields;

  // Extract attachments
  const attachments = (fields.attachment || []).map(a => ({
    filename: a.filename,
    url: a.content,
  }));

  return {
    key: response.data.key,
    summary: fields.summary,
    description: extractTextFromADF(fields.description),
    comments: (fields.comment?.comments || [])
      .map(c => extractTextFromADF(c.body))
      .join("\n---\n"),
    attachments,
  };
};

module.exports = { getJiraTicket };