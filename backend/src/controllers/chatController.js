import Groq from "groq-sdk";
import dotenv from "dotenv";
import NodeCache from "node-cache";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Discount from "../models/Discount.js";

dotenv.config();

const API_URL = (process.env.API_URL || `http://localhost:5001`).replace(
  /\/$/,
  ""
);
const IMG_BASE_URL = API_URL;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const myCache = new NodeCache({ stdTTL: 3600 });

// Giữ nguyên CATEGORY_MAPPING của bạn...
export const CATEGORY_MAPPING = {
  /* =========================
     SƠN XỊT
  ========================= */
  "Sơn xịt": [
    "sơn xịt",
    "xịt sơn",
    "spray",
    "son xit",
    "atm",
    "win",
    "bosny",
    "nippon spray",
    "xịt xe",
    "xịt kim loại",
    "xịt sắt",
    "xịt gỗ",
    "xịt nhựa",
    "xịt màu",
    "xịt chống rỉ",
    "xịt chống gỉ",
    "xịt bóng",
    "xịt mờ",
  ],

  /* =========================
     SƠN NƯỚC
  ========================= */
  "Sơn nước": [
    "sơn nước",
    "son nuoc",
    "sơn tường",
    "sơn nhà",
    "sơn nội thất",
    "sơn ngoại thất",
    "sơn trong nhà",
    "sơn ngoài trời",
    "sơn lót",
    "lót kháng kiềm",
    "sơn phủ",
    "sơn chống thấm",
    "chống thấm",
    "chống mốc",
    "chống rêu",
    "chống kiềm",
    "sơn bền màu",
    "sơn lau chùi",
    "sơn dễ lau",
    "dulux",
    "jotun",
    "nippon",
    "maxilite",
    "kova",
    "to",
    "spec",
    "expo",
    "mykolor",
    "sơn cao cấp",
    "sơn giá rẻ",
    "sơn mịn",
    "sơn bóng",
    "sơn mờ",
    "sơn trắng",
    "sơn màu",
  ],

  /* =========================
     BỘT TRÉT TƯỜNG
  ========================= */
  "Bột trét tường": [
    "bột trét",
    "bột trét tường",
    "trét tường",
    "bả",
    "bả tường",
    "mastic",
    "matic",
    "matit",
    "bột bả",
    "bột trét trong nhà",
    "bột trét ngoài trời",
    "bột trét nội thất",
    "bột trét ngoại thất",
    "bột trét chống nứt",
    "bột trét chống thấm",
    "bột trét làm phẳng",
  ],

  /* =========================
     SƠN DẦU
  ========================= */
  "Sơn dầu": [
    "sơn dầu",
    "son dau",
    "sơn gỗ",
    "sơn kim loại",
    "sơn sắt",
    "sơn thép",
    "sơn cửa sắt",
    "sơn lan can",
    "sơn hàng rào",
    "sơn đồ gỗ",
    "sơn chống rỉ",
    "chống rỉ",
    "chống gỉ",
    "bạch tuyết",
    "galant",
    "lobster",
    "joton",
    "sơn alkyd",
    "sơn bóng dầu",
    "sơn mờ dầu",
  ],

  /* =========================
     DỤNG CỤ SƠN
  ========================= */
  "Dụng cụ sơn": [
    "dụng cụ",
    "dụng cụ sơn",
    "đồ sơn",
    "phụ kiện sơn",
    "cọ",
    "cọ sơn",
    "cọ quét",
    "cọ lông",
    "lăn",
    "con lăn",
    "ru lô",
    "rulo",
    "lu",
    "cán lăn",
    "khay sơn",
    "khay đựng sơn",
    "bay",
    "bay trét",
    "bàn chà",
    "giấy nhám",
    "nhám",
    "thang sơn",
    "găng tay sơn",
    "băng keo giấy",
    "băng keo sơn",
    "bạt che",
    "bạt phủ",
    "máy phun sơn",
    "súng phun sơn",
  ],

  /* =========================
     SILICONE & KEO
  ========================= */
  "Silicon & Keo xây dựng": [
    "silicon",
    "silicone",
    "keo",
    "keo xây dựng",
    "keo dán",
    "keo chống thấm",
    "keo trám",
    "keo trét",
    "keo dán gạch",
    "keo dán kính",
    "keo dán đá",
    "keo dán gỗ",
    "keo dán kim loại",
    "keo đa năng",
    "apollo",
    "tibon",
    "xbond",
    "webertai",
    "sika",
    "keo silicon trung tính",
    "keo silicon axit",
    "keo chịu nước",
    "keo chịu nhiệt",
  ],
};

