const fs = require("fs");
const path = require("path");
const axios = require("axios");
const archiver = require("archiver");
const { getJiraTicket } = require("./jiraClient");

const extractTechDetails = (text) => {
  const urls = text.match(/http[s]?:\/\/[^\s)]+/g) || [];
  return urls.map(url => `- ${url}`).join("\n");
};

const extractACList = (text) => {
  const acMatch = text.match(/Acceptance Criteria[:\n\-]+([\s\S]*?)(\n\n|$)/i);
  if (acMatch) {
    return acMatch[1]
      .split(/\n|-/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
};

const getImageAttachments = (attachments) =>
  attachments.filter(att => att.mimeType?.startsWith("image/"));

const getDocAttachments = (attachments) =>
  attachments.filter(att =>
    att.mimeType && !att.mimeType.startsWith("image/")
  );

const downloadFile = async (url, localPath) => {
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      auth: {
        username: process.env.JIRA_EMAIL,
        password: process.env.JIRA_API_TOKEN,
      },
    });

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`📥 Downloaded: ${localPath}`);
  } catch (err) {
    console.error(`⚠️ Failed to download file from ${url}: ${err.message}`);
  }
};

const generateFeatureFile = (summary, acList) => {
  return [
    `Feature: ${summary}`,
    ``,
    ...acList.map((ac, i) => `  Scenario: Verify ${ac}\n    Given [precondition]\n    When [action based on AC]\n    Then [expected result]\n`)
  ].join("\n");
};

const zipFolder = async (source, outPath) => {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", err => reject(err))
      .pipe(stream);

    stream.on("close", resolve);
    archive.finalize();
  });
};

const run = async () => {
  const ticketKeys = process.argv.slice(2);
  const fallbackTickets = ["OLCD-888"];
  const ticketsToProcess = ticketKeys.length ? ticketKeys : fallbackTickets;

  const baseOutput = path.join(__dirname, "output");
  if (!fs.existsSync(baseOutput)) fs.mkdirSync(baseOutput);

  for (const ticketKey of ticketsToProcess) {
    try {
      const ticket = await getJiraTicket(ticketKey);

      const ticketFolder = path.join(baseOutput, ticketKey);
      const screenshotDir = path.join(ticketFolder, "screenshots");
      const docsDir = path.join(ticketFolder, "docs");

      fs.mkdirSync(ticketFolder, { recursive: true });
      fs.mkdirSync(screenshotDir, { recursive: true });
      fs.mkdirSync(docsDir, { recursive: true });

      const techDetails = extractTechDetails(ticket.description);
      const acList = extractACList(ticket.description);
      const acText = acList.length ? acList.map(a => `- ${a}`).join("\n") : "None found";

      const imageAttachments = getImageAttachments(ticket.attachments);
      const docAttachments = getDocAttachments(ticket.attachments);

      for (const img of imageAttachments) {
        const imagePath = path.join(screenshotDir, img.filename);
        await downloadFile(img.url, imagePath);
      }

      for (const doc of docAttachments) {
        const docPath = path.join(docsDir, doc.filename);
        await downloadFile(doc.url, docPath);
      }

      const screenshotBlock = imageAttachments.length
        ? imageAttachments.map(img =>
            `- ![${img.filename}](./screenshots/${img.filename})\n  [View in Jira](${img.url})`
          ).join("\n")
        : "None";

      const docBlock = docAttachments.length
        ? docAttachments.map(doc =>
            `- [${doc.filename}](./docs/${doc.filename})\n  [View in Jira](${doc.url})`
          ).join("\n")
        : "None";

      const output = `
Summary: ${ticket.summary}

Description:
${ticket.description.trim()}

Tech Details:
${techDetails || "None"}

Acceptance Criteria:
${acText}

Designs:
None

Screenshots:
${screenshotBlock}

Documentation:
${docBlock}

Comments:
${ticket.comments || "None"}
      `.trim();

      // 📄 Export .md
      const mdFile = `${ticketKey}.md`;
      const mdPath = path.join(ticketFolder, mdFile);
      const fileContent = `# Ticket: ${ticketKey}\n\n\`\`\`bash\n${output}\n\`\`\``;
      fs.writeFileSync(mdPath, fileContent, "utf8");
      console.log(`📝 Exported: ${mdPath}`);

      // ✅ Export .feature
      if (acList.length) {
        const featureContent = generateFeatureFile(ticket.summary, acList);
        const featurePath = path.join(ticketFolder, `${ticketKey}.feature`);
        fs.writeFileSync(featurePath, featureContent, "utf8");
        console.log(`🧪 Exported: ${featurePath}`);
      }

      // 📦 Zip it up
      // 📦 Zip it up
        const zipPath = path.join(ticketFolder, `${ticketKey}.zip`);
        await zipFolder(ticketFolder, zipPath);
        console.log(`📦 Zipped inside folder: ${zipPath}`);

    } catch (err) {
      console.error(`❌ Error processing ${ticketKey}: ${err.message}`);
    }
  }
};

run();