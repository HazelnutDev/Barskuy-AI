import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractTextFromTXT(file: File): Promise<string> {
  return await file.text();
}

export async function processFile(file: File): Promise<{ content: string; type: "pdf" | "docx" | "text" | "image" }> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") {
    return { content: await extractTextFromPDF(file), type: "pdf" };
  } else if (extension === "docx" || extension === "doc") {
    return { content: await extractTextFromDOCX(file), type: "docx" };
  } else if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) {
    return { content: "", type: "image" }; // Images handled separately via base64
  } else {
    return { content: await extractTextFromTXT(file), type: "text" };
  }
}
