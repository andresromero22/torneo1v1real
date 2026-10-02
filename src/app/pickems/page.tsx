import { getBracket } from "@/lib/bracket";
import { getTournamentSettings } from "@/lib/db";
import { PLAYERS } from "@/lib/players-data";
import PickemsClient from "./PickemsClient";

export const dynamic = "force-dynamic";

export default async function PickemsPage() {
  const [matches, settings] = await Promise.all([getBracket(), getTournamentSettings()]);
  const octavos = matches.filter((m) => m.round === "octavos");

  return (
    <PickemsClient
      players={PLAYERS}
      octavos={octavos}
      locked={settings.pickemsLocked}
      bracketExists={matches.length > 0}
    />
  );
}
