/**
 * HTTPS marketing screenshots for Trialvo catalog cards.
 * 16 unique Unsplash images — 4 per product, no cross-product reuse.
 * Admin uploads can replace these later via images.shop.
 */
const U = 'https://images.unsplash.com';

const ADMIN_DASHBOARD = `${U}/photo-1460925895917-afdab827c52f?w=1200&h=750&fit=crop&q=85`;
const ADMIN_ORDERS = `${U}/photo-1551288049-bebda4e38f71?w=1200&h=750&fit=crop&q=85`;

const q = (id, w = 1200, h = 750) =>
  `${U}/${id}?w=${w}&h=${h}&fit=crop&q=85`;

module.exports = {
  lifestyle: {
    thumbnail: q('photo-1441986300917-64674bd600d8', 800, 500),
    shop: [
      q('photo-1441986300917-64674bd600d8'),
      q('photo-1556740738-b6a63e27c4df'),
      q('photo-1472851294608-062f824d29cc'),
      q('photo-1556228578-0d85b1a4d571'),
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
  fashion: {
    thumbnail: q('photo-1515886657613-9f3515b0c78f', 800, 500),
    shop: [
      q('photo-1515886657613-9f3515b0c78f'),
      q('photo-1483985988355-763728e1935b'),
      q('photo-1490481651871-ab68de25d43d'),
      q('photo-1469334031218-e382a71b716b'),
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
  tech: {
    thumbnail: q('photo-1498049794561-7780e7231661', 800, 500),
    shop: [
      q('photo-1498049794561-7780e7231661'),
      q('photo-1505740420928-5e560c06d30e'),
      q('photo-1519389950473-47ba0277781c'),
      q('photo-1525547719571-a2d4ac8945e2'),
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
  combobasket: {
    // Gift / combo — all URLs verified 200 (replaced broken 404s)
    thumbnail: q('photo-1549465220-1a8b9238cd48', 800, 500),
    shop: [
      q('photo-1549465220-1a8b9238cd48'), // wrapped gifts
      q('photo-1544776193-352d25ca82cd'), // gift box
      q('photo-1607082348824-0a96f2a4b9da'), // shopping bags
      q('photo-1481391319762-47dff72954d9'), // gift wrap / presents
    ],
    admin: [ADMIN_DASHBOARD, ADMIN_ORDERS],
  },
};
