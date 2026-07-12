import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState, type GraphStateType } from "./state.js";
import { threatIntelligenceAnalystNode } from "./nodes/threatIntelligenceAnalyst.js";
import { vulnerabilityResearcherNode } from "./nodes/vulnerabilityResearcher.js";
import { incidentResponseAdvisorNode } from "./nodes/incidentResponseAdvisor.js";
import { reportWriterNode } from "./nodes/reportWriter.js";

const graph = new StateGraph(GraphState)
  .addNode("threat_intelligence", threatIntelligenceAnalystNode)
  .addNode("vulnerability_research", vulnerabilityResearcherNode)
  .addNode("incident_response", incidentResponseAdvisorNode)
  .addNode("report_writing", reportWriterNode)
  .addEdge(START, "threat_intelligence")
  .addEdge("threat_intelligence", "vulnerability_research")
  .addEdge("vulnerability_research", "incident_response")
  .addEdge("incident_response", "report_writing")
  .addEdge("report_writing", END);

export const cybersecurityAgentGraph = graph.compile();

export async function runAgentPipeline(initialState: Pick<GraphStateType, "runId" | "organizationId" | "organization" | "technologyInventory">) {
  return cybersecurityAgentGraph.invoke(initialState);
}
