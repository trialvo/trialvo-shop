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
      },
    ];

    for (const row of sampleProducts) {
      await Product.create(row);
    }
    console.log('[trial-seed] categories + products');
  }

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
