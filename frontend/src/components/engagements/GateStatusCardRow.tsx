import { GateStatusCard } from './GateStatusCard';
import type { GateDecision } from '@/lib/engagements.api';

const GATE_ORDER = ['A1', 'P2', 'P3', 'P4'] as const;
type GateName = typeof GATE_ORDER[number];

interface GateStatusCardRowProps {
  gate_decisions: GateDecision[];
}

function getDecisionForGate(gate: GateName, decisions: GateDecision[]): GateDecision | undefined {
  // gate_decisions from backend use gate_name field (e.g., 'A1', 'P2', etc.)
  return decisions.find((d) => d.gate_name === gate);
}

function isGateLocked(gate: GateName, decisions: GateDecision[]): boolean {
  // A gate is locked if the previous required gate is not approved
  const gateIndex = GATE_ORDER.indexOf(gate);
  if (gateIndex === 0) return false; // A1 is never locked
  const prevGate = GATE_ORDER[gateIndex - 1];
  const prevDecision = getDecisionForGate(prevGate, decisions);
  if (!prevDecision) return true;
  const d = prevDecision.decision?.toLowerCase();
  return d !== 'approved' && d !== 'approve';
}

export function GateStatusCardRow({ gate_decisions }: GateStatusCardRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {GATE_ORDER.map((gate) => {
        const decision = getDecisionForGate(gate, gate_decisions);
        const locked = isGateLocked(gate, gate_decisions);
        return (
          <GateStatusCard
            key={gate}
            gate={gate}
            decision={decision}
            locked={locked}
          />
        );
      })}
    </div>
  );
}
