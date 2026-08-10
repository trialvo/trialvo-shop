/**
 * HTTPS marketing screenshots — URLs verified (Unsplash imgix 200).
 * Demo shops use their own product APIs; these are marketplace preview shots.
 */
const U = 'https://images.unsplash.com';

const ADMIN_DASHBOARD = `${U}/photo-1460925895917-afdab827c52f?w=1200&h=750&fit=crop&q=85`;
const ADMIN_ORDERS = `${U}/photo-1551288049-bebda4e38f71?w=1200&h=750&fit=crop&q=85`;

module.exports = {
  lifestyle: {
    thumbnail: `${U}/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop&q=85`,
    shop: [
      `${U}/photo-1441986300917-64674bd600d8?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1556740738-b6a63e27c4df?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1523275335684-37898b6baf30?w=1200&h=750&fit=crop&q=85`,
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
  fashion: {
    thumbnail: `${U}/photo-1515886657613-9f3515b0c78f?w=800&h=500&fit=crop&q=85`,
    shop: [
      `${U}/photo-1515886657613-9f3515b0c78f?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1553062407-98eeb64c6a62?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1441986300917-64674bd600d8?w=1200&h=750&fit=crop&q=85`,
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
  tech: {
    thumbnail: `${U}/photo-1498049794561-7780e7231661?w=800&h=500&fit=crop&q=85`,
    shop: [
      `${U}/photo-1498049794561-7780e7231661?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1505740420928-5e560c06d30e?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1523275335684-37898b6baf30?w=1200&h=750&fit=crop&q=85`,
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
  combobasket: {
    thumbnail: `${U}/photo-1549465220-1a8b9238cd48?w=800&h=500&fit=crop&q=85`,
    shop: [
      `${U}/photo-1549465220-1a8b9238cd48?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1513885535751-8b47f1f3e2c0?w=1200&h=750&fit=crop&q=85`,
      `${U}/photo-1607082348824-0a96f2a4b9da?w=1200&h=750&fit=crop&q=85`,
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
};
