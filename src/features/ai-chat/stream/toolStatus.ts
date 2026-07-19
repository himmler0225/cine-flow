/** Shared between the server-side stream proxy and the client-side Tool UI. */
export const TOOL_STATUS_INPUT_KEY = "_status";

export function isStatusOnlyInput(input: unknown): input is { _status: string } {
  return (
    typeof input === "object" &&
    input !== null &&
    TOOL_STATUS_INPUT_KEY in input &&
    typeof (input as { _status: unknown })._status === "string" &&
    Object.keys(input).length === 1
  );
}

export function isCompletedOnlyOutput(output: unknown): boolean {
  return (
    typeof output === "object" &&
    output !== null &&
    "status" in output &&
    (output as { status: unknown }).status === "completed" &&
    Object.keys(output).length === 1
  );
}

export function toolStatusDetail(input: unknown): string | null {
  return isStatusOnlyInput(input) ? input._status : null;
}