// THAY ĐỔI CHIẾN THUẬT: Ép AI trả về JSON để BE tự dựng nội dung
const SYSTEM_INSTRUCTION = `
Bạn là Chuyên viên tư vấn tại KPPaint. Hãy trả về phản hồi dưới định dạng JSON sau:
{
  "advice": "Đoạn văn tư vấn nhiệt tình, chia sẻ mẹo thi công thực tế liên quan đến sản phẩm",
  "suggested_category_link": "Chọn 1 text link phù hợp từ danh sách link chuẩn",
  "product_descriptions": ["Viết lại mô tả mặn mòi cho từng sản phẩm trong context"]
}

DANH SÁCH LINK CHUẨN:
- Sơn nước:  [Ghé thăm kho Sơn nước](/san-pham?page=1&categories=6903093203a32d9127756f46)
- Sơn xịt:  [Thế giới Sơn xịt đa năng](/san-pham?page=1&categories=6903073f03a32d9127756f38)
- Bột trét:  [Bột trét Matic cực mịn](/san-pham?page=1&categories=692ade4b357e6c84295146ce)
- Sơn dầu:  [Sơn dầu bền bỉ](/san-pham?page=1&categories=692ae7f7357e6c8429514e15)
- Silicon:  [Silicon & Keo dán chuyên dụng](/san-pham?page=1&categories=692ae80f357e6c8429514e19)
- Dụng cụ:  [Đồ nghề sơn chuyên nghiệp](/san-pham?page=1&categories=6903075803a32d9127756f3b)
`;

export const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ reply: "Hỏi gì mặn mặn đi bạn ơi! 😎" });

    // 1. Logic tìm kiếm (Giữ nguyên logic của bạn)
    let searchTerm = message.trim().toLowerCase();
    const CATEGORIES_LIST = Object.keys(CATEGORY_MAPPING);
    let detectedCategory = CATEGORIES_LIST.find((cat) =>
      CATEGORY_MAPPING[cat].some((key) => searchTerm.includes(key))
    );

    const [dbCategory, activeDiscounts] = await Promise.all([
      detectedCategory
        ? Category.findOne({
            name: { $regex: detectedCategory, $options: "i" },
          })
        : null,
      Discount.find({ isActive: true }).lean(),
    ]);

    let rawProducts = dbCategory
      ? await Product.find({ category: dbCategory._id })
          .populate("category")
          .limit(5)
          .lean()
      : await Product.find({ name: { $regex: searchTerm, $options: "i" } })
          .populate("category")
          .limit(5)
          .lean();

    const productContext = rawProducts.map((p) => {
      const avatarPath = p.avatar ? p.avatar.replace(/^\//, "") : "";
      const imageUrl = avatarPath
        ? avatarPath.startsWith("http")
          ? avatarPath
          : `${IMG_BASE_URL}/${avatarPath}`
        : `${IMG_BASE_URL}/uploads/default_paint.jpg`;
      let finalPrice = p.price || 0;
      let percent = 0;
      const disc = activeDiscounts.find(
        (d) =>
          (d.target_type === "PRODUCT" &&
            d.target_ids?.some((id) => id.toString() === p._id.toString())) ||
          (d.target_type === "CATEGORY" &&
            p.category &&
            d.target_ids?.some(
              (id) => id.toString() === p.category._id.toString()
            ))
      );
      if (disc) {
        percent = disc.discount_percent;
        finalPrice = p.price * (1 - percent / 100);
      }
      return {
        id: p._id,
        name: p.name.trim(),
        url: `/san-pham/${p._id}`,
        img: imageUrl,
        price_old: p.price.toLocaleString("vi-VN") + " đ",
        price_new: finalPrice.toLocaleString("vi-VN") + " đ",
        percent,
        savings:
          percent > 0
            ? (p.price - finalPrice).toLocaleString("vi-VN") + " đ"
            : null,
        original_desc: p.description,
      };
    });

    // 2. Gọi AI lấy JSON nội dung
    const chat = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: JSON.stringify({
            question: message,
            products: productContext.map((p) => ({
              name: p.name,
              desc: p.original_desc,
            })),
          }),
        },
      ],
      response_format: { type: "json_object" }, // ÉP AI TRẢ VỀ JSON
      temperature: 0.7,
    });

    const aiRes = JSON.parse(chat.choices[0].message.content);

    // 3. TỰ DỰNG CẤU TRÚC (BẢO ĐẢM KHÔNG SAI ĐỊNH DẠNG)
    let finalReply = `Chào bạn! 👋\n\n${aiRes.advice}\n\n`;

    productContext.forEach((p, index) => {
      const customDesc = aiRes.product_descriptions?.[index] || p.original_desc;
      finalReply += `---\n![${p.name}](${p.img})\n### [${p.name}](${p.url})\n`;
      if (p.percent > 0)
        finalReply += `- PROMO: ${p.percent}\n- PRICE_OLD: ${p.price_old}\n`;
      finalReply += `- PRICE_NEW: ${p.price_new}\n`;
      if (p.savings) finalReply += `- SAVINGS: ${p.savings}\n`;
      finalReply += `- DESC: ${customDesc}\n---\n\n`;
    });

    finalReply += `Hy vọng những gợi ý trên giúp bạn hài lòng! ${aiRes.suggested_category_link}`;

    res.json({ reply: finalReply });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ reply: "KPPaint Advisor đang bận pha màu, đợi tí nha! " });
  }
};
