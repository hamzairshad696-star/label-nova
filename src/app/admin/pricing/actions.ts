"use server";

import { runAction, type ActionResult } from "@/server/actions/run";
import { createCarrier, createRule, createService, setRuleActive, setServiceActive, updateRule } from "@/server/services/pricing";

const PATHS = ["/admin/pricing"];

export async function createCarrierAction(input: Record<string, string>): Promise<ActionResult> {
  return runAction(async (actor) => (await createCarrier(actor, input as never)).id, PATHS);
}
export async function createServiceAction(input: Record<string, string>): Promise<ActionResult> {
  return runAction(async (actor) => (await createService(actor, input as never)).id, PATHS);
}
export async function setServiceActiveAction(serviceId: string, active: boolean): Promise<ActionResult> {
  return runAction((actor) => setServiceActive(actor, serviceId, active), PATHS);
}
export async function createRuleAction(input: Record<string, string>): Promise<ActionResult> {
  return runAction(async (actor) => (await createRule(actor, input as never)).id, PATHS);
}
export async function updateRuleAction(ruleId: string, input: Record<string, string>): Promise<ActionResult> {
  return runAction(async (actor) => (await updateRule(actor, ruleId, input as never)).id, PATHS);
}
export async function setRuleActiveAction(ruleId: string, active: boolean): Promise<ActionResult> {
  return runAction((actor) => setRuleActive(actor, ruleId, active), PATHS);
}
