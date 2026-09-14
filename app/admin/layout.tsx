import AdminSidebar from "./admin-sidebar";

export const metadata = {
  manifest: "/admin-manifest.json",
  themeColor: "#000000",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSidebar />
      {children}
    </>
  );
}
