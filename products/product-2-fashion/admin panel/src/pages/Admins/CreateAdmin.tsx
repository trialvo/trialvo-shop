import CreateAdminPage from "@/components/admins/create-admin/CreateAdminPage";
import PageMeta from "@/components/common/PageMeta";

export default function CreateAdmin() {
  return (
    <>
      <PageMeta
        title="Create Admin"
        description="Create new admin account with role, password and profile"
      />
      <CreateAdminPage />
    </>
  );
}
