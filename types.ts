type Import = {
  dependency: string
  references?: Array<number>
} & (
  | { type: "default"; alias: string }
  | { type: "name"; name: string; alias?: string }
  | { type: "namespace"; alias: string }
)
export type AuditSchema = Record<string, Array<Import>>
