const fs = require('fs');

const statsPath = '.github/reviewers/mentor-stats.json';
const mentorsPath = '.github/reviewers/gssoc-mentors.json';

const reviewer = process.env.REVIEWER;
const reviewState = process.env.REVIEW_STATE;
const reviewId = String(process.env.REVIEW_ID || '');
const reviewedAt = process.env.REVIEWED_AT || new Date().toISOString();
const isMerged = process.env.PR_MERGED === 'true';
const isPriority = process.env.IS_PRIORITY === 'true';
const isAssignmentApproval = process.env.IS_ASSIGNMENT_APPROVAL === 'true';
const lowEffort = process.env.IS_LOW_EFFORT === 'true';

function readJson(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    if (error && error.code === 'ENOENT') return fallback;
    throw error;
  }
}
const mentors = new Set((readJson(mentorsPath, { reviewers: [] }).reviewers || []).map(String));
if (!reviewer || !mentors.has(reviewer)) process.exit(0);

const statsData = readJson(statsPath, { mentors: {} });
statsData.mentors = statsData.mentors || {};

if (!statsData.mentors[reviewer]) {
  statsData.mentors[reviewer] = {
    reviews: 0, approvals: 0, changes_requested: 0, comments: 0,
    merged_reviews: 0, assignment_approvals: 0, priority_reviews: 0,
    review_quality_score: 0, last_reviewed_at: '', review_ids: []
  };
}
const m = statsData.mentors[reviewer];
m.review_ids = Array.isArray(m.review_ids) ? m.review_ids.map(String) : [];
if (!reviewId || m.review_ids.includes(reviewId)) process.exit(0);

m.reviews = (m.reviews || 0) + 1;
if (reviewState === 'APPROVED') m.approvals = (m.approvals || 0) + 1;
if (reviewState === 'CHANGES_REQUESTED') m.changes_requested = (m.changes_requested || 0) + 1;
if (reviewState === 'COMMENTED') m.comments = (m.comments || 0) + 1;
if (isMerged) m.merged_reviews = (m.merged_reviews || 0) + 1;
if (isAssignmentApproval) m.assignment_approvals = (m.assignment_approvals || 0) + 1;
if (isPriority) m.priority_reviews = (m.priority_reviews || 0) + 1;

const qualityDelta = lowEffort ? -1.5 : (reviewState === 'APPROVED' ? 1.2 : 0.8);
m.review_quality_score = Number(((m.review_quality_score || 0) + qualityDelta).toFixed(2));
m.last_reviewed_at = reviewedAt;
m.review_ids.push(reviewId);
m.review_ids = m.review_ids.slice(-200);

const ordered = Object.keys(statsData.mentors).sort().reduce((acc, k) => (acc[k] = statsData.mentors[k], acc), {});
statsData.mentors = ordered;
fs.writeFileSync(statsPath, JSON.stringify(statsData, null, 2) + '\n');
console.log(`Updated mentor stats for ${reviewer}`);
