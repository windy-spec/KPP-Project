import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Giải mã token để lấy tên

const BASE_API = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/$/, "");

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Chào bạn! Mình là **Chuyên viên KPPaint**. Rất vui được hỗ trợ giải pháp cho ngôi nhà của bạn! 😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Kiểm tra đăng nhập và đổi lời chào
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Đại ca kiểm tra field trong token của mình là gì (name, sub, hay username) nhé
        const userName =
          decoded.name || decoded.username || decoded.sub || "bạn";

        setMessages([
          {
            sender: "bot",
            text: `Chào **${userName}**! Mình là **Chuyên viên KPPaint**. Rất vui được gặp lại và hỗ trợ giải pháp cho ngôi nhà của bạn! 😊`,
          },
        ]);
      } catch (error) {
        console.error("Lỗi giải mã token:", error);
      }
    }
  }, []);

  // 2. Tự động cuộn xuống tin nhắn mới
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 3. RÀO CẢN: Chỉ hiển thị ở trang chủ
  if (location.pathname !== "/") {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BASE_API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Kết nối hiện đang gián đoạn, bạn đợi mình xíu nhé! 😂",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans antialiased">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gradient-to-tr from-[#1a237e] to-[#3949ab] text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center text-3xl hover:scale-110 transition-all border-2 border-white/20"
        >
          🎨
        </button>
      ) : (
        <div className="w-[400px] sm:w-[430px] h-[650px] sm:h-[720px] bg-white rounded-[2.8rem] shadow-[0_30px_80px_rgba(0,0,0,0.25)] flex flex-col border border-white/50 overflow-hidden animate-in slide-in-from-bottom-10">
          {/* HEADER */}
          <div className="bg-[#1a237e] p-7 flex items-center gap-4 text-white shadow-xl relative">
            <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-md transform rotate-3">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
                alt="Advisor"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-wider uppercase">
                KPPaint Advisor
              </h3>
              <p className="text-[10px] text-green-300 font-bold flex items-center gap-1.5 mt-1 uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>{" "}
                ONLINE
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto bg-white/10 hover:bg-red-500/80 p-2.5 rounded-2xl transition-all"
            >
              ✕
            </button>
          </div>

          {/* CHAT BODY */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 scrollbar-hide bg-[#f8faff]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "bot" ? "justify-start" : "justify-end"
                } animate-in fade-in zoom-in duration-300`}
              >
                <div
                  className={`max-w-[90%] p-5 rounded-[2rem] shadow-sm text-sm leading-relaxed ${
                    msg.sender === "bot"
                      ? "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                      : "bg-[#1a237e] text-white rounded-tr-none shadow-indigo-200"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      hr: () => (
                        <div className="my-8 border-t-2 border-dashed border-indigo-100 relative after:content-['✨'] after:absolute after:left-1/2 after:-top-3 after:-translate-x-1/2 after:bg-[#f8faff] after:px-2 after:text-indigo-400" />
                      ),
                      a: ({ href, children }) => (
                        <span
                          onClick={() => href && navigate(href)}
                          className="text-[#1a237e] font-black underline decoration-2 underline-offset-4 cursor-pointer hover:text-red-500 transition-all bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 mx-1 inline-block my-1 shadow-sm"
                        >
                          {children}
                        </span>
                      ),
                      img: ({ src, alt }) => (
                        <div className="w-full rounded-[1.5rem] overflow-hidden shadow-lg my-4 border-2 border-white aspect-video bg-gray-50 flex items-center justify-center group cursor-pointer">
                          <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ),
                      li: ({ children }) => {
                        const content = String(children);
                        const cleanText = content
                          .replace(/^[\d.\s\-•🏷️💰💡]+/, "")
                          .trim();
                        if (cleanText.startsWith("PROMO:"))
                          return (
                            <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black mr-2 mb-2 animate-bounce shadow-sm">
                              🔥 GIẢM {cleanText.split(":")[1]}%
                            </span>
                          );
                        if (cleanText.startsWith("PRICE_OLD:"))
                          return (
                            <span className="block text-gray-400 line-through text-xs mt-2 italic font-semibold">
                              Giá gốc: {cleanText.split(":")[1]}
                            </span>
                          );
                        if (cleanText.startsWith("PRICE_NEW:"))
                          return (
                            <div className="text-xl font-black text-[#1a237e] mb-1 leading-none mt-1">
                              Giá hiện tại: {cleanText.split(":")[1]}
                            </div>
                          );
                        if (cleanText.startsWith("SAVINGS:"))
                          return (
                            <span className="text-[11px] text-green-600 font-bold block mb-3 bg-green-50 w-fit px-2 rounded-md border border-green-100 italic">
                              ✅ Tiết kiệm: {cleanText.split(":")[1]}
                            </span>
                          );
                        if (cleanText.startsWith("DESC:"))
                          return (
                            <div className="text-gray-600 italic bg-indigo-50/40 p-4 rounded-2xl border-l-[6px] border-[#1a237e] mt-2 shadow-inner leading-relaxed text-[13px]">
                              "{cleanText.split(":")[1].trim()}"
                            </div>
                          );
                        return (
                          <li className="mb-2 list-none text-gray-700">
                            {children}
                          </li>
                        );
                      },
                      p: ({ children }) => (
                        <p
                          className={`mb-2 last:mb-0 ${
                            msg.sender === "user"
                              ? "text-white"
                              : "text-gray-800"
                          }`}
                        >
                          {children}
                        </p>
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white border border-gray-100 p-5 rounded-[2rem] rounded-tl-none w-[75%] space-y-4 shadow-sm">
                  <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-[85%]"></div>
                  <div className="h-32 bg-gray-50 rounded-[1.5rem] w-full"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3 bg-gray-50 rounded-[1.5rem] px-5 py-2.5 border-2 border-gray-100 focus-within:border-indigo-200 focus-within:bg-white transition-all duration-300 shadow-inner">
              <input
                className="flex-1 bg-transparent p-2 text-sm outline-none text-gray-700 font-medium"
                placeholder="Bạn cần tư vấn gì cứ nhắn mình nhé..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="w-12 h-12 bg-[#1a237e] text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 hover:bg-indigo-800 transition-all"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
