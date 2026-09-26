import { describe, expect, it } from "vitest";
import { barcodeFormat, isValidEan13 } from "./label-barcode";

describe("barcode da etiqueta", () => {
  it("reconhece EAN-13 válido pelo dígito verificador", () => {
    expect(isValidEan13("7891000315507")).toBe(true);
    expect(isValidEan13("4006381333931")).toBe(true);
    expect(isValidEan13("7891000315508")).toBe(false);
    expect(isValidEan13("789100031550")).toBe(false);
  });

  it("usa Code 128 para código que não é EAN", () => {
    expect(barcodeFormat("7891000315507")).toBe("EAN13");
    expect(barcodeFormat("CAM-AZ-M")).toBe("CODE128");
    expect(barcodeFormat("7891000315508")).toBe("CODE128");
  });
});
