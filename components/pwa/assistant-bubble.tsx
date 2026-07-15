import * as React from "react"
import { Bot, Send, User, X } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent } from "@/components/ui/marker"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

import type { ChatMessage, Device, ElectricityLog, Prediction } from "./types"

const welcomeMessage: React.ReactNode = (
  <div className="space-y-3 text-sm">
    <p>⚡ <strong>Kenalan dengan AI Smart Assistant!</strong> 🤖</p>
    <p>Bingung kenapa tagihan listrik tiba-tiba naik? Ingin tahu penggunaan listrik rumah secara real-time tanpa harus membaca banyak angka? Sekarang semuanya jadi lebih mudah!</p>
    <p>✨ <strong>AI Smart Assistant</strong> siap membantu Anda 24/7 untuk:</p>
    <ul className="list-inside space-y-1">
      <li>🔹 Menjawab pertanyaan seputar konsumsi listrik rumah.</li>
      <li>🔹 Menampilkan estimasi tagihan listrik secara instan.</li>
      <li>🔹 Memberikan analisis penyebab kenaikan penggunaan listrik.</li>
      <li>🔹 Menjelaskan hasil prediksi konsumsi listrik bulan berikutnya.</li>
      <li>🔹 Membantu mengoperasikan fitur aplikasi, mulai dari monitoring hingga kontrol perangkat.</li>
    </ul>
    <p>💬 Cukup ketik pertanyaan seperti:</p>
    <ul className="list-disc list-inside space-y-1 ml-1 text-muted-foreground">
      <li>"Berapa estimasi tagihan saya bulan ini?"</li>
      <li>"Kenapa konsumsi listrik saya meningkat?"</li>
      <li>"Bagaimana cara menambahkan perangkat baru?"</li>
      <li>"Apakah relay ruang tamu sedang aktif?"</li>
    </ul>
    <p>AI akan menganalisis data perangkat Anda dan memberikan jawaban yang cepat, mudah dipahami, dan relevan.</p>
    <p>⚡ <strong>Lebih dari sekadar chatbot.</strong><br/>AI Smart Assistant adalah asisten cerdas yang memahami data monitoring listrik Anda sehingga mampu memberikan informasi, rekomendasi, dan bantuan secara personal kapan saja.</p>
    <p className="font-semibold text-primary">Pantau. Analisis. Hemat Energi. Semua dalam satu aplikasi.</p>
  </div>
)

const INITIAL_CHAT: ChatMessage[] = [
  { id: "welcome-msg", role: "assistant", content: welcomeMessage },
]

interface AssistantBubbleProps {
  devices: Device[]
  logs: ElectricityLog[]
  prediction: Prediction | undefined
}

export function AssistantBubble({ devices, logs, prediction }: AssistantBubbleProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_CHAT)
  const [inputValue, setInputValue] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setIsTyping(true)

    try {
      if (!window.puter) {
        throw new Error("Puter.js belum dimuat.")
      }

      // Format data untuk system prompt
      const devicesInfo = devices.map(d => `- ${d.name} (ID: ${d.id}, Status: ${d.relayStatus})`).join('\n')
      const predictionInfo = prediction 
        ? `Prediksi biaya bulan ini: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(prediction.cost)}.`
        : "Belum ada prediksi biaya."

      const systemPrompt = `Anda adalah AI Smart Assistant bernama WattWise yang ramah dan cerdas. Tugas Anda adalah membantu pengguna memahami penggunaan listrik mereka.
Gunakan bahasa Indonesia yang santai tapi sopan.

Data rumah pengguna saat ini:
Daftar Perangkat:
${devicesInfo}

${predictionInfo}

Jawablah pertanyaan pengguna berikut berdasarkan data di atas dengan singkat dan jelas. Jangan menjawab hal-hal yang tidak relevan dengan listrik atau sistem ini.`

      const response = await window.puter.ai.chat(
        `${systemPrompt}\n\nPertanyaan: ${inputValue.trim()}`
      )

      const botResponse = typeof response === "string" ? response : response?.message?.content || "Maaf, saya tidak mengerti."

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botResponse,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (error) {
      console.error("Gagal mendapatkan respons AI:", error)
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan saat menghubungi server AI. Pastikan koneksi internet stabil atau coba lagi nanti.",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[88px] right-4 z-50 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Bot className="size-6" />
        </Button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-[88px] right-4 z-50 flex h-[600px] max-h-[calc(100vh-140px)] w-[calc(100vw-32px)] sm:w-[400px] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary p-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="size-5" />
              <span className="font-semibold text-sm">AI Smart Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 min-h-0 relative">
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="absolute inset-0">
                <MessageScrollerViewport>
                  <MessageScrollerContent className="p-4 gap-6">
                    {messages.map((msg) => (
                      <MessageScrollerItem
                        key={msg.id}
                        scrollAnchor={msg.role === "user"}
                      >
                        <Message align={msg.role === "user" ? "end" : "start"}>
                          <MessageAvatar>
                            <Avatar className="h-8 w-8">
                              {msg.role === "user" ? (
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  <User className="size-4" />
                                </AvatarFallback>
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <Bot className="size-4" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </MessageAvatar>
                          <MessageContent>
                            <Bubble variant={msg.role === "user" ? "default" : "muted"}>
                              <BubbleContent>
                                {typeof msg.content === "string" ? (
                                  <ReactMarkdown
                                    components={{
                                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-2" {...props} />,
                                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-2" {...props} />,
                                      li: ({ node, ...props }) => <li className="ml-1" {...props} />,
                                      strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                    }}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                ) : (
                                  msg.content
                                )}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))}
                    {isTyping && (
                      <MessageScrollerItem>
                        <Marker role="status">
                          <MarkerContent className="flex items-center gap-2 text-muted-foreground p-2">
                            <Bot className="size-4" />
                            <span className="animate-pulse">AI is typing...</span>
                          </MarkerContent>
                        </Marker>
                      </MessageScrollerItem>
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </div>

          {/* Input Area */}
          <div className="border-t p-3 bg-background">
            <form
              onSubmit={handleSend}
              className="flex w-full items-center space-x-2 rounded-full border bg-muted/50 px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tanya AI Assistant..."
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isTyping}
                className="rounded-full shrink-0 h-9 w-9"
              >
                <Send className="size-4" />
                <span className="sr-only">Kirim</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
