import { describe, expect, it } from "vitest";
import { verifyDataset } from "../../../packages/replay/src";
describe("replay identity",()=>it("rejects events from a different market",()=>expect(verifyDataset({id:"d",source:"dreamdex",capturedAt:"",integrityHash:"",market:{marketId:"m",symbol:"s",question:"q",lifecycle:"trading",opensAt:"",locksAt:""},events:[{sequence:1,timestamp:1,marketId:"other",kind:"book"}]}).valid).toBe(false)));
