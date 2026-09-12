# Markdown Studio - Feature Expansion Roadmap 🚀

เอกสารฉบับนี้รวบรวมแนวทางและไอเดียการพัฒนาต่อยอดสำหรับโปรเจกต์ **Markdown Studio** เพื่อยกระดับให้เป็น **Production-Ready & Developer Platform** ระดับสากล

---

## 🔌 1. API Endpoints & Developer Integration (ระบบหลังบ้าน)

| Method | Endpoint | Description | Use Cases |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/convert` | แปลง Markdown เป็น HTML + คืนค่าสถิติ (คำ, อักขระ, เวลาอ่าน) | ให้แอปอื่นส่งเนื้อหามาขอ HTML ไปใช้งาน |
| `POST` | `/api/pdf` | เรนเดอร์ Markdown เป็นไฟล์ PDF สวยงาม | พิมพ์รายงาน / เอกสารผ่าน API |
| `POST` | `/api/toc` | สกัดเอาเฉพาะโครงสร้างหัวข้อ (`#`, `##`) ออกมาเป็น JSON Outline | สร้างเมนูนำทาง (Sidebar/Navigation) |
| `POST` | `/api/validate` | Linter ตรวจสอบความถูกต้องของไวยากรณ์และลิงก์เสีย | ตรวจสอบเอกสารใน CI/CD Pipeline |
| `POST` | `/api/sanitize` | จัดระเบียบเว้นวรรคและจัดตารางที่เบี้ยวให้อัตโนมัติ | ทำความสะอาดเอกสารให้อยู่ในมาตรฐาน |
| `POST` | `/api/summary` | สกัดเอาเฉพาะ Plaintext สั้นๆ ตัดสัญลักษณ์ Markdown ออก | ทำ SEO Meta Description / คำโปรย |
| `GET` | `/api/og` | สร้างรูปภาพ Social Card Preview อัตโนมัติเมื่อแชร์ลิงก์ | แสดงการ์ดพรีวิวบน Facebook, Discord, Twitter |

---

## 🛠️ 2. Editor & Productivity Enhancements (เครื่องมือบรรณาธิการ)

1. **Command Palette (`Ctrl + K`)**:
   - เมนูด่วนสำหรับค้นหา Template, สลับธีม, สลับ View Mode, หรือรันคำสั่งต่างๆ โดยไม่ต้องละมือจากคีย์บอร์ด
2. **Zen / Focus Mode**:
   - โหมดเขียนแบบไร้สิ่งรบกวน (Distraction-Free) ซ่อนเมนูทั้งหมด เหลือเฉพาะ Editor ตรงกลาง พร้อมเสียงพิมพ์คีย์บอร์ด (Typing Sounds)
3. **Interactive Table Builder**:
   - เครื่องมือสร้างตารางแบบ Visual (เลือกจำนวนแถว x คอลัมน์) แล้วสร้างไวยากรณ์ตาราง Markdown ให้ทันที
4. **Find & Replace (`Ctrl + F` / `Ctrl + H`)**:
   - ระบบค้นหาและแทนที่คำใน Editor พร้อมแสดงจำนวนจุดที่พบ
5. **Custom Snippets Manager**:
   - ระบบบันทึกข้อความหรือแม่แบบส่วนตัวที่ใช้บ่อย เพื่อกดแทรกลงใน Editor ได้รวดเร็ว

---

## 🎨 3. Export, Import & Media Features (การนำออกและมัลติมีเดีย)

1. **Export to High-Res Image (PNG / JPEG)**:
   - แปลงเนื้อหา Markdown ออกมาเป็นรูปภาพพรีวิวการ์ดสวยงาม เหมาะสำหรับนำไปโพสต์ลง Social Media (LinkedIn, Twitter)
2. **Export to DOCX / EPUB**:
   - ส่งออกเอกสารเป็นไฟล์ Microsoft Word (`.docx`) หรือ E-Book (`.epub`)
3. **Cloud Image Upload Integration**:
   - อัปโหลดรูปภาพที่ลากมาวางไปยัง Cloudinary / Imgur / S3 อัตโนมัติ เพื่อรับ URL สาธารณะแทนการใช้ Base64

---

## 👥 4. Collaboration & Cloud Storage (การแชร์และการบันทึก)

1. **Shareable Snippet Cloud (`/s/[id]`)**:
   - สร้างลิงก์สั้นสำหรับแชร์ Markdown Preview ให้ผู้อื่นเปิดดูหรือคัดลอกไปใช้ได้ทันที
2. **GitHub Gist Sync**:
   - เชื่อมต่อบัญชี GitHub เพื่อดึงและบันทึกเอกสารไปยัง GitHub Gist โดยตรง
3. **Google Drive / Dropbox Sync**:
   - บันทึกและเปิดไฟล์ `.md` จาก Cloud Storage โดยตรง

---

## 📱 5. UX, UI & Accessibility (ประสบการณ์ผู้ใช้)

1. **Multi-Tab / Multi-File Workspace**:
   - แถบแท็บสำหรับเปิดทำงานหลายๆ เอกสารพร้อมกันได้ในหน้าต่างเดียว
2. **Progressive Web App (PWA)**:
   - รองรับการกด "Install App" บนคอมพิวเตอร์และมือถือ เพื่อใช้งานเขียน Markdown แบบ Offline 100%
3. **Custom Typography & Dyslexia Friendly Fonts**:
   - ตัวเลือกเปลี่ยนแบบอักษร (Monaco, JetBrains Mono, Fira Code, OpenDyslexic) และปรับขนาดตัวอักษรได้ตามชอบ
