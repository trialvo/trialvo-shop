import PageMeta from "@/components/common/PageMeta";
import MyProfilePage from "@/components/my-profile/MyProfilePage";

export default function MyProfile() {
  return (
    <>
      <PageMeta title="My Profile" description="Manage profile information and password" />
      <MyProfilePage />
    </>
  );
}
