import { cookies } from "next/headers";
import { COOKIE_NAME, getSessionToken } from "@/lib/auth";
import { getBracket } from "@/lib/bracket";
import { getTournamentSettings } from "@/lib/db";
import { deriveBonusStats } from "@/lib/scoring";
import { PLAYERS } from "@/lib/players-data";
import LoginForm from "./LoginForm";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const expected = await getSessionToken();

  if (token !== expected) {
    return <LoginForm />;
  }

  const [matches, settings] = await Promise.all([getBracket(), getTournamentSettings()]);

  return (
    <AdminDashboard
      matches={matches}
      players={PLAYERS}
      locked={settings.pickemsLocked}
      bonusStats={deriveBonusStats(matches)}
    />
  );
}
