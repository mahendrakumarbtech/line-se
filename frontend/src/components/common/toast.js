import toast from "react-hot-toast";

export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  warning: (msg) => toast(msg, { icon: "⚠️" }),
  info: (msg) => toast(msg, { icon: "ℹ️" }),
};