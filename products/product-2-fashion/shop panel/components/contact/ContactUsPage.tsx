"use client";

import React from "react";
import Breadcrumbs from "../breadcrumb/Breadcrumbs";
import ContactFormCard from "./ContactFormCard";
import ContactHeader from "./ContactHeader";
import ContactInfoCard from "./ContactInfoCard";
import FindUsCard from "./FindUsCard";
import FollowUsCard from "./FollowUsCard";
import { CONTACT_INFO, CONTACT_MAP, CONTACT_SOCIALS } from "./contact.data";

const ContactUsPage: React.FC = () => {
    return (
        <div className="container mx-auto max-[501px]:pt-11.5 max-[501px]:px-2 pb-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />

            <div className="space-y-2 sm:space-y-4">
                <ContactHeader />

                <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
                    <ContactFormCard />
                    <ContactInfoCard info={CONTACT_INFO} />
                </div>

                <FollowUsCard socials={CONTACT_SOCIALS} />

                <FindUsCard title={CONTACT_MAP.title} subtitle={CONTACT_MAP.subtitle} mapSrc={CONTACT_MAP.mapSrc} />
            </div>
        </div>
    );
};

export default ContactUsPage;
