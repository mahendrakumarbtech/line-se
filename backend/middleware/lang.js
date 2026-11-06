import { resolveLang, runWithLang } from "../utils/custom.js";

export default function langMiddleware(req, _res, next) {
  const raw = req.headers["x-lang"] || req.headers["accept-language"] || "en";
  req.lang = resolveLang(raw);
  runWithLang(req.lang, () => next());
}
