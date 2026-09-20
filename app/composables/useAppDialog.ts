export type AppDialogKind = "alert" | "confirm" | "prompt";

export interface AppDialogRequest {
  id: number;
  kind: AppDialogKind;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  value: string;
  placeholder: string;
  tone: "default" | "danger";
}

type Resolver = (value: boolean | string | null) => void;

let nextId = 1;
const resolvers = new Map<number, Resolver>();

export const useAppDialog = () => {
  const request = useState<AppDialogRequest | null>("app-dialog-request", () => null);

  const open = (options: Omit<AppDialogRequest, "id">) =>
    new Promise<boolean | string | null>((resolve) => {
      const id = nextId++;
      resolvers.set(id, resolve);
      request.value = { id, ...options };
    });

  const alert = async (message: string, title = "Notice") => {
    await open({ kind: "alert", title, message, confirmText: "OK", cancelText: "Cancel", value: "", placeholder: "", tone: "default" });
  };

  const confirm = async (
    message: string,
    options: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean } = {},
  ) => Boolean(await open({
    kind: "confirm",
    title: options.title || "Please confirm",
    message,
    confirmText: options.confirmText || "Confirm",
    cancelText: options.cancelText || "Cancel",
    value: "",
    placeholder: "",
    tone: options.danger ? "danger" : "default",
  }));

  const prompt = async (
    message: string,
    defaultValue = "",
    options: { title?: string; confirmText?: string; cancelText?: string; placeholder?: string } = {},
  ) => {
    const result = await open({
      kind: "prompt",
      title: options.title || "Enter details",
      message,
      confirmText: options.confirmText || "Continue",
      cancelText: options.cancelText || "Cancel",
      value: defaultValue,
      placeholder: options.placeholder || "",
      tone: "default",
    });
    return typeof result === "string" ? result : null;
  };

  const resolve = (value: boolean | string | null) => {
    const current = request.value;
    if (!current) return;
    const resolver = resolvers.get(current.id);
    resolvers.delete(current.id);
    request.value = null;
    resolver?.(value);
  };

  return { request, alert, confirm, prompt, resolve };
};
