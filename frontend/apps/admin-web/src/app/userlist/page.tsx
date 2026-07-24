import CustomerListPage from "@/components/CustomerListPage";

export default function UserListPage() {
  return (
    <CustomerListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
