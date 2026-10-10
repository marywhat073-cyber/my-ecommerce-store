"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/context/LocaleContext";

type ChatMessage = { from: "customer" | "support"; text?: string; translationKey?: string };

const quickQuestions = [
  { key: "support.orderQuestion", answer: "support.orderReply" },
  { key: "support.paymentQuestion", answer: "support.paymentReply" },
  { key: "support.deliveryQuestion", answer: "support.deliveryReply" },
  { key: "support.storeQuestion", answer: "support.storeReply" },
];

function getReply(question: string) {
  const query = question.toLowerCase();
  if (query.includes("order") || query.includes("status") || query.includes("မှာယူ")) {
    return "support.orderReply";
  }
  if (query.includes("payment") || query.includes("pay") || query.includes("wallet") || query.includes("ငွေပေး") || query.includes("ပိုက်ဆံ")) {
    return "support.paymentReply";
  }
  if (query.includes("deliver") || query.includes("location") || query.includes("address") || query.includes("ပို့ဆောင်") || query.includes("လိပ်စာ")) {
    return "support.deliveryReply";
  }
  if (query.includes("store") || query.includes("seller") || query.includes("product") || query.includes("ဆိုင်") || query.includes("ရောင်းချ")) {
    return "support.storeReply";
  }
  return "support.defaultReply";
}

export function CustomerService() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "support", translationKey: "support.greeting" },
  ]);

  function sendMessage(text: string, questionKey?: string, answerKey?: string) {
    const question = text.trim() || (questionKey ? t(questionKey) : "");
    if (!question) return;
    setMessages((current) => [
      ...current,
      questionKey
        ? { from: "customer", translationKey: questionKey }
        : { from: "customer", text: question },
      { from: "support", translationKey: answerKey ?? getReply(question) },
    ]);
    setInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section aria-label={t("support.chatLabel")} className="mb-3 flex h-[min(540px,75vh)] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <header className="flex items-center justify-between bg-forest px-5 py-4 text-white">
            <div><h2 className="font-semibold">{t("support.title")}</h2><p className="mt-1 text-xs text-white/75">{t("support.demo")}</p></div>
            <button aria-label={t("support.close")} onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X size={18} /></button>
          </header>
          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${index}-${message.from}`} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-5 ${message.from === "customer" ? "ml-auto bg-forest text-white" : "bg-sage text-ink"}`}>
                {message.translationKey ? t(message.translationKey) : message.text}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickQuestions.map((question) => (
                <button key={question.key} onClick={() => sendMessage("", question.key, question.answer)} className="rounded-full border border-forest/20 px-3 py-1.5 text-left text-xs text-forest hover:bg-sage">{t(question.key)}</button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3">
            <input aria-label={t("support.message")} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t("support.ask")} className="form-input min-w-0 flex-1 rounded-full border-black/15 text-sm" />
            <button aria-label={t("support.send")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white hover:bg-ink"><Send size={16} /></button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? t("support.closeDescription") : t("support.open")} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg transition hover:bg-ink">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
