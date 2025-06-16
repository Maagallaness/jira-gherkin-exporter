// parseAndGenerate.js
const extractAcceptanceCriteria = (description) => {
    const acMatches = description.match(/(?<=Acceptance Criteria[:\n-])[\s\S]*?(?=\n\n|$)/gi);
    if (!acMatches) return [];
  
    return acMatches[0]
      .split(/\n|-/)
      .map(line => line.trim())
      .filter(line => line.length > 5);
  };
  
  const toGherkin = (acList, title) => {
    return acList.map((ac, i) => {
      return `Scenario ${i + 1}: Verify ${title} - ${ac.slice(0, 50)}...
    Given [precondition]
    When [action based on AC]
    Then [expected result]`;
    }).join("\n\n");
  };
  
  module.exports = { extractAcceptanceCriteria, toGherkin };