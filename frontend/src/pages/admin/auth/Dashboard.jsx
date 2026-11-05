import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function Dashboard() {
  const { user } = useAdminAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      <p>{user?.name}</p>
      <p>{user?.email}</p>
      <p>{user?.role?.name}</p>
    </div>
  );
}