"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/context/LocaleContext";

type ChatMessage = { from: "customer" | "support"; text: string };

export function CustomerService() {
  const { language, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "support", text: language === "my" ? "မင်္ဂလာပါ။ သင့်ပြဿနာကို ရေးပို့ပါ။ အဖွဲ့က တောင်းဆိုချက်ကို စစ်ဆေးဖြေရှင်းပေးပါမည်။" : "Hello. Send us your issue and our team will review your support ticket." },
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json() as { error?: string; ticket?: { id: string } };
      const ticket = result.ticket;
      if (!response.ok || !ticket) throw new Error(result.error ?? "Unable to submit support request.");
      setMessages((current) => [
        ...current,
        { from: "customer", text: message },
        { from: "support", text: language === "my"
          ? `သင့်တောင်းဆိုချက် ${ticket.id} ကို လက်ခံရရှိပါသည်။ အဖွဲ့က စစ်ဆေးပေးပါမည်။`
          : `Support ticket ${ticket.id} has been received. Our team will review it.` },
      ]);
      setInput("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit support request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section aria-label={t("support.chatLabel")} className="mb-3 flex h-[min(540px,75vh)] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <header className="flex items-center justify-between bg-forest px-5 py-4 text-white">
            <div><h2 className="font-semibold">{t("support.title")}</h2><p className="mt-1 text-xs text-white/75">{language === "my" ? "သင့်တောင်းဆိုချက်ကို တိုက်ရိုက်ပေးပို့ပါ" : "Messages are sent to our support team"}</p></div>
            <button aria-label={t("support.close")} onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X size={18} /></button>
          </header>
          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${index}-${message.from}`} className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-5 ${message.from === "customer" ? "ml-auto bg-forest text-white" : "bg-sage text-ink"}`}>{message.text}</div>
            ))}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
          </div>
          <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-2 border-t border-black/10 p-3">
            <input aria-label={t("support.message")} value={input} maxLength={1000} onChange={(event) => setInput(event.target.value)} placeholder={t("support.ask")} className="form-input min-w-0 flex-1 rounded-full border-black/15 text-sm" />
            <button disabled={submitting || !input.trim()} aria-label={t("support.send")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white hover:bg-ink disabled:opacity-50"><Send size={16} /></button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? t("support.closeDescription") : t("support.open")} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg transition hover:bg-ink">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
