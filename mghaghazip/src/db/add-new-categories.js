const db = require('../config/db');

function addNewCategories() {
  const insertCat = db.prepare('INSERT INTO categories (name, slug, parent_id, is_active) VALUES (?, ?, ?, 1)');

  const newMain = [
    ['مركبات مائية', 'marine-vehicles'],
    ['رياضة ولياقة', 'sports-fitness'],
  ];

  const newSubs = {
    'marine-vehicles': [
      ['قوارب صيد', 'fishing-boats'],
      ['قوارب نزهة', 'pleasure-boats'],
      ['مراكب شراعية', 'sailboats'],
      ['محركات بحرية', 'marine-engines'],
      ['معدات غوص', 'diving-equipment'],
    ],
    'sports-fitness': [
      ['أجهزة لياقة', 'fitness-equipment'],
      ['دراجات', 'bicycles'],
      ['معدات صيد', 'fishing-gear'],
      ['أدوات رياضية متنوعة', 'sports-gear'],
      ['ملابس رياضية', 'athletic-wear'],
    ],
  };

  const addIfMissing = db.transaction(() => {
    for (const [name, slug] of newMain) {
      const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
      if (!existing) {
        const { lastInsertRowid: parentId } = insertCat.run(name, slug, null);
        for (const [sname, sslug] of (newSubs[slug] || [])) {
          insertCat.run(sname, sslug, parentId);
        }
        console.log(`✔ Added: ${name} (${(newSubs[slug] || []).length} subcategories)`);
      } else {
        console.log(`ℹ Already exists: ${name}`);
      }
    }
  });

  addIfMissing();
  console.log('✔ Done.');
}

addNewCategories();
