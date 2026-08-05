"use client";
// components/account/contact/MyContactMessagesPageClient.tsx — V2-041

import React from "react";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import MyContactMessagesCard from "./MyContactMessagesCard";
import { Mail } from "lucide-react";

type Props = {
  highlightMessageId?: number | null;
};

const MyContactMessagesPageClient: React.FC<Props> = ({ highlightMessageId }) => {
  return (
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
      <Breadcrumbs
        items={[
          { label: "Home",    href: "/" },
          { label: "Account", href: "/account" },
          { label: "My Messages" },
        ]}
      />

      <div className="sm:mb-17.5">
        <AccountLayout sidebar={<AccountSidebar activeKey="my-contact" />}>
          <div className="space-y-3">
            {/* Page title bar */}
            <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-black" />
                <h1 className="text-xl font-bold text-black">My Messages</h1>
              </div>
            </div>

            {/* Messages list */}
            <MyContactMessagesCard highlightMessageId={highlightMessageId} />
          </div>
        </AccountLayout>
      </div>
    </section>
  );
};

export default MyContactMessagesPageClient;
