/**
 * Demo seed for Trialvo shared-demo / trial stacks (empty DB).
 * Creates shop config, categories, sample products, and a demo superadmin.
 */
const {
  Admin,
  Category,
  Product,
  ShopConfig,
  sequelize,
} = require('../src/models');

const U = 'https://images.unsplash.com';
const DEMO_PRODUCT_IMAGES = {
  'chocolate-truffle-box': `${U}/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&q=85`,
  'mixed-nut-jar': `${U}/photo-1513885535751-8b47f1f3e2c0?w=600&h=600&fit=crop&q=85`,
  'premium-cookies': `${U}/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&q=85`,
};

async function upsertDemoProductImages() {
  for (const [slug, image] of Object.entries(DEMO_PRODUCT_IMAGES)) {
    const row = await Product.findOne({ where: { slug } });
    if (!row) continue;
    if (!row.image) {
      row.image = image;
      row.images = [image];
      await row.save();
    }
  }
}

async function seedTrialDemo() {
  const email = process.env.TRIAL_DEMO_ADMIN_EMAIL || 'demo@trialvo.com';
  const password = process.env.TRIAL_DEMO_ADMIN_PASSWORD || 'Trialvo@Demo123';
  const name = process.env.TRIAL_DEMO_ADMIN_NAME || 'Trialvo Demo';

  const existingAdmin = await Admin.findOne({ where: { email } });
  if (existingAdmin) {
    existingAdmin.password = password;
    existingAdmin.name = name;
    existingAdmin.role = 'superadmin';
    existingAdmin.is_active = true;
    await existingAdmin.save();
    console.log(`[trial-seed] admin ${email} (updated)`);
  } else {
    await Admin.create({
      name,
      email,
      password,
      role: 'superadmin',
      is_active: true,
    });
    console.log(`[trial-seed] admin ${email}`);
  }

  await ShopConfig.getConfig();

  const catCount = await Category.count();
  if (catCount === 0) {
    const snacks = await Category.create({
      name: 'Snacks & Treats',
      name_bn: 'স্ন্যাকস ও ট্রিটস',
      slug: 'snacks',
      is_active: true,
    });
    const gifts = await Category.create({
      name: 'Gift Boxes',
      name_bn: 'গিফট বক্স',
      slug: 'gift-boxes',
      is_active: true,
    });

    const sampleProducts = [
      {
        name: 'Chocolate Truffle Box',
        name_bn: 'চকলেট ট্রাফল বক্স',
        slug: 'chocolate-truffle-box',
        price: 450,
        stock_qty: 50,
        in_stock: true,
        category_id: gifts.id,
        is_combo_eligible: true,
        image: DEMO_PRODUCT_IMAGES['chocolate-truffle-box'],
        images: [DEMO_PRODUCT_IMAGES['chocolate-truffle-box']],
      },
      {
        name: 'Mixed Nut Jar',
        name_bn: 'মিক্সড নাট জার',
        slug: 'mixed-nut-jar',
        price: 280,
        stock_qty: 80,
        in_stock: true,
        category_id: snacks.id,
        is_combo_eligible: true,
        image: DEMO_PRODUCT_IMAGES['mixed-nut-jar'],
        images: [DEMO_PRODUCT_IMAGES['mixed-nut-jar']],
      },
      {
        name: 'Premium Cookies Pack',
        name_bn: 'প্রিমিয়াম কুকিজ প্যাক',
        slug: 'premium-cookies',
        price: 190,
        stock_qty: 100,
        in_stock: true,
        category_id: snacks.id,
        is_combo_eligible: true,
        image: DEMO_PRODUCT_IMAGES['premium-cookies'],
        images: [DEMO_PRODUCT_IMAGES['premium-cookies']],
      },
    ];

    for (const row of sampleProducts) {
      await Product.create(row);
    }
    console.log('[trial-seed] categories + products');
  }

  await upsertDemoProductImages();

  console.log('[trial-seed] done');
}

module.exports = { seedTrialDemo };

if (require.main === module) {
  seedTrialDemo()
    .then(() => sequelize.close())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
