import {TerminalPage,EmptyData} from "../../(terminal)/page-view";
export default async function Run({params}:{params:Promise<{runId:string}>}){const {runId}=await params;return <TerminalPage title={`Run ${runId}`} kicker="Result detail"><EmptyData action="Back to runs" href="/runs"/></TerminalPage>}
