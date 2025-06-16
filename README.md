# 🧪 Jira Gherkin Exporter

A Node.js CLI utility to extract Jira ticket details (description, tech info, AC, attachments, comments), generate `.md` and `.feature` files, download screenshots, and zip everything — ready for manual QA or automated BDD workflows.

---

## 🚀 Features

- 🔐 Connects to Jira via REST API (uses API Token)
- 📋 Extracts full ticket content including:
  - Description
  - Acceptance Criteria
  - Tech details
  - Attachments (images/docs)
  - Comments
- 📂 Outputs per-ticket folders:
  - `*.md` summary
  - `*.feature` with Gherkin scenarios
  - `screenshots/` (Jira image attachments)
  - `docs/` (PDF, XLSX, DOCX, etc.)
  - `.zip` archive of the entire ticket folder
- 📤 Optional: Auto-push `.feature` files to a Git repo

---

## ⚙️ Setup

### 1. Clone the repo

```bash
git clone https://github.com/Maagallaness/jira-gherkin-exporter.git
cd jira-gherkin-exporter


⸻

2. Install dependencies

npm install


⸻

3. Create a .env file

touch .env

Add the following variables:

# Jira credentials
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your_api_token_here

# Optional Git auto-push config
GIT_REPO_PATH=../gherkin-repo
GIT_BRANCH=main
GIT_AUTHOR=QA Bot <qa@example.com>

🔐 To generate your API token:
https://id.atlassian.com/manage/api-tokens

⸻

🧪 Usage

Extract a single Jira ticket

node index.js "TICKET NAME"

Extract multiple tickets at once

node index.js "TICKET NAME" "TICKET NAME" "TICKET NAME"


⸻

📁 Output Structure (per ticket)

output/
└── APEX-1557/
    ├── "TICKET NAME".md           ← Markdown summary
    ├── "TICKET NAME".feature      ← Gherkin file
    ├── "TICKET NAME".zip          ← Archived folder (same contents)
    ├── screenshots/           ← Jira image attachments
    └── docs/                  ← PDF, XLSX, DOCX attachments


⸻

💻 Optional Git Push (.feature files)

If GIT_REPO_PATH is set in .env, each .feature file will:
	•	Be copied to that repo
	•	Automatically git add, commit, and push to the specified branch

⸻

📦 Coming Soon (Suggestions)
	•	npm link CLI install as jira-gherkin
	•	.feature sync to test case tools (like QMetry , QAse, Xray)
	•	Output to Google Drive / Slack / Confluence

⸻

📄 License

MIT — free to use, fork, and contribute!

⸻

👤 Author

Developed by Roberto Magallanes
QA Automation | BDD Enthusiast | Jira + Git power user 🚀

