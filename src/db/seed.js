const bcrypt = require('bcryptjs');
const db = require('../config/db');

function seed() {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existingAdmin) {
    console.log('ℹ Admin user already exists. Skipping admin seed.');
  } else {
    const passwordHash = bcrypt.hashSync('Admin@12345', 10);
    db.prepare(`
      INSERT INTO users (full_name, phone, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `).run('مدير النظام', '01000000000', 'admin@mghagha.local', passwordHash);
    console.log('✔ Admin user created. Phone: 01000000000 | Password: Admin@12345');
  }

  const areaCount = db.prepare('SELECT COUNT(*) AS c FROM areas').get().c;
  if (areaCount === 0) {
    const insertArea = db.prepare('INSERT OR IGNORE INTO areas (name, slug, is_active) VALUES (?, ?, 1)');
    const areas = [
      ['مغاغة', 'maghagha'],
      ['صندفا', 'sandafa'],
      ['الفنت', 'el-fant'],
      ['أبو حلال', 'abu-hilal'],
      ['بني خالد', 'beni-khaled'],
      ['شارونة', 'sharona'],
      ['عباد شارونة', 'ebad-sharona'],
      ['جزيرة شارونة', 'gaziret-sharona'],
      ['عزبة أبو ميليجي', 'ezbet-abu-miligi'],
      ['الكوم الأخضر', 'el-kom-el-akhdar'],
      ['قرارة', 'qarara'],
      ['زاوية الجدمي', 'zawyet-el-gadami'],
      ['أولاد الشيخ', 'awlad-el-sheikh'],
      ['الفانت', 'el-fant-2'],
      ['شم القبلية', 'sham-el-qiblia'],
      ['شم البحرية', 'sham-el-bahriya'],
      ['أبو بشن', 'abu-beshn'],
      ['نزلة أحمد يونس', 'nazlet-ahmed-younes'],
      ['عزبة صادق', 'ezbet-sadeq'],
      ['نزلة شيحة', 'nazlet-shiha'],
      ['منشأة نيازي', 'menshet-niazi'],
      ['برطباط', 'bartabat'],
      ['قرية التحرير', 'qaryat-el-tahrir'],
      ['دير الجرنس', 'deir-el-garnas'],
      ['برطباط الجبل', 'bartabat-el-gabal'],
      ['عزبة السلسة', 'ezbet-el-salsa'],
      ['عزبة المعطن', 'ezbet-el-maatan'],
      ['بني واللمس', 'beni-wallams'],
      ['عزبة سيف عبد الجواد', 'ezbet-seif-abd-el-gawad'],
      ['كوم الحاصل', 'kom-el-hasil'],
      ['أبا الوقف', 'aba-el-waqf'],
      ['العباسية', 'el-abbasiya'],
      ['قفادة', 'qafada'],
      ['الشيخ زياد', 'el-sheikh-ziyad'],
      ['دهرط', 'dahrat'],
      ['طمبدي', 'tambadi'],
      ['بطران طمبدي', 'batran-tambadi'],
      ['إشنين الناصري', 'ishnin-el-nasiri'],
      ['شونة', 'shona'],
      ['قرية ميانة', 'qaryat-miyana'],
      ['بلهاسة', 'belhasa'],
      ['ملطية', 'maltaya'],
      ['سيف النصر', 'seif-el-nasr'],
      ['دهمرو', 'dahmaro'],
      ['عزبة يوسف صدقي', 'ezbet-yousef-sadqi'],
      ['قرية علي حلمي', 'qaryat-ali-helmi']
    ];
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insertArea.run(row[0], row[1]);
    });
    insertMany(areas);
    console.log(`✔ Seeded ${areas.length} areas.`);
  } else {
    console.log('ℹ Areas already seeded. Skipping.');
  }

  const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, slug, parent_id, is_active) VALUES (?, ?, ?, 1)');
    const main = [
      ['العربيات',          'vehicles'],
      ['الموبايلات',         'mobiles'],
      ['أجهزة منزلية',       'home-appliances'],
      ['أثاث منزلي',         'furniture'],
      ['أدوات المطبخ',       'kitchen-tools'],
      ['الحاسوب',            'computers'],
      ['مواشي وحيوانات',     'livestock'],
      ['المحاصيل الزراعية',  'crops'],
      ['العقارات والأراضي',  'real-estate'],
      ['قسم المهن',          'professions'],
      ['ملابس وأزياء',       'clothing'],
      ['عطور وإكسسوارات',   'accessories'],
    ];
    const subs = {
      'vehicles':        [['عربيات للبيع','vehicles-for-sale'],['قطع غيار','spare-parts'],['موتوسيكلات','motorcycles'],['كماليات','vehicle-accessories']],
      'mobiles':         [['موبايلات','mobile-phones'],['تابلت','tablets'],['سماعات أذن','earphones'],['سماعات لاسلكية','wireless-headphones']],
      'home-appliances': [['ثلاجات','refrigerators'],['ديب فريزر','deep-freezers'],['فلاتر ماء','water-filters'],['تكييفات','air-conditioners'],['مراوح','fans'],['سخانات','water-heaters'],['دفايات','room-heaters'],['غلايات','kettles'],['شاشات','screens-tvs']],
      'furniture':       [['سرير','beds'],['غرف نوم','bedrooms'],['مطبخ','kitchen-furniture'],['كنبة','sofas'],['كرسي','chairs'],['مكتب','desks']],
      'kitchen-tools':   [['حلل','pots'],['طاسات','bowls'],['أطباق','plates'],['معالق','spoons'],['شوك','forks'],['سكاكين','knives'],['مغارف','ladles'],['ملاعق خشبية','wooden-spoons']],
      'computers':       [['كمبيوتر','desktop-computers'],['لابتوب','laptops'],['اكسسوارات','computer-accessories'],['طابعات','printers']],
      'livestock':       [['أبقار','cows'],['جمال','camels'],['ماعز','goats'],['خرفان','sheep'],['خيل','horses'],['حمير','donkeys'],['قطط','cats'],['كلاب','dogs'],['سلاحف','turtles'],['أسماك زينة','ornamental-fish']],
      'crops':           [['خضراوات','vegetables'],['فواكه','fruits']],
      'real-estate':     [['شقق للبيع','apartments-for-sale'],['شقق للإيجار','apartments-for-rent'],['بيت للبيع','houses-for-sale'],['بيت للإيجار','houses-for-rent'],['أراضي زراعية','agricultural-land'],['أراضي سكنية','residential-land'],['أراضي تجارية','commercial-land'],['أراضي صناعية','industrial-land']],
      'professions':     [['كهربائي','electricians'],['سباك','plumbers'],['نجار','carpenters'],['فني تكييف','ac-technicians'],['فني صيانة سيارات','car-mechanics']],
      'clothing':        [['ملابس رجالي','mens-clothing'],['ملابس نسائي','womens-clothing'],['ملابس أطفال','kids-clothing'],['ملابس رياضية','sportswear'],['جلابيب وأزياء تقليدية','traditional-clothing'],['ملابس مناسبات','occasion-clothing']],
      'accessories':     [['عطور وبخور','perfumes'],['ساعات','watches'],['نظارات','eyewear'],['حقائب وشنط','bags'],['أحذية','shoes'],['مجوهرات وإكسسوارات','jewelry']],
    };
    const insertAll = db.transaction(() => {
      for (const [name, slug] of main) {
        const { lastInsertRowid: parentId } = insertCat.run(name, slug, null);
        for (const [sname, sslug] of (subs[slug] || [])) {
          insertCat.run(sname, sslug, parentId);
        }
      }
    });
    insertAll();
    const total = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
    console.log(`✔ Seeded ${total} categories (12 main + 72 subcategories).`);
  } else {
    console.log('ℹ Categories already seeded. Skipping.');
  }

  console.log('✔ Seeding complete.');
}

seed();
