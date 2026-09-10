import { TerminalPage, EmptyData } from "../../(terminal)/page-view";
import { getPersistedDataset } from "../../../lib/reconstruct";
import { ReplayWorkbench } from "./workbench";
export const dynamic = "force-dynamic";
export default async function Replay({params}:{params:Promise<{datasetId:string}>}){const {datasetId}=await params;try{const dataset=await getPersistedDataset(datasetId);if(!dataset)return <TerminalPage title={`Replay ${datasetId}`} kicker="Deterministic clock"><EmptyData action="Build a verified dataset" href="/archive"/></TerminalPage>;return <ReplayWorkbench dataset={dataset as any}/>;}catch{return <TerminalPage title={`Replay ${datasetId}`} kicker="Deterministic clock"><section className="empty"><strong>Replay storage is unavailable.</strong><p>Configure PostgreSQL and apply migrations to inspect persisted source and derived replay data.</p></section></TerminalPage>}}
