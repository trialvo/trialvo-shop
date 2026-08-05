import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const ContactHeader: React.FC = () => {
  return (
    <Card className="rounded-none border-0 shadow-[0px_0px_12px_rgba(0,0,0,0.12)] p-0">
      <CardContent className="py-3 px-4">
        <h1 className="text-[28px] font-semibold text-black">Get in Touch</h1>
        <p className="mt-1 text-sm font-normal">
          We&apos;d love to hear from you! Whether you have questions about our products, need help with an order, or just want to say hello.
        </p>
      </CardContent>
    </Card>
  );
};

export default ContactHeader;
