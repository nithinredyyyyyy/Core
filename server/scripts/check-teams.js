import { db } from '../../server/db.js';

const missing = ['Wolves', 'Regnum Carya', 'Geekay', 'Gen.G MENA', 'Alliance MY', 'Bushido Wildcats Next Ruya'];
for (const name of missing) {
  const fuzzy = db.prepare("SELECT id, name FROM teams WHERE name LIKE ? COLLATE NOCASE LIMIT 5").all('%' + name.split(' ')[0] + '%');
  console.log(name, '->', fuzzy.map(t => t.name));
}
