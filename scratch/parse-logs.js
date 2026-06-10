const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:\\Users\\PC-1\\.gemini\\antigravity-ide\\brain\\6170b22c-1c0b-4a0c-af64-3531be71a48c\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== SCANNING TRANSCRIPT FOR COMMANDS ===");
  for await (const line of rl) {
    if (!line) continue;
    try {
      const step = JSON.parse(line);
      
      // Look for run_command tool calls
      if (step.tool_calls) {
        for (const tc of step.tool_calls) {
          if (tc.name === 'run_command' || tc.name === 'default_api:run_command') {
            console.log(`\nStep: ${step.step_index} | Type: ${step.type}`);
            console.log(`Command: ${tc.arguments?.CommandLine}`);
          }
        }
      }
      
      // Look for text content containing keywords
      const contentStr = JSON.stringify(step);
      if (contentStr.includes("shambhu") && (contentStr.includes("ssh") || contentStr.includes("ftp") || contentStr.includes("scp") || contentStr.includes("deploy"))) {
        console.log(`\n[Keyword Match] Step: ${step.step_index} | Type: ${step.type}`);
        if (step.content) {
          console.log(`Content excerpt: ${step.content.substring(0, 300)}...`);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

main();
