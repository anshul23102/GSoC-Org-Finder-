const fs = require('fs');

const mentorsPath = '.github/reviewers/gssoc-mentors.json';
const statsPath = '.github/reviewers/mentor-stats.json';
const outPath = '.github/reviewers/mentor-leaderboard.md';

function readJson(path, fallback) { try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch { return fallback; } }
function n(v){ return Number.isFinite(Number(v)) ? Number(v) : 0; }
function days(iso){ if(!iso) return 9999; const t=new Date(iso).getTime(); if(!Number.isFinite(t)) return 9999; return Math.max(0,(Date.now()-t)/86400000);} 

const mentors = (readJson(mentorsPath,{reviewers:[]}).reviewers||[]);
const stats = readJson(statsPath,{mentors:{}}).mentors||{};

const rows = mentors.map((u)=>{
  const s = stats[u]||{};
  const d = days(s.last_reviewed_at);
  const decay = Math.max(0, 1 - Math.min(0.8, d/120));
  const quality = n(s.review_quality_score);
  const score = (
    n(s.approvals)*2 + n(s.merged_reviews)*3 + n(s.assignment_approvals)*2 +
    n(s.reviews)*0.5 + n(s.priority_reviews)*1.5 + quality
  ) * decay;
  const activity = d <= 14 ? '🟢 Active' : d <= 45 ? '🟡 Warm' : '🔴 Inactive';
  return {u,score,d,activity,approvals:n(s.approvals),merged:n(s.merged_reviews),quality};
}).sort((a,b)=>b.score-a.score || a.d-b.d || a.u.localeCompare(b.u));

const medals = ['🥇','🥈','🥉'];
const lines = [
  '# Mentor Leaderboard',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Rank | Mentor | Score | Approvals | Merged Reviews | Quality | Activity |',
  '|---:|---|---:|---:|---:|---:|---|',
  ...rows.map((r,i)=>`| ${medals[i]||`#${i+1}`} | @${r.u} | ${r.score.toFixed(2)} | ${r.approvals} | ${r.merged} | ${r.quality.toFixed(2)} | ${r.activity} |`)
];

const next = lines.join('\n') + '\n';
const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath,'utf8') : '';
if (prev === next) {
  console.log('No leaderboard changes');
  process.exit(0);
}
fs.writeFileSync(outPath,next);
console.log('Leaderboard updated');
