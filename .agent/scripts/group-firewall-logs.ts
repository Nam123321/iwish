import * as fs from 'fs';

const logFile = '_iwish-output/adhoc-workspace/scratch/firewall-log.txt';
const content = fs.readFileSync(logFile, 'utf8');

const regex = /Firewall blocked 'completed' for Story ([\d.]+): Missing evidence for \[(.*?)\]/g;

const missingGroups: Record<string, string[]> = {};

let match;
while ((match = regex.exec(content)) !== null) {
  const storyId = match[1];
  const missing = match[2].replace(/'/g, '');
  
  if (!missingGroups[missing]) {
    missingGroups[missing] = [];
  }
  missingGroups[missing].push(storyId);
}

let md = '### Danh sách các Story bị Firewall hạ cấp\n\n';
md += 'Dưới đây là danh sách các story bị Zero-Trust Firewall chặn (không cho phép trạng thái `completed`) do thiếu Evidence, được phân nhóm theo loại evidence bị thiếu:\n\n';

for (const [missing, stories] of Object.entries(missingGroups)) {
  md += `#### Thiếu Evidence: \`${missing}\` (${stories.length} stories)\n`;
  md += `- ${stories.map(s => `**${s}**`).join(', ')}\n\n`;
}

fs.writeFileSync('_iwish-output/adhoc-workspace/scratch/firewall-downgrades.md', md, 'utf8');
console.log('Done!');
