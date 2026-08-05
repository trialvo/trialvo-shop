import { Metadata } from 'next';
import Layout from '@/components/layout/Layout';
import HeroBanner from '@/components/home/HeroBanner';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import FlashSale from '@/components/home/FlashSale';
import HotDeals from '@/components/home/HotDeals';
import ProductSection from '@/components/home/ProductSection';
import OfferBanners from '@/components/home/OfferBanners';
import BrandShowcase from '@/components/home/BrandShowcase';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import Testimonials from '@/components/home/Testimonials';
import Newsletter from '@/components/home/Newsletter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ShopLinkBD | Best Tech Shop in Bangladesh',
  description: 'Shop for premium tech accessories, gadgets, and electronics at ShopLinkBD. 100% authentic products with official warranty and fast delivery across Bangladesh.',
  openGraph: {
    title: 'ShopLinkBD | Best Tech Shop in Bangladesh',
    description: 'Shop for premium tech accessories, gadgets, and electronics at ShopLinkBD.',
  },
};

export default function HomePage() {

  return (
    <Layout>
      <div className="container mt-6">
        <HeroBanner />
      </div>
      <FeaturedCategories />
      <FlashSale />
      <HotDeals />
      <ProductSection title="Trending Gadgets" subtitle="Most popular products this week" badge="hot" viewAllLink="/shop?badge=hot" />
      <OfferBanners />
      <BrandShowcase />
      <ProductSection title="Best Sellers" subtitle="Our top-selling products" badge="bestseller" viewAllLink="/shop?badge=bestseller" />
      <ProductSection title="New Arrivals" subtitle="Just landed — check out the latest" badge="new" viewAllLink="/shop?badge=new" />
      <WhyChooseUs />
      <Testimonials />
      <Newsletter />
    </Layout>
  );
}
