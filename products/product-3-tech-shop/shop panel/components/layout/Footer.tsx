import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

// Brand icons: inline SVGs — lucide-react v1 removed trademarked brand icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Zm5.4-8.45a1.17 1.17 0 1 1-2.34 0 1.17 1.17 0 0 1 2.34 0ZM12 2.2c2.7 0 3.02.01 4.08.06 2.61.12 3.86 1.37 3.98 3.98.05 1.06.06 1.38.06 4.08s-.01 3.02-.06 4.08c-.12 2.61-1.37 3.86-3.98 3.98-1.06.05-1.38.06-4.08.06s-3.02-.01-4.08-.06c-2.61-.12-3.86-1.37-3.98-3.98C2.21 13.34 2.2 13.02 2.2 10.32s.01-3.02.06-4.08C2.38 3.63 3.63 2.38 6.24 2.26 7.3 2.21 7.62 2.2 10.32 2.2H12Zm0-1.7c-2.75 0-3.1.01-4.18.06C4.7.69 2.69 2.7 2.56 5.7 2.51 6.78 2.5 7.13 2.5 9.88s.01 3.1.06 4.18c.13 3 2.14 5.01 5.14 5.14 1.08.05 1.43.06 4.18.06s3.1-.01 4.18-.06c3-.13 5.01-2.14 5.14-5.14.05-1.08.06-1.43.06-4.18s-.01-3.1-.06-4.18C21.31 2.7 19.3.69 16.3.56 15.22.51 14.87.5 12.12.5H12Z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.75 15.57V8.43L15.84 12l-6.09 3.57Z" />
  </svg>
);

const Footer = () => (
  <footer className="bg-foreground text-background/80">
    <div className="container py-10 md:py-16">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="font-heading text-xl font-bold text-background">
            ShopLink<span className="text-accent">BD</span>
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-background/60">
            Bangladesh&apos;s trusted destination for premium gadgets, tech accessories, and smart devices. 100% authentic products with warranty.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Link href="/" className="h-8 w-8 rounded-sm bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Facebook"><FacebookIcon className="h-3.5 w-3.5" /></Link>
            <Link href="/" className="h-8 w-8 rounded-sm bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Instagram"><InstagramIcon className="h-3.5 w-3.5" /></Link>
            <Link href="/" className="h-8 w-8 rounded-sm bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="YouTube"><YoutubeIcon className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-background mb-3 text-sm">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/shop" className="hover:text-accent transition-colors">Shop All</Link></li>
            <li><Link href="/shop?badge=new" className="hover:text-accent transition-colors">New Arrivals</Link></li>
            <li><Link href="/shop?badge=bestseller" className="hover:text-accent transition-colors">Best Sellers</Link></li>
            <li><Link href="/shop?badge=sale" className="hover:text-accent transition-colors">Deals & Offers</Link></li>
            <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-background mb-3 text-sm">Customer Service</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-accent transition-colors">FAQ</Link></li>
            <li><Link href="/order-tracking" className="hover:text-accent transition-colors">Track Order</Link></li>
            <li><Link href="/policies/return" className="hover:text-accent transition-colors">Return Policy</Link></li>
            <li><Link href="/policies/warranty" className="hover:text-accent transition-colors">Warranty Policy</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-background mb-3 text-sm">Contact Info</h4>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" /> Banani, Dhaka 1213, Bangladesh</li>
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-accent" /> +880 1XXX-XXXXXX</li>
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-accent" /> support@shoplinkbd.com</li>
          </ul>
          <div className="mt-4">
            <p className="text-[10px] text-background/50 mb-1.5">We Accept</p>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="px-2 py-1 bg-background/10 rounded-sm">bKash</span>
              <span className="px-2 py-1 bg-background/10 rounded-sm">Nagad</span>
              <span className="px-2 py-1 bg-background/10 rounded-sm">COD</span>
              <span className="px-2 py-1 bg-background/10 rounded-sm">Card</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="border-t border-background/10">
      <div className="container py-3 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] text-background/40">
        <p>© 2026 ShopLinkBD. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/policies/terms" className="hover:text-background/70 transition-colors">Terms</Link>
          <Link href="/policies/privacy" className="hover:text-background/70 transition-colors">Privacy</Link>
          <Link href="/policies/refund" className="hover:text-background/70 transition-colors">Refund</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
