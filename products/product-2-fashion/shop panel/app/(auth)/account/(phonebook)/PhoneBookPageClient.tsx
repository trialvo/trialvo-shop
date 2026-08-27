"use client";

import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import PhoneListPanel from "@/components/account/phonebook/PhoneListPanel";
import PhoneSelectableCardSkeleton from "@/components/account/phonebook/PhoneSelectableCardSkeleton";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePhone } from "@/hooks/usePhone";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import React from "react";

function PhoneBookSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
        <Skeleton className="h-7 w-40" />
      </div>

      <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
        <div className="h-auto justify-center w-full border-b border-[#D9D9D9] pb-3">
          <Skeleton className="h-5 w-32" />
        </div>

        <div className="space-y-3 pt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <PhoneSelectableCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

const PhoneBookPageClient: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { phones, phonesLoading, deletePhone, setDefaultPhone, verifyPhone, verifyPhoneOTP } =
    usePhone();

  const [selected, setSelected] = React.useState<string>("");

  React.useEffect(() => {
    if (phonesLoading) return;
    if (!phones.length) return;

    setSelected((prev) => {
      if (prev && phones.some((a) => String(a.id) === prev)) return prev;

      const def = phones.find((a) => a.is_default === 1);
      if (def?.id != null) return String(def.id);

      const first = phones[0];
      return first?.id == null ? "" : String(first.id);
    });
  }, [phones, phonesLoading]);

  const handleDelete = (id: string | number) => {
    const idStr = String(id);

    openConfirmDelete(
      dispatch,
      async () => {
        await deletePhone(Number(idStr));
        router.refresh();

        if (selected === idStr) setSelected("");
      },
      {
        title: "Are you sure you want delete this phone?",
        description: "This action cannot be undone.",
        cancelText: "Not Now",
        confirmText: "Yes, Delete",
      },
    );
  };

  const handleVerify = async (id: string | number, Phone?: string) => {
    setSelected(String(id));
    try {
      const res = await verifyPhone(id);

      openVerifyIdentity(
        dispatch,
        {
          onVerify: async (code) => {
            await verifyPhoneOTP(id, code);
          },
          onResend: async () => {
            await verifyPhone(id);
          },
        },
        {
          maskedTarget: Phone,
          length: 6,
          signInHref: "/sign-in",
        },
      );

      return res;
    } catch {
      // Error handled in mutation
    }
  };

  const handleMakeDefault = async (id: string | number) => {
    setSelected(String(id));
    try {
      const res = await setDefaultPhone(id);
      return res;
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <section className="container mx-auto px-1.5 pb-6 pt-2 sm:px-0 sm:pt-0">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Account", href: "/account" },
          { label: "PhoneBook" },
        ]}
      />

      <div className="sm:mb-17.5">
        <AccountLayout sidebar={<AccountSidebar activeKey="phone-book" />}>
          {phonesLoading ? (
            <PhoneBookSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <h1 className="text-2xl font-bold">PhoneBook</h1>
              </div>

              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <Tabs defaultValue="phones" className="w-full">
                  <TabsList
                    className="
                      h-auto w-full justify-start gap-0
                      rounded-none bg-transparent p-0
                      border-b border-[#D9D9D9]
                    "
                  >
                    <TabsTrigger
                      value="phones"
                      className="
                        rounded-none px-0 pb-3 pt-2 text-sm font-semibold
                        data-[state=active]:border-b-2 data-[state=active]:border-black
                        data-[state=active]:text-black
                        text-black/70
                      "
                    >
                      Phone Numbers
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="phones" className="m-0 space-y-6 pt-5">
                    <PhoneListPanel
                      items={phones}
                      value={selected}
                      onChange={setSelected}
                      onVerify={handleVerify}
                      onDelete={handleDelete}
                      onMakeDefault={handleMakeDefault}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </AccountLayout>
      </div>
    </section>
  );
};

export default PhoneBookPageClient;
