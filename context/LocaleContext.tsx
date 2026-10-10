"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "my" | "th" | "zh" | "es";
export const languages: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "my", label: "မြန်မာ" },
  { code: "th", label: "ไทย" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
];

const translations: Record<string, Record<Language, string>> = {
  "nav.announcement": { en: "Thoughtful goods, made to last. Local demo storefront · USD and MMK pricing.", my: "တာရှည်အသုံးခံရန် ဂရုတစိုက်ပြုလုပ်ထားသည်။ ဒေသတွင်း စမ်းသပ်ဆိုင် · USD နှင့် MMK ဈေးနှုန်းများ။", th: "สินค้าคัดสรรที่ออกแบบมาให้ใช้ได้นาน ร้านค้าตัวอย่าง · ราคา USD และ MMK", zh: "用心打造，经久耐用。演示商店 · USD 与 MMK 双币价格。", es: "Artículos cuidadosamente elegidos y hechos para durar. Tienda de demostración · Precios en USD y MMK." },
  "nav.shop": { en: "Shop all", my: "အားလုံးကြည့်ရန်", th: "เลือกซื้อทั้งหมด", zh: "全部商品", es: "Comprar todo" },
  "nav.home": { en: "Home", my: "အိမ်သုံး", th: "บ้าน", zh: "家居", es: "Hogar" },
  "nav.kitchen": { en: "Kitchen", my: "မီးဖိုချောင်", th: "ห้องครัว", zh: "厨房", es: "Cocina" },
  "nav.wellness": { en: "Wellness", my: "ကျန်းမာရေး", th: "สุขภาพ", zh: "健康", es: "Bienestar" },
  "nav.account": { en: "Account", my: "အကောင့်", th: "บัญชี", zh: "账户", es: "Cuenta" },
  "nav.search": { en: "Search...", my: "ရှာဖွေရန်...", th: "ค้นหา...", zh: "搜索...", es: "Buscar..." },
  "home.heroEyebrow": { en: "A slower kind of everyday", my: "နေ့စဉ်ဘဝကို အေးဆေးစွာ", th: "ใช้ชีวิตประจำวันอย่างผ่อนคลาย", zh: "慢享日常时光", es: "Un día a día más pausado" },
  "home.heroTitle": { en: "Make room for the good things.", my: "ကောင်းမွန်သောအရာများအတွက် နေရာဖန်တီးပါ။", th: "เติมพื้นที่ให้สิ่งดีๆ", zh: "为美好留出空间。", es: "Haz espacio para las cosas buenas." },
  "home.heroText": { en: "Thoughtfully chosen pieces for your home, your rituals, and all the moments in between.", my: "သင့်အိမ်နှင့် နေ့စဉ်အချိန်များအတွက် ဂရုတစိုက်ရွေးချယ်ထားသော ပစ္စည်းများ။", th: "สินค้าคัดสรรเพื่อบ้าน กิจวัตร และทุกช่วงเวลาของคุณ", zh: "为您的家、日常习惯和生活点滴精心挑选。", es: "Artículos elegidos con cuidado para tu hogar y tus momentos." },
  "home.explore": { en: "Explore the collection", my: "ကုန်ပစ္စည်းများကြည့်ရန်", th: "เลือกชมสินค้า", zh: "浏览商品", es: "Explorar la colección" },
  "home.categoryTitle": { en: "Shop by category", my: "အမျိုးအစားအလိုက် ဝယ်ယူရန်", th: "เลือกซื้อตามหมวดหมู่", zh: "按类别选购", es: "Comprar por categoría" },
  "home.favoritesTitle": { en: "The little things we love", my: "ကျွန်ုပ်တို့နှစ်သက်သော ပစ္စည်းလေးများ", th: "สิ่งเล็กๆ ที่เราชื่นชอบ", zh: "我们喜爱的小物", es: "Pequeños detalles que nos encantan" },
  "home.shopAll": { en: "Shop all", my: "အားလုံးကြည့်ရန်", th: "เลือกซื้อทั้งหมด", zh: "全部商品", es: "Ver todo" },
  "home.careTitle": { en: "Made with care. Meant to be kept.", my: "ဂရုတစိုက်ပြုလုပ်ထားပြီး ရေရှည်အသုံးခံသည်။", th: "ใส่ใจในการผลิต เพื่อการใช้งานที่ยาวนาน", zh: "用心制作，值得珍藏。", es: "Hecho con cuidado. Hecho para durar." },
  "home.getCollection": { en: "Get to know the collection", my: "ကုန်ပစ္စည်းများကို လေ့လာရန်", th: "ทำความรู้จักกับสินค้า", zh: "了解我们的商品", es: "Descubre la colección" },
  "footer.explore": { en: "Explore", my: "ရှာဖွေရန်", th: "สำรวจ", zh: "探索", es: "Explorar" },
  "footer.note": { en: "A little note", my: "မှတ်ချက်လေး", th: "บันทึกเล็กๆ", zh: "小提示", es: "Una nota" },
  "catalog.title": { en: "The collection", my: "ကုန်ပစ္စည်းများ", th: "สินค้าทั้งหมด", zh: "商品目录", es: "La colección" },
  "catalog.subtitle": { en: "Useful, beautiful, and made with a little more care. Find the pieces that feel like you.", my: "အသုံးဝင်ပြီး လှပသော၊ ဂရုတစိုက်ရွေးချယ်ထားသည့် ပစ္စည်းများကို ရှာဖွေပါ။", th: "ค้นหาสินค้าที่มีประโยชน์ สวยงาม และคัดสรรด้วยความใส่ใจ", zh: "探索实用、美观且精心挑选的商品。", es: "Encuentra artículos útiles, bonitos y elegidos con cuidado." },
  "catalog.category": { en: "Category", my: "အမျိုးအစား", th: "หมวดหมู่", zh: "类别", es: "Categoría" },
  "catalog.allCategories": { en: "All categories", my: "အမျိုးအစားအားလုံး", th: "ทุกหมวดหมู่", zh: "所有类别", es: "Todas las categorías" },
  "catalog.maxPrice": { en: "Maximum price", my: "အမြင့်ဆုံးစျေးနှုန်း", th: "ราคาสูงสุด", zh: "最高价格", es: "Precio máximo" },
  "catalog.search": { en: "Search products", my: "ကုန်ပစ္စည်းရှာရန်", th: "ค้นหาสินค้า", zh: "搜索商品", es: "Buscar productos" },
  "catalog.clear": { en: "Clear filters", my: "စစ်ထုတ်မှုများရှင်းရန်", th: "ล้างตัวกรอง", zh: "清除筛选", es: "Borrar filtros" },
  "catalog.sort": { en: "Sort by", my: "စီရန်", th: "เรียงตาม", zh: "排序方式", es: "Ordenar por" },
  "catalog.featured": { en: "Featured", my: "အထူးရွေးချယ်မှု", th: "แนะนำ", zh: "精选", es: "Destacados" },
  "account.title": { en: "Your Evergreen account", my: "သင်၏ Evergreen အကောင့်", th: "บัญชี Evergreen ของคุณ", zh: "您的 Evergreen 账户", es: "Tu cuenta Evergreen" },
  "account.register": { en: "Create your account", my: "အကောင့်ဖွင့်ရန်", th: "สร้างบัญชี", zh: "创建账户", es: "Crear cuenta" },
  "account.welcome": { en: "Welcome back", my: "ပြန်လည်ကြိုဆိုပါသည်", th: "ยินดีต้อนรับกลับ", zh: "欢迎回来", es: "Te damos la bienvenida" },
  "account.phone": { en: "Phone number", my: "ဖုန်းနံပါတ်", th: "หมายเลขโทรศัพท์", zh: "电话号码", es: "Número de teléfono" },
  "account.country": { en: "Country code", my: "နိုင်ငံကုဒ်", th: "รหัสประเทศ", zh: "国家/地区代码", es: "Código de país" },
  "account.password": { en: "Password", my: "စကားဝှက်", th: "รหัสผ่าน", zh: "密码", es: "Contraseña" },
  "account.passwordHint": { en: "Use a 6-digit PIN or a password of at least 6 characters.", my: "ဂဏန်း ၆ လုံး PIN သို့မဟုတ် အနည်းဆုံး စာလုံး ၆ လုံးပါ စကားဝှက်ကို အသုံးပြုပါ။", th: "ใช้ PIN 6 หลัก หรือรหัสผ่านอย่างน้อย 6 ตัวอักษร", zh: "请输入 6 位数字 PIN 或至少 6 个字符的密码。", es: "Usa un PIN de 6 dígitos o una contraseña de al menos 6 caracteres." },
  "account.showPassword": { en: "Show password", my: "စကားဝှက်ပြရန်", th: "แสดงรหัสผ่าน", zh: "显示密码", es: "Mostrar contraseña" },
  "account.hidePassword": { en: "Hide password", my: "စကားဝှက်ဖျောက်ရန်", th: "ซ่อนรหัสผ่าน", zh: "隐藏密码", es: "Ocultar contraseña" },
  "account.signIn": { en: "Sign in", my: "ဝင်ရန်", th: "เข้าสู่ระบบ", zh: "登录", es: "Iniciar sesión" },
  "account.create": { en: "Create account", my: "အကောင့်ဖွင့်ရန်", th: "สร้างบัญชี", zh: "创建账户", es: "Crear cuenta" },
  "account.fullName": { en: "Full name", my: "အမည်အပြည့်အစုံ", th: "ชื่อ-นามสกุล", zh: "姓名", es: "Nombre completo" },
  "account.toggleToSignIn": { en: "Already have an account? Sign in", my: "အကောင့်ရှိပြီးသားလား။ ဝင်ပါ", th: "มีบัญชีแล้ว? เข้าสู่ระบบ", zh: "已有账户？登录", es: "¿Ya tienes cuenta? Inicia sesión" },
  "account.toggleToRegister": { en: "New here? Create an account", my: "အသစ်လား။ အကောင့်ဖွင့်ပါ", th: "สมาชิกใหม่? สร้างบัญชี", zh: "新用户？创建账户", es: "¿Nuevo aquí? Crea una cuenta" },
  "account.phonePlaceholder": { en: "Enter phone number", my: "ဖုန်းနံပါတ်ထည့်ပါ", th: "กรอกหมายเลขโทรศัพท์", zh: "输入电话号码", es: "Introduce tu teléfono" },
  "account.authDescription": { en: "Use a phone number and password. This browser-only demo is not production authentication.", my: "ဖုန်းနံပါတ်နှင့် စကားဝှက်ကို အသုံးပြုပါ။ ဤဘရောက်ဆာသီးသန့် စမ်းသပ်မှုသည် အမှန်တကယ်အကောင့်စနစ် မဟုတ်ပါ။", th: "ใช้หมายเลขโทรศัพท์และรหัสผ่าน การสาธิตนี้ทำงานในเบราว์เซอร์เท่านั้น ไม่ใช่ระบบยืนยันตัวตนจริง", zh: "使用电话号码和密码。此演示仅在浏览器中运行，并非正式身份验证。", es: "Usa un teléfono y una contraseña. Esta demostración solo funciona en el navegador y no es autenticación real." },
  "product.quantity": { en: "Quantity", my: "အရေအတွက်", th: "จำนวน", zh: "数量", es: "Cantidad" },
  "product.addToBag": { en: "Add to bag", my: "အိတ်ထဲထည့်ရန်", th: "เพิ่มลงถุง", zh: "加入购物袋", es: "Añadir a la cesta" },
  "product.addedToBag": { en: "Added to your bag", my: "အိတ်ထဲသို့ ထည့်ပြီးပါပြီ", th: "เพิ่มลงในถุงแล้ว", zh: "已加入购物袋", es: "Añadido a tu cesta" },
  "product.home": { en: "Home", my: "ပင်မ", th: "หน้าแรก", zh: "首页", es: "Inicio" },
  "product.shop": { en: "Shop", my: "ဆိုင်", th: "เลือกซื้อ", zh: "商店", es: "Tienda" },
  "product.compareAt": { en: "Original price", my: "မူရင်းဈေးနှုန်း", th: "ราคาเดิม", zh: "原价", es: "Precio original" },
  "product.delivery": { en: "Delivery options are confirmed with your seller", my: "ပို့ဆောင်မှုရွေးချယ်စရာများကို ရောင်းချသူနှင့် အတည်ပြုပါမည်", th: "ยืนยันตัวเลือกการจัดส่งกับผู้ขาย", zh: "配送选项将与卖家确认", es: "Las opciones de entrega se confirman con el vendedor" },
  "product.packaging": { en: "Carefully packed with recyclable materials", my: "ပြန်လည်အသုံးပြုနိုင်သော ပစ္စည်းများဖြင့် ဂရုတစိုက်ထုပ်ပိုးထားသည်", th: "บรรจุอย่างใส่ใจด้วยวัสดุที่รีไซเคิลได้", zh: "使用可回收材料精心包装", es: "Empaquetado con cuidado en materiales reciclables" },
  "product.returns": { en: "30-day returns, no questions asked", my: "ရက် ၃၀ အတွင်း အကြောင်းပြချက်မလိုဘဲ ပြန်လဲနိုင်သည်", th: "คืนสินค้าได้ภายใน 30 วันโดยไม่มีเงื่อนไข", zh: "30 天内可退货，无需理由", es: "Devoluciones durante 30 días sin preguntas" },
  "product.together": { en: "Good together", my: "တွဲဖက်အသုံးပြုရန်", th: "เข้ากันได้ดี", zh: "搭配好物", es: "Combina bien" },
  "product.moreFrom": { en: "More from", my: "ဤအမျိုးအစားမှ ထပ်မံကြည့်ရန်", th: "เพิ่มเติมจาก", zh: "更多来自", es: "Más de" },
  "cart.eyebrow": { en: "A few good things", my: "နှစ်သက်ဖွယ်ပစ္စည်းလေးများ", th: "ของดีสักสองสามชิ้น", zh: "几件心仪好物", es: "Unas cuantas cosas buenas" },
  "cart.emptyTitle": { en: "Your bag is taking a little break.", my: "သင့်အိတ်လေး ခဏနားနေပါတယ်။", th: "ถุงสินค้าของคุณกำลังพักสักครู่", zh: "购物袋暂时空空如也。", es: "Tu cesta se está tomando un descanso." },
  "cart.emptyDescription": { en: "It’s looking a little empty in here. Find something thoughtful to bring home.", my: "အိတ်ထဲမှာ ပစ္စည်းမရှိသေးပါ။ အိမ်ယူသွားရန် နှစ်သက်ဖွယ်ပစ္စည်းတစ်ခု ရှာဖွေပါ။", th: "ในนี้ยังว่างอยู่ ลองหาสิ่งดีๆ กลับบ้านสักชิ้น", zh: "购物袋里还空空的，挑选一件心仪好物带回家吧。", es: "Está un poco vacía. Encuentra algo especial para llevar a casa." },
  "cart.explore": { en: "Explore the collection", my: "ပစ္စည်းများကို လေ့လာရန်", th: "เลือกชมสินค้า", zh: "浏览商品", es: "Explorar la colección" },
  "cart.remove": { en: "Remove", my: "ဖယ်ရှားရန်", th: "นำออก", zh: "移除", es: "Quitar" },
  "cart.promoCode": { en: "Promo code", my: "လျှော့စျေးကုဒ်", th: "โค้ดส่วนลด", zh: "促销代码", es: "Código promocional" },
  "cart.apply": { en: "Apply", my: "အသုံးပြုရန်", th: "ใช้", zh: "使用", es: "Aplicar" },
  "cart.promoError": { en: "That code didn’t work. Try WELCOME10.", my: "ကုဒ်မှားနေပါသည်။ WELCOME10 ကို စမ်းကြည့်ပါ။", th: "โค้ดไม่ถูกต้อง ลองใช้ WELCOME10", zh: "代码无效，请试试 WELCOME10。", es: "El código no funciona. Prueba WELCOME10." },
  "cart.promoApplied": { en: "Welcome! Your 10% discount has been applied.", my: "ကြိုဆိုပါတယ်။ ၁၀% လျှော့စျေးကို အသုံးပြုပြီးပါပြီ။", th: "ยินดีต้อนรับ! ใช้ส่วนลด 10% แล้ว", zh: "欢迎！已为您应用 10% 折扣。", es: "¡Bienvenido! Se aplicó tu descuento del 10%." },
  "cart.deliveryNote": { en: "Delivery options are confirmed at checkout. Prices are shown in USD and MMK.", my: "ပို့ဆောင်မှုရွေးချယ်စရာများကို ငွေရှင်းချိန်တွင် အတည်ပြုပါမည်။ ဈေးနှုန်းများကို USD နှင့် MMK ဖြင့် ဖော်ပြထားသည်။", th: "ยืนยันตัวเลือกการจัดส่งเมื่อชำระเงิน ราคาแสดงเป็น USD และ MMK", zh: "配送选项将在结账时确认。价格以 USD 和 MMK 显示。", es: "Las opciones de entrega se confirman al pagar. Los precios se muestran en USD y MMK." },
  "cart.continueShopping": { en: "Continue shopping", my: "ဆက်လက်ဝယ်ယူရန်", th: "เลือกซื้อสินค้าต่อ", zh: "继续购物", es: "Seguir comprando" },
  "checkout.loading": { en: "Loading checkout…", my: "ငွေရှင်းရန် ဖွင့်နေသည်…", th: "กำลังโหลดหน้าชำระเงิน…", zh: "正在加载结账页面…", es: "Cargando el pago…" },
  "checkout.orderReceived": { en: "Order received", my: "မှာယူမှု လက်ခံရရှိပါပြီ", th: "ได้รับคำสั่งซื้อแล้ว", zh: "已收到订单", es: "Pedido recibido" },
  "checkout.thankYou": { en: "Thank you for shopping thoughtfully.", my: "ဂရုတစိုက်ရွေးချယ်ဝယ်ယူသည့်အတွက် ကျေးဇူးတင်ပါသည်။", th: "ขอบคุณที่เลือกซื้อสินค้าด้วยความใส่ใจ", zh: "感谢您的用心选购。", es: "Gracias por comprar con cuidado." },
  "checkout.orderConfirmation": { en: "Your demo order is confirmed. No payment was processed. Seller orders include the delivery address and any GPS coordinates you chose to share.", my: "စမ်းသပ်မှာယူမှု အတည်ပြုပြီးပါပြီ။ ငွေပေးချေမှု မလုပ်ဆောင်ပါ။ ရောင်းချသူ၏ မှာယူမှုတွင် ပို့ဆောင်ရန်လိပ်စာနှင့် သင်မျှဝေရန်ရွေးချယ်ထားသော GPS ကိုဩဒိနိတ်များ ပါဝင်သည်။", th: "ยืนยันคำสั่งซื้อทดลองแล้ว ไม่มีการชำระเงินจริง คำสั่งซื้อของผู้ขายจะมีที่อยู่จัดส่งและพิกัด GPS ที่คุณเลือกแชร์", zh: "演示订单已确认，未进行任何付款。卖家订单将包含配送地址及您选择分享的 GPS 坐标。", es: "Tu pedido de prueba está confirmado. No se procesó ningún pago. Los pedidos incluyen la dirección y las coordenadas GPS que decidas compartir." },
  "checkout.backToShop": { en: "Back to the shop", my: "ဆိုင်သို့ ပြန်သွားရန်", th: "กลับไปที่ร้าน", zh: "返回商店", es: "Volver a la tienda" },
  "checkout.emptyTitle": { en: "Your bag is empty", my: "သင့်အိတ်ထဲတွင် ပစ္စည်းမရှိပါ", th: "ถุงสินค้าของคุณว่างเปล่า", zh: "购物袋为空", es: "Tu cesta está vacía" },
  "checkout.emptyDescription": { en: "Add something you love before heading to checkout.", my: "ငွေမရှင်းမီ သင်နှစ်သက်သောပစ္စည်းတစ်ခု ထည့်ပါ။", th: "เพิ่มสินค้าที่ชอบก่อนดำเนินการชำระเงิน", zh: "结账前请先添加您喜欢的商品。", es: "Añade algo que te guste antes de pagar." },
  "checkout.browse": { en: "Browse the collection", my: "ပစ္စည်းများကို ကြည့်ရန်", th: "เลือกชมสินค้า", zh: "浏览商品", es: "Ver la colección" },
  "checkout.eyebrow": { en: "Almost yours", my: "သင့်အတွက် မကြာမီ", th: "ใกล้เป็นของคุณแล้ว", zh: "即将属于您", es: "Casi es tuyo" },
  "checkout.backToBag": { en: "Back to bag", my: "အိတ်သို့ ပြန်သွားရန်", th: "กลับไปที่ถุงสินค้า", zh: "返回购物袋", es: "Volver a la cesta" },
  "checkout.firstName": { en: "First name", my: "အမည်", th: "ชื่อ", zh: "名字", es: "Nombre" },
  "checkout.lastName": { en: "Last name", my: "မျိုးရိုးအမည်", th: "นามสกุล", zh: "姓氏", es: "Apellido" },
  "checkout.phone": { en: "Phone number", my: "ဖုန်းနံပါတ်", th: "หมายเลขโทรศัพท์", zh: "电话号码", es: "Número de teléfono" },
  "checkout.street": { en: "Street address / building", my: "လမ်းလိပ်စာ / အဆောက်အအုံ", th: "ที่อยู่ / อาคาร", zh: "街道地址 / 楼宇", es: "Dirección / edificio" },
  "checkout.township": { en: "Township", my: "မြို့နယ်", th: "เขต / อำเภอ", zh: "镇区", es: "Municipio" },
  "checkout.city": { en: "City / town", my: "မြို့", th: "เมือง", zh: "城市", es: "Ciudad" },
  "checkout.region": { en: "Region / state", my: "တိုင်းဒေသကြီး / ပြည်နယ်", th: "เขต / รัฐ", zh: "地区 / 州", es: "Región / estado" },
  "checkout.landmark": { en: "Nearby landmark / delivery instructions", my: "အနီးအနား အထင်ကရနေရာ / ပို့ဆောင်ရန်ညွှန်ကြားချက်", th: "จุดสังเกตใกล้เคียง / คำแนะนำการจัดส่ง", zh: "附近地标 / 配送说明", es: "Punto de referencia / instrucciones de entrega" },
  "checkout.gpsTitle": { en: "Optional GPS location", my: "GPS တည်နေရာ (ရွေးချယ်နိုင်သည်)", th: "ตำแหน่ง GPS (ไม่บังคับ)", zh: "GPS 位置（可选）", es: "Ubicación GPS opcional" },
  "checkout.gpsDescription": { en: "Share your device coordinates with the seller for delivery. Your browser will ask for permission; you can continue with the detailed address only.", my: "ပို့ဆောင်ရန်အတွက် သင့်စက်၏ကိုဩဒိနိတ်များကို ရောင်းချသူထံ မျှဝေပါ။ ဘရောက်ဆာက ခွင့်ပြုချက်တောင်းပါမည်။ လိပ်စာအသေးစိတ်ဖြင့်လည်း ဆက်လက်နိုင်သည်။", th: "แชร์พิกัดอุปกรณ์กับผู้ขายเพื่อจัดส่ง เบราว์เซอร์จะขออนุญาต และคุณสามารถใช้ที่อยู่โดยละเอียดแทนได้", zh: "与卖家分享设备坐标以便配送。浏览器会请求权限；您也可以仅填写详细地址继续。", es: "Comparte tus coordenadas con el vendedor para la entrega. El navegador pedirá permiso; también puedes continuar solo con la dirección." },
  "checkout.useLocation": { en: "Use my current location", my: "လက်ရှိတည်နေရာကို အသုံးပြုရန်", th: "ใช้ตำแหน่งปัจจุบัน", zh: "使用当前位置", es: "Usar mi ubicación actual" },
  "checkout.coordinates": { en: "Coordinates", my: "ကိုဩဒိနိတ်များ", th: "พิกัด", zh: "坐标", es: "Coordenadas" },
  "checkout.gpsAdded": { en: "GPS coordinates added to your order.", my: "GPS ကိုဩဒိနိတ်များကို မှာယူမှုတွင် ထည့်ပြီးပါပြီ။", th: "เพิ่มพิกัด GPS ในคำสั่งซื้อแล้ว", zh: "GPS 坐标已添加到订单。", es: "Se añadieron las coordenadas GPS al pedido." },
  "checkout.gpsUnavailable": { en: "GPS is not available in this browser. Please provide a detailed address.", my: "ဤဘရောက်ဆာတွင် GPS မရနိုင်ပါ။ လိပ်စာအသေးစိတ်ကို ဖြည့်ပါ။", th: "เบราว์เซอร์นี้ไม่รองรับ GPS โปรดระบุที่อยู่โดยละเอียด", zh: "此浏览器无法使用 GPS，请填写详细地址。", es: "El GPS no está disponible en este navegador. Indica una dirección detallada." },
  "checkout.gpsDenied": { en: "Location permission was not granted. You can still place an order with a detailed address.", my: "တည်နေရာခွင့်ပြုချက် မရရှိပါ။ လိပ်စာအသေးစိတ်ဖြင့် မှာယူနိုင်ပါသည်။", th: "ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง คุณยังสั่งซื้อได้โดยระบุที่อยู่โดยละเอียด", zh: "未获得位置权限。您仍可填写详细地址下单。", es: "No se concedió el permiso de ubicación. Puedes hacer el pedido con una dirección detallada." },
  "checkout.gpsError": { en: "Unable to read GPS location. Please provide a detailed address.", my: "GPS တည်နေရာကို ဖတ်၍မရပါ။ လိပ်စာအသေးစိတ်ကို ဖြည့်ပါ။", th: "อ่านตำแหน่ง GPS ไม่ได้ โปรดระบุที่อยู่โดยละเอียด", zh: "无法读取 GPS 位置，请填写详细地址。", es: "No se pudo leer la ubicación GPS. Indica una dirección detallada." },
  "checkout.paymentDemo": { en: "Demo selection only. This checkout does not request payment details or transfer money.", my: "စမ်းသပ်ရွေးချယ်မှုသာဖြစ်သည်။ ငွေရှင်းမှုတွင် ငွေပေးချေမှုအချက်အလက် မတောင်းခံသလို ငွေလွှဲခြင်းလည်း မရှိပါ။", th: "เป็นการเลือกเพื่อสาธิตเท่านั้น ไม่มีการขอข้อมูลการชำระเงินหรือโอนเงินจริง", zh: "仅供演示选择。本结账流程不会请求付款信息或转账。", es: "Solo es una selección de demostración. No se solicitan datos ni se transfiere dinero." },
  "checkout.securityNotice": { en: "Demo checkout only: order and delivery details are stored in this browser and are not sent to a seller’s server.", my: "စမ်းသပ်ငွေရှင်းမှုသာဖြစ်သည်။ မှာယူမှုနှင့် ပို့ဆောင်မှုအချက်အလက်များကို ဤဘရောက်ဆာတွင်သာ သိမ်းဆည်းပြီး ရောင်းချသူဆာဗာသို့ မပို့ပါ။", th: "การชำระเงินทดลองเท่านั้น: รายละเอียดคำสั่งซื้อและการจัดส่งจะถูกเก็บไว้ในเบราว์เซอร์นี้และไม่ส่งไปยังเซิร์ฟเวอร์ผู้ขาย", zh: "仅为演示结账：订单和配送信息保存在此浏览器中，不会发送至卖家服务器。", es: "Pago de demostración: los datos del pedido y la entrega se guardan en este navegador y no se envían al servidor del vendedor." },
  "checkout.yourOrder": { en: "Your order", my: "သင့်မှာယူမှု", th: "คำสั่งซื้อของคุณ", zh: "您的订单", es: "Tu pedido" },
  "checkout.shippingNote": { en: "Shipping calculated after address confirmation.", my: "လိပ်စာအတည်ပြုပြီးနောက် ပို့ဆောင်ခကို တွက်ချက်ပါမည်။", th: "คำนวณค่าจัดส่งหลังยืนยันที่อยู่", zh: "确认地址后计算运费。", es: "El envío se calcula al confirmar la dirección." },
  "cart.title": { en: "Your bag", my: "သင့်အိတ်", th: "ถุงสินค้าของคุณ", zh: "购物袋", es: "Tu cesta" },
  "cart.summary": { en: "Order summary", my: "မှာယူမှုအကျဉ်းချုပ်", th: "สรุปรายการสั่งซื้อ", zh: "订单摘要", es: "Resumen del pedido" },
  "cart.subtotal": { en: "Subtotal", my: "စုစုပေါင်း", th: "ยอดรวมย่อย", zh: "小计", es: "Subtotal" },
  "cart.discount": { en: "Discount (10%)", my: "လျှော့စျေး (၁၀%)", th: "ส่วนลด (10%)", zh: "折扣 (10%)", es: "Descuento (10%)" },
  "cart.tax": { en: "Estimated tax (8%)", my: "ခန့်မှန်းအခွန် (၈%)", th: "ภาษีโดยประมาณ (8%)", zh: "预估税费 (8%)", es: "Impuestos estimados (8%)" },
  "cart.total": { en: "Total", my: "စုစုပေါင်း", th: "ทั้งหมด", zh: "总计", es: "Total" },
  "cart.checkout": { en: "Continue to checkout", my: "ငွေရှင်းရန်", th: "ดำเนินการชำระเงิน", zh: "前往结账", es: "Continuar al pago" },
  "checkout.title": { en: "Checkout", my: "ငွေရှင်းရန်", th: "ชำระเงิน", zh: "结账", es: "Pago" },
  "checkout.contact": { en: "Contact information", my: "ဆက်သွယ်ရန်အချက်အလက်", th: "ข้อมูลติดต่อ", zh: "联系信息", es: "Información de contacto" },
  "checkout.shipping": { en: "Shipping address", my: "ပို့ဆောင်ရမည့်လိပ်စာ", th: "ที่อยู่จัดส่ง", zh: "收货地址", es: "Dirección de envío" },
  "checkout.payment": { en: "Payment method", my: "ငွေပေးချေမှုနည်းလမ်း", th: "วิธีชำระเงิน", zh: "付款方式", es: "Método de pago" },
  "checkout.placeOrder": { en: "Place demo order", my: "စမ်းသပ်မှာယူမှုတင်ရန်", th: "ยืนยันคำสั่งซื้อทดลอง", zh: "提交演示订单", es: "Realizar pedido de prueba" },
  "common.loading": { en: "Loading...", my: "ဖွင့်နေသည်...", th: "กำลังโหลด...", zh: "加载中...", es: "Cargando..." },
};

type LocaleContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const LANGUAGE_KEY = "evergreen-market-language";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (saved && languages.some((item) => item.code === saved)) {
      setLanguageState(saved as Language);
    }
    setHydrated(true);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(LANGUAGE_KEY, next);
  }, []);
  const t = useCallback(
    (key: string) => translations[key]?.[language] ?? translations[key]?.en ?? key,
    [language],
  );
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  useEffect(() => {
    if (hydrated) document.documentElement.lang = language;
  }, [hydrated, language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider.");
  return context;
}
