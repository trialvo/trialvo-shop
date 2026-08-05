import AdminsListPage from "@/components/admins/admins-list/AdminsListPage";
import PageMeta from "@/components/common/PageMeta";

export default function AdminsList() {
  return (
    <>
      <PageMeta
        title="Admins List"
        description="Manage admins by roles, update access and control status"
      />
      <AdminsListPage />
    </>
  );
}
