const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteSettings = sequelize.define('SiteSettings', {
 id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

 // ── General ──────────────────────────────────────────────
 site_name: { type: DataTypes.STRING(100) },
 site_tagline: { type: DataTypes.STRING(255) },
 site_description: { type: DataTypes.TEXT },

 // ── Contact ───────────────────────────────────────────────
 contact_address: { type: DataTypes.STRING(255) },
 contact_phone: { type: DataTypes.STRING(50) },
 contact_email: { type: DataTypes.STRING(150) },
 contact_hours: { type: DataTypes.STRING(150) },
 whatsapp_number: { type: DataTypes.STRING(30) },

 // ── Social Media ─────────────────────────────────────────
 social_facebook: { type: DataTypes.STRING(255) },
 social_instagram: { type: DataTypes.STRING(255) },
 social_twitter: { type: DataTypes.STRING(255) },
 social_whatsapp: { type: DataTypes.STRING(255) },

 // ── About Page ────────────────────────────────────────────
 about_hero_title: { type: DataTypes.STRING(255) },
 about_hero_subtitle: { type: DataTypes.TEXT },
 about_story: { type: DataTypes.TEXT },

 // JSON arrays stored as TEXT
 about_stats: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('about_stats') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('about_stats', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 about_values: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('about_values') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('about_values', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 about_team: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('about_team') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('about_team', typeof v === 'string' ? v : JSON.stringify(v)); },
 },

 // ── Home Page Section Visibility ─────────────────────────
 home_show_featured: { type: DataTypes.BOOLEAN },
 home_show_categories: { type: DataTypes.BOOLEAN },
 home_show_process_steps: { type: DataTypes.BOOLEAN },
 home_show_testimonials: { type: DataTypes.BOOLEAN },
 home_show_category_sections: { type: DataTypes.BOOLEAN },

 // ── Footer ────────────────────────────────────────────────
 footer_tagline: { type: DataTypes.TEXT },
 footer_quick_links: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('footer_quick_links') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('footer_quick_links', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 footer_company_links: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('footer_company_links') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('footer_company_links', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
 footer_support_links: {
  type: DataTypes.TEXT,
  get() { try { return JSON.parse(this.getDataValue('footer_support_links') || '[]'); } catch { return []; } },
  set(v) { this.setDataValue('footer_support_links', typeof v === 'string' ? v : JSON.stringify(v)); },
 },
}, {
 tableName: 'site_settings',
 charset: 'utf8mb4',
 collate: 'utf8mb4_unicode_ci',
});

// Default values (applied in code, not DB-level to avoid MySQL charset issues)
const DEFAULTS = {
 site_name: 'ComboBasket',
 site_tagline: 'বাংলাদেশের সেরা কম্বো ও গিফট শপ',
 site_description: 'স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার ও প্রিমিয়াম গিফট সেট — সবচেয়ে কম দামে, ফ্রি ডেলিভারিতে।',
 contact_address: '১২৩ মেইন স্ট্রিট, ঢাকা, বাংলাদেশ',
 contact_phone: '+৮৮০ ১২৩৪-৫৬৭৮৯০',
 contact_email: 'support@combobasket.com',
 contact_hours: 'শনি–বৃহস্পতি: সকাল ১০টা – রাত ৮টা',
 whatsapp_number: '8801234567890',
 social_facebook: '#',
 social_instagram: '#',
 social_twitter: '#',
 social_whatsapp: '#',
 about_hero_title: 'আমাদের সম্পর্কে',
 about_hero_subtitle: 'আমরা প্রিমিয়াম মানের পণ্য সবার কাছে পৌঁছে দেওয়ার লক্ষ্যে কাজ করে যাচ্ছি।',
 about_story: 'ComboBasket শুরু হয়েছিল একটি সহজ ধারণা থেকে — প্রিমিয়াম মানের পণ্য সবার নাগালে পৌঁছে দেওয়া। আমরা আমাদের প্রতিটি পণ্য সতর্কতার সাথে বাছাই করি, মান, ডিজাইন এবং মূল্যের ক্ষেত্রে আমাদের উচ্চ মানদণ্ড নিশ্চিত করে।',
 about_stats: JSON.stringify([
  { value: '১০হা+', label: 'সন্তুষ্ট গ্রাহক' },
  { value: '৫হা+', label: 'পণ্য বিক্রয়' },
  { value: '৫০+', label: 'ক্যাটাগরি' },
  { value: '৯৯%', label: 'সন্তুষ্টির হার' },
 ]),
 about_values: JSON.stringify([
  { icon: 'Gem', title: 'মানের প্রতি অঙ্গীকার', desc: 'আমরা শুধুমাত্র সেরা মানের পণ্য সংগ্রহ করি।', bg: 'bg-pink-50', iconColor: 'text-pink-600' },
  { icon: 'Rocket', title: 'দ্রুত ডেলিভারি', desc: 'আপনার দরজায় দ্রুত ও নির্ভরযোগ্য ডেলিভারি।', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: 'Heart', title: 'গ্রাহক সেবা', desc: 'যেকোনো প্রশ্নে সর্বক্ষণ সহায়তার জন্য প্রস্তুত।', bg: 'bg-red-50', iconColor: 'text-red-600' },
  { icon: 'Lock', title: 'নিরাপদ কেনাকাটা', desc: 'আপনার তথ্য ও পেমেন্ট সর্বদা সুরক্ষিত।', bg: 'bg-purple-50', iconColor: 'text-purple-600' },
 ]),
 about_team: JSON.stringify([
  { name: 'Sarah Ahmed', role: 'প্রধান নির্বাহী ও প্রতিষ্ঠাতা', icon: 'Briefcase' },
  { name: 'Rifat Khan', role: 'প্রযুক্তি প্রধান', icon: 'Code' },
  { name: 'Nadia Islam', role: 'ডিজাইন প্রধান', icon: 'Palette' },
 ]),
 home_show_featured: true,
 home_show_categories: true,
 home_show_process_steps: true,
 home_show_testimonials: true,
 home_show_category_sections: true,
 footer_tagline: 'বাংলাদেশের সেরা কম্বো ও গিফট শপ। স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার ও প্রিমিয়াম গিফট সেট — সবচেয়ে কম দামে, ফ্রি ডেলিভারিতে।',
 footer_quick_links: JSON.stringify([
  { href: '/products', label: 'সকল পণ্য' },
  { href: '/products?category=electronics', label: 'ইলেকট্রনিক্স' },
  { href: '/products?category=fashion', label: 'ফ্যাশন' },
  { href: '/products?category=accessories', label: 'এক্সেসরিজ' },
 ]),
 footer_company_links: JSON.stringify([
  { href: '/about', label: 'আমাদের সম্পর্কে' },
  { href: '/contact', label: 'যোগাযোগ' },
  { href: '#', label: 'ব্লগ' },
  { href: '#', label: 'ক্যারিয়ার' },
 ]),
 footer_support_links: JSON.stringify([
  { href: '/contact', label: 'হেল্প সেন্টার' },
  { href: '/faq', label: 'সাধারণ জিজ্ঞাসা' },
  { href: '/refund', label: 'রিটার্ন ও রিফান্ড' },
  { href: '/privacy', label: 'গোপনীয়তা নীতি' },
  { href: '/cookies', label: 'কুকি নীতি' },
 ]),
};

// Singleton helper — always return the first (and only) row
SiteSettings.getSettings = async function () {
 let s = await this.findOne();
 if (!s) {
  // Create with all defaults
  s = await this.create(DEFAULTS);
 }
 return s;
};

module.exports = SiteSettings;
