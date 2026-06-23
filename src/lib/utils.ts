import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (
  amount: number,
  currencyString: string = "أوقية",
) => {
  return (
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0) +
    " " +
    currencyString
  );
};

export const parseDescriptionWithStaff = (description: string) => {
  if (!description) return { text: "", staffName: null };
  const staffMatch = description.match(/ \| @staff:(.+)$/);
  if (staffMatch) {
    return {
      text: description.replace(staffMatch[0], ""),
      staffName: staffMatch[1],
    };
  }
  return {
    text: description,
    staffName: null,
  };
};

export const getCleanDescription = (description: string) => {
  if (!description) return "بدون وصف";
  const { text } = parseDescriptionWithStaff(description);
  if (!text) return "بدون وصف";

  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.is_multi &&
        Array.isArray(parsed.services)
      ) {
        const typeLabels: Record<string, string> = {
          flight: "طيران",
          hotel: "فندق",
          visa: "تأشيرة",
          tour: "جولة سياحية",
          passport: "جواز سفر",
        };
        const srvNames = parsed.services.map((s: any) => {
          const typeLabel = typeLabels[s.type] || s.type;
          const details: string[] = [];
          if (s.description) details.push(s.description);
          if (s.pnr) details.push(`PNR: ${s.pnr}`);
          if (s.passport_number) details.push(`جواز: ${s.passport_number}`);
          if (s.national_id) details.push(`رقم وطني: ${s.national_id}`);

          if (details.length > 0) {
            return `${typeLabel} (${details.join(" - ")})`;
          }
          return typeLabel;
        });
        return srvNames.join(" + ");
      }
    }
  } catch (e) {
    // Ignore and fall back to text
  }
  return text;
};

export const handlePrint = () => {
  window.print();
};

export const exportToPDF = async (elementId: string, filename: string) => {
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById(elementId);
    if (!element) return;

    // Add print styles temporarily for PDF generation if needed, but html2pdf uses the screen styles by default.
    // However, if we want dark text and no borders, the page styles apply.
    const opt = {
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
