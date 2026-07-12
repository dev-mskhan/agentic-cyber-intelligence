import { Annotation } from "@langchain/langgraph";
import type { ITechnologyInventory } from "../types/technologyInventory.types.js";
import type { IOrganization } from "../types/organization.types.js";
import type {
  ThreatOutput,
  VulnerabilityOutput,
  MitigationOutput,
  ReportOutput,
} from "./schemas.js";

export const GraphState = Annotation.Root({
  runId: Annotation<string>(),
  organizationId: Annotation<string>(),
  organization: Annotation<IOrganization>(),
  technologyInventory: Annotation<ITechnologyInventory[]>(),

  threats: Annotation<ThreatOutput["threats"]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  vulnerabilities: Annotation<VulnerabilityOutput["vulnerabilities"]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  mitigations: Annotation<MitigationOutput["mitigations"]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  report: Annotation<ReportOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  errors: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

export type GraphStateType = typeof GraphState.State;
