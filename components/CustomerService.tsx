"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";

type ChatMessage = { from: "customer" | "support"; text: string };

const quickQuestions = [
  "How do I check my order?",
  "What payment methods can I use?",
  "How does delivery work?",
  "I need help with my store",
];

function getReply(question: string) {
  const query = question.toLowerCase();
  if (query.includes("order") || query.includes("status")) {
    return "Your demo purchases appear in your account. If you are a seller, your store page shows orders containing your products and the delivery details provided by the buyer.";
  }
  if (query.includes("payment") || query.includes("pay") || query.includes("wallet")) {
    return "The demo wallet lists K Pay and Wave Pay options in MMK. Transactions here are simulations only; no money is sent or received.";
  }
  if (query.includes("deliver") || query.includes("location") || query.includes("address")) {
    return "Enter a detailed delivery address at checkout. You can also choose to share your device's GPS coordinates; the coordinates are shown with the order for its seller.";
  }
  if (query.includes("store") || query.includes("seller") || query.includes("product")) {
    return "Sign in or create an account, then enable Seller Account mode from your account page to list products in your own store.";
  }
  return "I can help with orders, payment methods, delivery information, or setting up your store. Choose one of the topics above to see an instant answer.";
}

export function CustomerService() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "support", text: "Hello! I’m Evergreen’s automated demo assistant. What can I help you with?" },
  ]);

  function sendMessage(text: string) {
    const question = text.trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { from: "customer", text: question },
      { from: "support", text: getReply(question) },
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
        <section aria-label="Customer service chat" className="mb-3 flex h-[min(540px,75vh)] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <header className="flex items-center justify-between bg-forest px-5 py-4 text-white">
            <div><h2 className="font-semibold">Customer service</h2><p className="mt-1 text-xs text-white/75">Automated demo assistant</p></div>
            <button aria-label="Close chat" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X size={18} /></button>
          </header>
          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${index}-${message.from}`} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-5 ${message.from === "customer" ? "ml-auto bg-forest text-white" : "bg-sage text-ink"}`}>
                {message.text}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              {quickQuestions.map((question) => (
                <button key={question} onClick={() => sendMessage(question)} className="rounded-full border border-forest/20 px-3 py-1.5 text-left text-xs text-forest hover:bg-sage">{question}</button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3">
            <input aria-label="Chat message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question..." className="form-input min-w-0 flex-1 rounded-full border-black/15 text-sm" />
            <button aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white hover:bg-ink"><Send size={16} /></button>
          </form>
        </section>
      )}
      <button onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? "Close customer service chat" : "Open customer service chat"} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-white shadow-lg transition hover:bg-ink">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
