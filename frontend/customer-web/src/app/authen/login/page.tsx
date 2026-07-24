import UnifiedLoginForm from "@/components/UnifiedLoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <UnifiedLoginForm
        customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
        adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      />
    </div>
  );
}
