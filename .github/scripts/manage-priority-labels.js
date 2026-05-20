const allowed = ['priority-p0','priority-p1','priority-p2','priority-p3','priority-p4'];
const labels = JSON.parse(process.env.LABELS_JSON || '[]').map(v => String(v).toLowerCase());
const present = labels.filter(l => allowed.includes(l));
present.sort();
const keep = present[0] || null;
const remove = present.filter(l => l !== keep);
process.stdout.write(JSON.stringify({ keep, remove, allowed }));
